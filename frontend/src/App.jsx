import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import "./index.css";
import "./App.css";

const Landing = lazy(() => import("./components/Landing"));
const Register = lazy(() => import("./components/Register"));
const Login = lazy(() => import("./components/Login"));
const VerifyAccount = lazy(() => import("./components/VerifyAccount"));
const ForgotPassword = lazy(() => import("./components/ForgotPassword"));
const ResetPassword = lazy(() => import("./components/ResetPassword"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const AdminProducts = lazy(() => import("./components/AdminProducts"));
const ProductForm = lazy(() => import("./components/ProductForm"));
const Header = lazy(() => import("./components/Header"));
const Profile = lazy(() => import("./components/Profile"));
const Settings = lazy(() => import("./components/Settings"));
const AdminStats = lazy(() => import("./components/AdminStats"));
const AdminUsers = lazy(() => import("./components/AdminUsers"));
const EmprendimientoDetalle = lazy(() => import("./components/EmprendimientoDetalle"));
const CartPage = lazy(() => import("./components/CartPage"));


function AppInner() {
  const location = useLocation();

  const authRoutes = ["/", "/login", "/register", "/verify", "/forgot-password", "/reset-password"];
  const hideNav = authRoutes.includes(location.pathname) || location.pathname.startsWith("/reset-password/");

  return (
    <main className="flex flex-col h-screen overflow-y-auto bg-[#f4f6f8]">

      {!hideNav && (
        <Suspense fallback={null}>
          <Header />
        </Suspense>
      )}

      <div className="flex-1 w-full">
        <Suspense fallback={<div className="flex items-center justify-center h-full text-neutral-muted">Cargando...</div>}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify" element={<VerifyAccount />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
            <Route path="/admin/products/new" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />
            <Route path="/admin/products/edit/:id" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />
            <Route path="/admin/stats" element={<ProtectedRoute><AdminStats /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/emprendimientos/:id" element={<EmprendimientoDetalle />} />
            <Route path="/carrito" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}