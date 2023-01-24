import {
  OrbitControls,
  PerspectiveCamera,
  useHelper,
} from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  ArrowHelper,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Quaternion,
  SphereBufferGeometry,
  SphereGeometry,
  Vector3,
} from 'three'

import { pipe } from 'fp-ts/function'
import * as NEA from 'fp-ts/NonEmptyArray'
import { useControls } from 'leva'

const SphereParticles = (
  props: JSX.IntrinsicElements['points']
) => {
  const count = 10000

  const geometry = new Float32Array(count * 3)
  const color = new Float32Array(count * 3)

  const phi = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)

    const theta = phi * i
    const x = Math.cos(theta) * r
    const z = Math.sin(theta) * r

    geometry[i * 3 + 0] = x
    geometry[i * 3 + 1] = y
    geometry[i * 3 + 2] = z

    color[i * 3 + 0] = x + 0.5
    color[i * 3 + 1] = y + 0.5
    color[i * 3 + 2] = z + 0.5
  }

  const PointGeometry = new BufferGeometry()
  PointGeometry.setAttribute(
    'position',
    new Float32BufferAttribute(geometry, 3)
  )
  PointGeometry.setAttribute(
    'color',
    new Float32BufferAttribute(color, 3)
  )
  return (
    <points geometry={PointGeometry}>
      <pointsMaterial
        size={0.005}
        sizeAttenuation
        vertexColors
      />
    </points>
  )
}

const SphereParticles2 = () => {
  const count = 100000
  const radius = 1

  const geometry = new Float32Array(count * 3)
  const color = new Float32Array(count * 3)

  let total = 0

  while (total < count) {
    const x = (Math.random() * 2 - 1) * radius
    const y = (Math.random() * 2 - 1) * radius
    const z = (Math.random() * 2 - 1) * radius

    const d = x * x + y * y + z * z

    if (d < radius * radius) {
      geometry[total * 3 + 0] = x
      geometry[total * 3 + 1] = y
      geometry[total * 3 + 2] = z

      color[total * 3 + 0] = x / radius / 2 + 0.5
      color[total * 3 + 1] = y / radius / 2 + 0.5
      color[total * 3 + 2] = z / radius / 2 + 0.5

      total++
    }
  }

  const PointGeometry = new BufferGeometry()
  PointGeometry.setAttribute(
    'position',
    new Float32BufferAttribute(geometry, 3)
  )
  PointGeometry.setAttribute(
    'color',
    new Float32BufferAttribute(color, 3)
  )

  return (
    <points geometry={PointGeometry}>
      <pointsMaterial
        size={0.005}
        sizeAttenuation
        vertexColors
      />
    </points>
  )
}

const SphereParticles3 = () => {
  const count = 1000
  const positions: Vector3[] = []
  const colors: string[] = []

  const phi = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = phi * i

    const x = Math.cos(theta) * r
    const z = Math.sin(theta) * r

    positions.push(new Vector3(x, y, z))

    const red = Math.floor(((x + 1) * 255) / 2)
    const green = Math.floor(((y + 1) * 255) / 2)
    const blue = Math.floor(((z + 1) * 255) / 2)

    colors.push(`rgb(${red}, ${green}, ${blue})`)
  }

  return (
    <>
      {positions.map((_, index) => {
        const position = positions[index]
        const [x, y, z] = position.toArray()

        const axis = new Vector3(0, 0, 1)
          .add(position)
          .normalize()

        return (
          <mesh
            position={positions[index]}
            quaternion={new Quaternion().setFromAxisAngle(
              axis,
              Math.PI
            )}
            key={x * 100 + y * 10 + z}>
            <planeBufferGeometry args={[0.2, 0.2]} />
            <meshBasicMaterial
              color={colors[index]}
              side={DoubleSide}
            />
          </mesh>
        )
      })}
    </>
  )
}

const ArrowHelperMesh = ({ dir }: { dir: Vector3 }) => {
  const arrow = new ArrowHelper(
    dir,
    new Vector3(0, 0, 0),
    2
  )
  return <primitive object={arrow} />
}

