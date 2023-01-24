import {
  OrbitControls,
  PerspectiveCamera,
  useFBO,
} from '@react-three/drei'
import {
  Canvas,
  createPortal,
  useFrame,
  useThree,
} from '@react-three/fiber'
import { useState } from 'react'
import * as THREE from 'three'

const GameOfLife = () => {
  const width = 1920
  const height = 1080

  const [mainScene] = useState(() => new THREE.Scene())
  const [bufferScene] = useState(() => new THREE.Scene())
  const [camera] = useState(
    () =>
      new THREE.OrthographicCamera(
        -1,
        1,
        1,
        -1,
        1 / Math.pow(2, 53),
        1
      )
  )
  const mainTarget = useFBO(width, height, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
  })

  const bufferTarget = useFBO(width, height, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
  })

  const randomColors = new Float32Array(width * height * 4)
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      let intensity = Math.random() > 0.5 ? 1 : 0

      if (
        i === 0 ||
        j === 0 ||
        i === width - 1 ||
        j === height - 1
      ) {
        intensity = 1
      }

      randomColors[4 * (i * height + j) + 0] = intensity
      randomColors[4 * (i * height + j) + 1] = intensity
      randomColors[4 * (i * height + j) + 2] = intensity
      randomColors[4 * (i * height + j) + 3] = 1
    }
  }

  const startTexture = new THREE.DataTexture(
    randomColors,
    width,
    height,
    THREE.RGBAFormat,
    THREE.FloatType
  )
  startTexture.needsUpdate = true

  const simulationMaterial = new THREE.ShaderMaterial({
    uniforms: {
      previous_tex: { value: startTexture },
    },
    vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
          `,
    fragmentShader: /* glsl */ `
          uniform sampler2D previous_tex;
          varying vec2 vUv;
          void main() {
              // calculate neighbors
              int n = 0;
              for(int i = -2; i <= 2; i++) {
                  for(int j = -2; j <= 2; j++) {
                      if(i == 0 && j == 0) continue;
                      vec4 neighbor = texelFetch(previous_tex,
                          ivec2(int(gl_FragCoord.x) + i, int(gl_FragCoord.y) + j), 0);
                      if(neighbor.r > 0.5) n++;
                  }
              }
              // calculate new value
              vec4 current = texelFetch(previous_tex, ivec2(gl_FragCoord.xy), 0);
              float new_value = current.r;
              if(n > 12) new_value = 1.0;
              else if(n < 12) new_value = 0.0;
              gl_FragColor = vec4(vec3(new_value), 1.0);
          }
          `,
  })

  const displayMaterial = new THREE.ShaderMaterial({
    uniforms: {
      tex: { value: bufferTarget.texture },
    },
    vertexShader: /*glsl*/ `
          varying vec2 vUv;
          void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
      `,
    fragmentShader: /*glsl*/ `
          uniform sampler2D tex;
          varying vec2 vUv;
          void main() {
              gl_FragColor = texture2D(tex, vUv);
          }
      `,
  })

  const render = (gl: THREE.WebGLRenderer) => {
    gl.setRenderTarget(bufferTarget)
    gl.clear()
    gl.render(bufferScene, camera)
    displayMaterial.uniforms.tex.value =
      bufferTarget.texture
    gl.setRenderTarget(mainTarget)
    gl.clear()
    gl.render(mainScene, camera)
    simulationMaterial.uniforms.previous_tex.value =
      mainTarget.texture
  }

  let frame = 0

  useFrame(({ gl, clock }) => {
    if (frame % 1 === 0) {
      //   render(gl)
    }
    gl.setRenderTarget(null)
    frame++
  })

  const webGl = useThree().gl

  return (
    <>
      {createPortal(
        <mesh material={simulationMaterial}>
          <planeBufferGeometry
            attach='geometry'
            args={[2, 2]}
          />
        </mesh>,
        bufferScene
      )}
      {createPortal(
        <mesh material={displayMaterial}>
          <planeBufferGeometry
            attach='geometry'
            args={[2, 2]}
          />
        </mesh>,
        mainScene
      )}
      <mesh
        position={[0, 0, 0]}
        onClick={() => {
          render(webGl)
          const buffer = new Float32Array(
            width * height * 4
          )

          webGl.readRenderTargetPixels(
            mainTarget,
            0,
            0,
            width,
            height,
            buffer
          )
          console.log(buffer)
        }}>
        <meshBasicMaterial map={mainTarget.texture} />
        <planeBufferGeometry
          attach='geometry'
          args={[2, (2 * height) / width]}
        />
      </mesh>
    </>
  )
}

const Scene = () => {
  return (
    <>
      <GameOfLife />
    </>
  )
}

const MainCanvas = () => {
  return (
    <Canvas>
      <PerspectiveCamera position={[0, 0, 5]} makeDefault />
      <OrbitControls />
      <Scene />
    </Canvas>
  )
}

export default MainCanvas
