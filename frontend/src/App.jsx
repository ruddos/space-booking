import { Route, Routes } from 'react-router-dom'
import AdminLayout from './components/admin/AdminLayout.jsx'
import RequireAdmin from './components/admin/RequireAdmin.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Placeholder from './pages/Placeholder.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Dashboard />} />
      </Route>
      <Route path="*" element={<Placeholder />} />
    </Routes>
  )
}
