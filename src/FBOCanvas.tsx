import {
  OrbitControls,
  PerspectiveCamera,
  useHelper,
} from '@react-three/drei'
import { Canvas } from '@react-three/fiber'

const Particles = () => {
  // const

  return <></>
}

const Scene = () => {
  return (
    <>
      <Particles />
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
