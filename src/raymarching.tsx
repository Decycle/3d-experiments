import {
  OrbitControls,
  PerspectiveCamera,
  TransformControls,
  useFBO,
} from '@react-three/drei'
import {
  Canvas,
  createPortal,
  useFrame,
  useThree,
} from '@react-three/fiber'
import { useControls } from 'leva'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Vector3 } from 'three'

const RayMarching = () => {
  const width = 3
  const height = 3
  const length = 3

  const arrayWidth = width * height * length

  const vertexShader = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
        vPosition = (modelMatrix * vec4(position, 1.)).xyz;
        // vPosition = position;
    }
    `
  const fragmentShader = /* glsl */ `
    uniform float uTime;
    uniform float uSmoothFactor;
    uniform float uExposure;
    uniform vec3 uCamPos;
    uniform float uFieldOfView;

    uniform vec3 uMeshPositions[${arrayWidth}];

    varying vec2 vUv;
    varying vec3 vPosition;

    float displacement(vec3 p) {
        float displacement = 0.;
        displacement += sin(p.x * 5.) * sin(p.y * 5.) * sin(p.z * 5.) * 0.2;
        displacement += sin(p.x * 10.) * sin(p.y * 10.) * sin(p.z * 10.) * 0.1;
        displacement += sin(p.x * 20.) * sin(p.y * 20.) * sin(p.z * 20.) * 0.05;
        displacement += sin(p.x * 30.) * sin(p.y * 30.) * sin(p.z * 30.) * 0.025;

        return displacement;
    }

    float sphereSDF(vec3 p, vec3 o, float r) {

        // return length(p - o) - r + displacement(p) * r;
        return length(p - o) - r;
    }

    float smin(float a, float b, float k) {
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
    }

    float sceneSDF(vec3 p) {
        // float k = uSmoothFactor;
        // float infiniteSpheres = sphereSDF(mod(p, 2.), vec3(1.), .54321);

        // vec3 camPos = vec3(cos(uTime / 3.) * 2., sin(uTime / 3.) * 2., uTime / 3.);
        // return infiniteSpheres;

        float spheres = sphereSDF(p, uMeshPositions[0], .3);

        for(int i = 1; i < ${arrayWidth}; i++) {
          spheres = smin(spheres, sphereSDF(p, uMeshPositions[i], .3), uSmoothFactor);
        }

        return spheres;
    }

    vec3 normal(vec3 p) {
        return normalize(vec3(
            sceneSDF(p + vec3(0.01, 0.0, 0.0)) - sceneSDF(p - vec3(0.01, 0.0, 0.0)),
            sceneSDF(p + vec3(0.0, 0.01, 0.0)) - sceneSDF(p - vec3(0.0, 0.01, 0.0)),
            sceneSDF(p + vec3(0.0, 0.0, 0.01)) - sceneSDF(p - vec3(0.0, 0.0, 0.01))
        ));
    }

    float sigmoid(float x) {
        return 1.0 / (1.0 + exp(-x));
    }

    vec4 rayMarching(vec3 ro, vec3 rd) {
        const float max_dist = 100.0;
        const float min_dist = 0.01;
        const int steps = 100;


        float sigmoid_factor = uExposure;

        float dist = min_dist;
        for (int i = 0; i < steps; i++) {
            vec3 pos = ro + rd * dist;
            vec3 color = vec3(sin(pos.x * 2.) / 2. + .5, sin(pos.y * 2.) / 2. + .5, sin(pos.z * 2.) / 2. + .5) * 0.7 + 0.3;
            float sdf = sceneSDF(pos);
            if (sdf < min_dist) {
                vec3 nor = normal(pos);
                vec3 lightDir = vec3(cos(uTime), 0.8, sin(uTime));
                vec3 ambient = color * 0.5;
                vec3 diffuse = max(0., dot(nor, lightDir)) * color;

                //Blinn-Phong model
                vec3 viewDir = normalize(uCamPos - pos);
                vec3 halfDir = normalize(lightDir + viewDir);
                float spec = pow(max(0., dot(nor, halfDir)), 20.);

                vec3 specular = spec * color;

                // return (ambient + diffuse + specular);
                // return color * (2. * sigmoid(float(i)) - 1.);
                return vec4(color, 1.);
            }
            if (sdf > max_dist) {
                // return color * (2. * sigmoid(float(i) * sigmoid_factor) - 1.);
                return vec4(0.);
            }
            dist += sdf;
        }
        return vec4(0.);

        // return vec3(1.) * (2. * sigmoid(float(steps) * sigmoid_factor) - 1.);
    }

    void main() {
        // vec3 camPos = vec3(cos(uTime / 3.) * 2., sin(uTime / 3.) * 2., uTime / 3.);
        // vec2 uv = vUv * 2. - 1.;

        vec3 ro = uCamPos;
        vec3 rd = normalize(vPosition - uCamPos);
        vec4 col = rayMarching(ro, rd);
        // vec3 col = vec3(vPosition.x, vPosition.y, vPosition.z);
        gl_FragColor = col;
    }
   `

  const { smoothFactor, exposure, hideArrows } =
    useControls({
      smoothFactor: {
        value: 0.5,
        min: 0.01,
        max: 2.0,
      },
      exposure: {
        value: 0.1,
        min: 0.01,
        max: 0.5,
      },
      hideArrows: false,
    })

  const meshPositionVectors = useMemo(() => {
    const pos = []
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        for (let k = 0; k < length; k++) {
          pos.push(
            new THREE.Vector3(
              (Math.random() * width) / 2,
              (Math.random() * height) / 2,
              (Math.random() * length) / 2
            )
          )
        }
      }
    }
    return pos
  }, [])

  const meshPostions = useRef<THREE.Vector3[]>(
    meshPositionVectors
  )

  const { camera } = useThree()

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0.0 },
          uSmoothFactor: { value: smoothFactor },
          uExposure: { value: exposure },
          uCamPos: { value: camera.position },
          uMeshPositions: { value: meshPostions.current },
        },
      }),
    [
      vertexShader,
      fragmentShader,
      smoothFactor,
      exposure,
      camera.position,
      meshPostions,
    ]
  )

  const meshes = useRef<(THREE.Mesh | null)[]>([])

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime()

    meshes.current.forEach((mesh, i) => {
      if (mesh) {
        const target = new THREE.Vector3()
        // mesh.position = new Vector3(0, 0, 0)
        mesh.getWorldPosition(target)
        meshPostions.current[i].copy(target)
      }
    })
  })

  return (
    <>
      {meshPostions.current.map((pos, i) => (
        <TransformControls
          mode='translate'
          key={i}
          position={pos}
          showX={!hideArrows}
          showY={!hideArrows}
          showZ={!hideArrows}>
          <mesh
            ref={(ref) => {
              meshes.current[i] = ref
            }}
            material={material}
            position={[0, 0, 0]}>
            <boxBufferGeometry
              attach='geometry'
              args={[1, 1, 1]}
            />
          </mesh>
        </TransformControls>
      ))}
    </>
  )
}

const Scene = () => {
  return (
    <>
      <RayMarching />
    </>
  )
}

const MainCanvas = () => {
  return (
    <Canvas dpr={2}>
      <PerspectiveCamera position={[0, 0, 3]} makeDefault />
      <OrbitControls makeDefault />
      <Scene />
    </Canvas>
  )
}

export default MainCanvas
