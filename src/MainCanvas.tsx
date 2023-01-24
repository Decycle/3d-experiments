import { Canvas, useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  PerspectiveCamera,
  useHelper,
  useTexture,
} from '@react-three/drei'
import {
  BoxBufferGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  MeshStandardMaterial,
  PlaneBufferGeometry,
  PointLightHelper,
  RepeatWrapping,
  SphereBufferGeometry,
} from 'three'
import { useMemo, useRef } from 'react'
import * as NEA from 'fp-ts/NonEmptyArray'
import { pipe } from 'fp-ts/function'

const addSecondUV = (geometry: BufferGeometry) => {
  const uv = geometry.getAttribute('uv')
  const uv2 = new Float32BufferAttribute(
    uv.array,
    uv.itemSize
  )
  geometry.setAttribute('uv2', uv2)

  return geometry
}

const Graves = () => {
  const geometry = useMemo(
    () => new BoxBufferGeometry(0.6, 0.8, 0.2),
    []
  )
  const material = useMemo(
    () => new MeshStandardMaterial({ color: '#b2b6b1' }),
    []
  )

  const grave = (key: number) => {
    const angle = Math.random() * Math.PI * 2
    const radius = 3 + Math.random() * 6
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    const zRotation = (Math.random() - 0.5) * 0.4
    const yRotation = (Math.random() - 0.5) * 0.4

    return (
      <mesh
        key={key}
        position={[x, 0.3, z]}
        geometry={geometry}
        material={material}
        rotation={[0, yRotation, zRotation]}
        castShadow></mesh>
    )
  }

  return (
    <group>{pipe(NEA.range(0, 50), NEA.map(grave))}</group>
  )
}

const House = (props: JSX.IntrinsicElements['group']) => {
  // useHelper()
  const doorLight = useRef<THREE.PointLight>(null!)
  // useHelper(doorLight, PointLightHelper)

  const doorTextures = useTexture({
    map: '/textures/door/color.jpg',
    alphaMap: '/textures/door/alpha.jpg',
    aoMap: '/textures/door/ambientOcclusion.jpg',
    displacementMap: '/textures/door/height.jpg',
    normalMap: '/textures/door/normal.jpg',
    roughnessMap: '/textures/door/roughness.jpg',
    metalnessMap: '/textures/door/metalness.jpg',
  })

  const doorMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        transparent: true,
        displacementScale: 0.1,
        ...doorTextures,
      }),
    [doorTextures]
  )

  const doorGeometry = useMemo(
    () =>
      addSecondUV(
        new PlaneBufferGeometry(2.2, 2.2, 100, 100)
      ),
    []
  )

  const brickTextures = useTexture({
    map: '/textures/bricks/color.jpg',
    aoMap: '/textures/bricks/ambientOcclusion.jpg',
    normalMap: '/textures/bricks/normal.jpg',
    roughnessMap: '/textures/bricks/roughness.jpg',
  })

  const brickMaterial = useMemo(
    () => new MeshStandardMaterial({ ...brickTextures }),
    [brickTextures]
  )

  const brickGeometry = useMemo(
    () => addSecondUV(new BoxBufferGeometry(4, 2.5, 4)),
    []
  )

  return (
    <group {...props}>
      <mesh
        name='walls'
        material={brickMaterial}
        geometry={brickGeometry}
        castShadow></mesh>
      <mesh
        name='roof'
        position-y={1.75}
        rotation-y={Math.PI / 4}>
        <coneBufferGeometry
          attach='geometry'
          args={[3.5, 1, 4]}
        />
        <meshStandardMaterial color='#b35f45' />
      </mesh>
      <mesh
        name='door'
        position={[0, -0.25, 2.01]}
        material={doorMaterial}
        geometry={doorGeometry}></mesh>
      <pointLight
        name='doorLight'
        ref={doorLight}
        color='#ff7d46'
        position={[0, 1, 3]}
        intensity={0.8}
        distance={7}
        castShadow
      />
    </group>
  )
}

