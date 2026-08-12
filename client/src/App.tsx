import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth";
import { ToastProvider } from "./toast";
import PublicLayout from "./components/public/PublicLayout";
import AdminLayout from "./components/admin/AdminLayout";
import Home from "./pages/public/Home";
import Tires from "./pages/public/Tires";
import TireDetail from "./pages/public/TireDetail";
import Services from "./pages/public/Services";
import About from "./pages/public/About";
import Reviews from "./pages/public/Reviews";
import Contact from "./pages/public/Contact";
import Book from "./pages/public/Book";
import Quote from "./pages/public/Quote";
import Portal from "./pages/public/Portal";
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Customers from "./pages/admin/Customers";
import CustomerDetail from "./pages/admin/CustomerDetail";
import Vehicles from "./pages/admin/Vehicles";
import Appointments from "./pages/admin/Appointments";
import Inventory from "./pages/admin/Inventory";
import QuoteRequests from "./pages/admin/QuoteRequests";
import Quotes from "./pages/admin/Quotes";
import ServiceOrders from "./pages/admin/ServiceOrders";
import ServiceOrderDetail from "./pages/admin/ServiceOrderDetail";
import Invoices from "./pages/admin/Invoices";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="tires" element={<Tires />} />
              <Route path="tires/:id" element={<TireDetail />} />
              <Route path="services" element={<Services />} />
              <Route path="about" element={<About />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="contact" element={<Contact />} />
              <Route path="book" element={<Book />} />
              <Route path="quote" element={<Quote />} />
              <Route path="portal/:token" element={<Portal />} />
            </Route>

            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetail />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="quote-requests" element={<QuoteRequests />} />
              <Route path="quotes" element={<Quotes />} />
              <Route path="service-orders" element={<ServiceOrders />} />
              <Route path="service-orders/:id" element={<ServiceOrderDetail />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
