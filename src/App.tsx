import MainCanvas from './MainCanvas'
import ParticalCanvas from './ParticleCanvas'
import RayCanvas from './raymarching'

import { useControls } from 'leva'

const App = () => {
  const { scene } = useControls({
    scene: {
      value: 'particles',
      options: ['raymarching', 'particles', 'main'],
    },
  })

  return (
    <div id='app'>
      {scene === 'raymarching' && <RayCanvas />}
      {scene === 'particles' && <ParticalCanvas />}
      {scene === 'main' && <MainCanvas />}
    </div>
  )
}

export default App