const Ground = () => {
  const grassTextures = useTexture({
    map: '/textures/grass/color.jpg',
    aoMap: '/textures/grass/ambientOcclusion.jpg',
    normalMap: '/textures/grass/normal.jpg',
    roughnessMap: '/textures/grass/roughness.jpg',
  })

  grassTextures.map.repeat.set(8, 8)
  grassTextures.map.wrapS = grassTextures.map.wrapT =
    RepeatWrapping

  grassTextures.aoMap.repeat.set(8, 8)
  grassTextures.aoMap.wrapS = grassTextures.aoMap.wrapT =
    RepeatWrapping

  grassTextures.normalMap.repeat.set(8, 8)
  grassTextures.normalMap.wrapS =
    grassTextures.normalMap.wrapT = RepeatWrapping

  grassTextures.roughnessMap.repeat.set(8, 8)
  grassTextures.roughnessMap.wrapS =
    grassTextures.roughnessMap.wrapT = RepeatWrapping

  const grassMaterial = useMemo(
    () => new MeshStandardMaterial({ ...grassTextures }),
    [grassTextures]
  )

  const grassGeometry = useMemo(
    () => addSecondUV(new PlaneBufferGeometry(20, 20)),
    []
  )

  return (
    <mesh
      name='ground'
      rotation-x={-Math.PI / 2}
      material={grassMaterial}
      geometry={grassGeometry}
      receiveShadow></mesh>
  )
}

const Bushes = () => {
  const geometry = useMemo(
    () => new SphereBufferGeometry(1, 16, 16),
    []
  )
  const material = useMemo(
    () => new MeshStandardMaterial({ color: '#89c854' }),
    []
  )

  return (
    <group>
      <mesh
        position={[0.8, 0.2, 2.2]}
        scale={0.5}
        geometry={geometry}
        material={material}
        castShadow
      />
      <mesh
        position={[1.4, 0.1, 2.1]}
        scale={0.25}
        geometry={geometry}
        material={material}
        castShadow
      />
      <mesh
        position={[-0.8, 0.1, 2.2]}
        scale={0.4}
        geometry={geometry}
        material={material}
        castShadow
      />
      <mesh
        position={[-1, 0.05, 2.6]}
        scale={0.15}
        geometry={geometry}
        material={material}
        castShadow
      />
    </group>
  )
}

type GhostProps = JSX.IntrinsicElements['pointLight'] & {
  radius: number
  height: number | ((elapsedTime: number) => number)
  rotateSpeed: number
  startingAngle: number
}

const Ghost = ({
  radius,
  height,
  rotateSpeed,
  startingAngle,
  ...props
}: GhostProps) => {
  const ghost = useRef<THREE.PointLight>(null!)
  // useHelper(ghost, PointLightHelper)
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime()

    ghost.current.position.x =
      Math.sin(elapsed * rotateSpeed + startingAngle) *
      radius
    ghost.current.position.z =
      Math.cos(elapsed * rotateSpeed + startingAngle) *
      radius

    if (typeof height === 'number') {
      ghost.current.position.y = height
    } else {
      ghost.current.position.y = height(elapsed)
    }
  })

  return <pointLight {...props} ref={ghost} castShadow />
}

const Scene = () => {
  return (
    <>
      <ambientLight color='#b9d5ff' intensity={0.12} />
      <directionalLight
        name='moonLight'
        color='#b9d5ff'
        intensity={0.12}
        castShadow
      />
      <Ground />
      <House position={[0, 1.25, 0]} />
      <Bushes />
      <Graves />
      <Ghost
        color='#ff00ff'
        intensity={2}
        distance={3}
        radius={4}
        rotateSpeed={0.5}
        startingAngle={0}
        height={(elapsedTime: number) =>
          Math.sin(elapsedTime * 3) + 1
        }
      />
      <Ghost
        color='#00ffff'
        intensity={2}
        distance={3}
        radius={5}
        rotateSpeed={0.32}
        startingAngle={3}
        height={(elapsedTime: number) =>
          Math.sin(elapsedTime * 4) +
          Math.sin(elapsedTime * 2.5) +
          2
        }
      />
      <Ghost
        color='#ffff00'
        intensity={2}
        distance={3}
        radius={7}
        rotateSpeed={0.18}
        startingAngle={1.5}
        height={(elapsedTime: number) =>
          Math.sin(elapsedTime * 4) +
          Math.sin(elapsedTime * 4) +
          Math.sin(elapsedTime * 2.5) +
          3
        }
      />
    </>
  )
}

const MainCanvas = () => {
  return (
    <Canvas shadows>
      <color attach='background' args={['#262837']} />
      <PerspectiveCamera
        makeDefault
        position={[0, 4, 10]}
      />
      <OrbitControls />
      <Scene />
      <fog attach='fog' args={['#262837', 1, 15]} />
    </Canvas>
  )
}

export default MainCanvas
