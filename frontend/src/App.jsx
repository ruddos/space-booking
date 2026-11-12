import { Route, Routes } from 'react-router-dom'
import AdminLayout from './components/admin/AdminLayout.jsx'
import RequireAdmin from './components/admin/RequireAdmin.jsx'
import Bookings from './pages/admin/Bookings.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import Rooms from './pages/admin/Rooms.jsx'
import Services from './pages/admin/Services.jsx'
import AccountLayout from './components/account/AccountLayout.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import Favorites from './pages/account/Favorites.jsx'
import MyBookings from './pages/account/MyBookings.jsx'
import Notifications from './pages/account/Notifications.jsx'
import Payments from './pages/account/Payments.jsx'
import Profile from './pages/account/Profile.jsx'
import Receipt from './pages/account/Receipt.jsx'
import About from './pages/About.jsx'
import Blog from './pages/Blog.jsx'
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
      <Route path="/blog" element={<Blog />} />
      <Route path="/about" element={<About />} />
      <Route path="/contacts" element={<About />} />
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
        <Route path="favorites" element={<Favorites />} />
        <Route path="payments" element={<Payments />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
      <Route
        path="/account/receipt/:id"
        element={
          <RequireAuth>
            <Receipt />
          </RequireAuth>
        }
      />
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
        <Route path="services" element={<Services />} />
      </Route>
      <Route path="*" element={<Placeholder />} />
    </Routes>
  )
}
