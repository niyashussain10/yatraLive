import { Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import UpdatePage from './pages/UpdatePage'
import LivePage from './pages/LivePage'

function App() {
  return (
    <>
      <Routes>
        <Route path="/update" element={<UpdatePage />} />
        <Route path="/live" element={<LivePage />} />
        <Route path="/" element={<LivePage />} />
      </Routes>
      <Analytics />
    </>
  )
}

export default App

