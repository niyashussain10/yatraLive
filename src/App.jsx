import { Routes, Route } from 'react-router-dom'
import UpdatePage from './pages/UpdatePage'
import LivePage from './pages/LivePage'

function App() {
  return (
    <Routes>
      <Route path="/update" element={<UpdatePage />} />
      <Route path="/live" element={<LivePage />} />
      <Route path="/" element={<LivePage />} />
    </Routes>
  )
}

export default App