const SphereArrowDemo = () => {
  const planeOldDir = new Vector3(0, 0, 1)

  const { planeInputDir } = useControls({
    planeInputDir: {
      x: 0,
      y: 1,
      z: 0,
    },
  })

  const { x, y, z } = planeInputDir
  const planeDirNormalized = new Vector3(
    x,
    y,
    z
  ).normalize()

  let planeNewDir = planeOldDir.add(planeDirNormalized)

  if (planeNewDir.length() < 0.01) {
    planeNewDir = new Vector3(0, 1, 0)
  }

  planeNewDir.normalize()

  return (
    <>
      <mesh>
        <icosahedronBufferGeometry
          attach='geometry'
          args={[1, 4]}
        />
        <meshBasicMaterial wireframe />
      </mesh>

      <mesh>
        <planeBufferGeometry args={[2, 2]} />
        <meshBasicMaterial wireframe />
      </mesh>

      <mesh
        quaternion={new Quaternion().setFromAxisAngle(
          planeNewDir,
          Math.PI
        )}>
        <planeBufferGeometry args={[2, 2]} />
        <meshBasicMaterial wireframe />
      </mesh>

      <ArrowHelperMesh dir={new Vector3(0, 0, 1)} />
      <ArrowHelperMesh dir={planeDirNormalized} />
      <ArrowHelperMesh dir={planeNewDir} />
    </>
  )
}

const CubeParticles = () => {
  // const count = 1000
  // const positions = new Float32Array(count * 3)
  // const colors = new Float32Array(count * 3)

  // const PointGeometry = new BufferGeometry()
  // PointGeometry.setAttribute(
  //   'positions',
  //   new Float32BufferAttribute(positions, 3)
  // )
  // PointGeometry.setAttribute(
  //   'colors',
  //   new Float32BufferAttribute(colors, 3)
  // )
  const count = 100000

  const geometry = new Float32Array(count * 3)
  const color = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const x = Math.random() * 2 - 1
    const y = Math.random() * 2 - 1
    const z = Math.random() * 2 - 1

    geometry[i * 3 + 0] = x
    geometry[i * 3 + 1] = y
    geometry[i * 3 + 2] = z

    color[i * 3 + 0] = (x + 1) / 2
    color[i * 3 + 1] = (y + 1) / 2
    color[i * 3 + 2] = (z + 1) / 2
  }

  const PointGeometry = new BufferGeometry()
  PointGeometry.setAttribute(
    'position',
    new Float32BufferAttribute(geometry, 3)
  )
  PointGeometry.setAttribute(
    'color',
    new Float32BufferAttribute(color, 3)
  )

  const next = (x: number) => (Math.sin(x) + x) / 2

  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime()
    const oldPosition =
      PointGeometry.getAttribute('position').array
    const newPosition = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const x = oldPosition[i * 3]
      const y = oldPosition[i * 3 + 1]
      const z = oldPosition[i * 3 + 2]

      newPosition[i * 3] = next(x)
      newPosition[i * 3 + 1] = next(y)
      newPosition[i * 3 + 2] = next(z)
    }

    PointGeometry.setAttribute(
      'position',
      new Float32BufferAttribute(newPosition, 3)
    )
  })

  return (
    <points geometry={PointGeometry}>
      <pointsMaterial
        size={0.001}
        sizeAttenuation
        vertexColors
      />
    </points>
  )
}

const Scene = () => {
  const { particles } = useControls({
    particles: {
      value: 'sphere1',
      options: [
        'sphere1',
        'sphere2',
        'sphere3 - go inside the sphere',
        'cube',
      ],
    },
  })

  return (
    <>
      {particles === 'sphere1' && <SphereParticles />}
      {particles === 'sphere2' && <SphereParticles2 />}
      {particles.includes('sphere3') && (
        <SphereParticles3 />
      )}
      {particles === 'cube' && <CubeParticles />}
    </>
  )
}

const ParticalCanvas = () => {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <OrbitControls />
      <Scene />
    </Canvas>
  )
}

export default ParticalCanvas
