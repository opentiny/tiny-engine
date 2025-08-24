import { Routes, Route } from 'react-router-dom'
import { useLazy } from '../hooks/uselazy'

const DemoPage = useLazy(import('@/views/DemoPage/DemoPage.jsx'))

const CreateVm = useLazy(import('@/views/createVm/createVm.jsx'))

export const Routers = () => {
  return (
    <Routes>
      <Route path="/" redirect="/createVm" element={<CreateVm />}></Route>,
      <Route path="/demopage" element={<DemoPage />}></Route>,<Route path="/createVm" element={<CreateVm />}></Route>
    </Routes>
  )
}
