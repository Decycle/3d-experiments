import {
  OrbitControls,
  PerspectiveCamera,
  useHelper,
} from '@react-three/drei'
import {
  Canvas,
  extend,
  ReactThreeFiber,
  useFrame,
} from '@react-three/fiber'
import {
  ArrowHelper,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Quaternion,
  ShaderMaterial,
  SphereBufferGeometry,
  SphereGeometry,
  Vector2,
  Vector3,
} from 'three'

import { pipe } from 'fp-ts/function'
import * as NEA from 'fp-ts/NonEmptyArray'
import { useControls } from 'leva'

const SphereShader = () => {
  const vertexShader = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vPos;
    uniform float uTime;
    uniform float uBigWaveElevation;
    uniform vec2 uBigWavesFrequency;
    uniform vec2 uBigWavesSpeed;

    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

    float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
            dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    void main() {
        vUv = uv;
        vPos = position;

        vec3 p = position;
        float elevation =
          sin(p.x * uBigWavesFrequency.x + uTime * uBigWavesSpeed.x) *
          sin(p.y * uBigWavesFrequency.y + uTime * uBigWavesSpeed.y) *
          uBigWaveElevation;
        // p.z += elevation;
        vec4 mvPosition = modelViewMatrix * vec4( p, 1.0 );
        gl_Position = projectionMatrix * mvPosition;
    }
    `

  const fragmentShader = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vPos;
    uniform float uTime;

    const float PI = 3.1415926535897932384626433832795;
    const vec2 S = vec2(1., 1.7320508);

    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
              -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
        dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    float hexSDF(vec2 p)
    {
      p = abs(p);
      return max(dot(p, S * .5), p.x) * 2.;
    }

    vec4 calcHexInfo(vec2 p)
    {
      vec2 hexPosition1 = round(p / S);
      vec2 hexPosition2 = round((p + .5) / S);

      vec2 hexOffset1 = p - hexPosition1 * S;
      vec2 hexOffset2 = p - (hexPosition2 - .5) * S;

      return dot(hexOffset1, hexOffset1)
        < dot(hexOffset2, hexOffset2)
        ? vec4(hexPosition1, hexOffset1)
        : vec4(hexPosition2, hexOffset2);
    }

    float cubicBezier(float t, float p0, float p1, float p2, float p3)
    {
      float t2 = t * t;
      float t3 = t2 * t;

      float a = 1. - t;
      float a2 = a * a;
      float a3 = a2 * a;

      return p0 * a3 + 3. * p1 * a2 * t + 3. * p2 * a * t2 + p3 * t3;
    }

    vec4 grid(vec2 uv, vec2 scale)
    {
      vec2 p = (uv - 0.5) * scale;

      vec4 info = calcHexInfo(p);
      vec4 c = vec4(242., 145., 61., 0.) / 255.;

      vec2 hp = info.xy;
      float hd = hexSDF(info.zw);
      float theta = atan(info.z, info.w);

      c.a += 0.3;
      // c.a += step(0.9, hd);

      float th = mod(theta + uTime * 2., PI * 2.)/ PI / 2.;
      float cubicTheta = cubicBezier(th, 0., -3.4, 5.4, 1.) * PI * 2.;

      c.a += (1.0 - step(0.02, abs(hd - 0.7))) * step(5., cubicTheta) * 0.7;
      // c.a += (1.0 - step(0.02, abs(hd - 0.6))) * step(5.5, mod(theta + uTime + 0.5, PI * 2.))* 0.7;

      float fill = sin(uTime * .5 + snoise(hp) * 10.) + .5;
      // c.a += step(fill, hd) * 0.35;

      return c;
    }

    void main() {
      gl_FragColor = grid(vUv, vec2(10.));
    }
    `

  const {
    width,
    height,
    bigWaveElevation,
    bigWavesFrequency,
    bigWavesSpeed,
  } = useControls({
    width: {
      min: 0.1,
      max: 1000,
      value: 3,
    },
    height: {
      min: 0.1,
      max: 1000,
      value: 3,
    },
    bigWaveElevation: {
      min: 0.01,
      max: 1,
      value: 0.07,
      step: 0.01,
    },
    bigWavesFrequency: {
      x: 3,
      y: 3,
    },
    bigWavesSpeed: {
      x: 1,
      y: 1,
    },
  })

  const sphereMaterial = new ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
      uTime: { value: 0.0 },
      uBigWaveElevation: { value: bigWaveElevation },
      uBigWavesFrequency: {
        value: new Vector2(
          bigWavesFrequency.x,
          bigWavesFrequency.y
        ),
      },
      uBigWavesSpeed: {
        value: new Vector2(
          bigWavesSpeed.x,
          bigWavesSpeed.y
        ),
      },
    },
    side: DoubleSide,
    transparent: true,
  })

  useFrame(
    ({ clock }) =>
      (sphereMaterial.uniforms.uTime.value =
        clock.getElapsedTime())
  )

  return (
    <mesh
      material={sphereMaterial}
      rotation={[-Math.PI / 2, 0, 0]}>
      <planeBufferGeometry
        args={[width, height, 256, 256]}
      />
    </mesh>
  )
}

const Scene = () => {
  return (
    <>
      <SphereShader />
    </>
  )
}

const ShaderCanvas = () => {
  return (
    <Canvas
      dpr={2}
      onCreated={({ camera }) => camera.lookAt(0, 0, 0)}>
      <PerspectiveCamera makeDefault position={[0, 3, 0]} />
      <OrbitControls />
      <Scene />
    </Canvas>
  )
}

export default ShaderCanvas
