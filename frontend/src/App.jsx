import { Route, Routes } from 'react-router-dom'
import AdminLayout from './components/admin/AdminLayout.jsx'
import RequireAdmin from './components/admin/RequireAdmin.jsx'
import Bookings from './pages/admin/Bookings.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import Rooms from './pages/admin/Rooms.jsx'
import AccountLayout from './components/account/AccountLayout.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import MyBookings from './pages/account/MyBookings.jsx'
import Booking from './pages/Booking.jsx'
import BookingDone from './pages/BookingDone.jsx'
import Catalog from './pages/Catalog.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Placeholder from './pages/Placeholder.jsx'
import Room from './pages/Room.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/rooms/:id" element={<Room />} />
      <Route
        path="/booking/:roomId"
        element={
          <RequireAuth>
            <Booking />
          </RequireAuth>
        }
      />
      <Route
        path="/booking/done/:id"
        element={
          <RequireAuth>
            <BookingDone />
          </RequireAuth>
        }
      />
      <Route
        path="/account"
        element={
          <RequireAuth>
            <AccountLayout />
          </RequireAuth>
        }
      >
        <Route index element={<MyBookings />} />
      </Route>
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
        <Route path="bookings" element={<Bookings />} />
        <Route path="rooms" element={<Rooms />} />
      </Route>
      <Route path="*" element={<Placeholder />} />
    </Routes>
  )
}
