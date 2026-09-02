import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { LandingPage } from './components/LandingPage';
import { ScanPage } from './components/ScanPage';
import { ResultsPage } from './components/ResultsPage';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { DashboardHome } from './components/dashboard/DashboardHome';
import { LesionProfiles } from './components/dashboard/LesionProfiles';
import { LesionDetail } from './components/dashboard/LesionDetail';
import { PdfVault } from './components/dashboard/PdfVault';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UserDirectory } from './components/admin/UserDirectory';
import { useAuth } from '../contexts/AuthContext';
import { AccountSettings } from './components/dashboard/AccountSettings';

function LandingRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}

const router = createBrowserRouter([
  { path: "/", element: <LandingRoute /> },
  { path: "/scan", element: <ScanPage /> },
  { path: "/results", element: <ResultsPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/settings",
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AccountSettings /> },
    ],
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <DashboardHome /> },
      { path: "scan", element: <ScanPage /> },
      { path: "settings", element: <AccountSettings /> },
      { path: "lesions", element: <LesionProfiles /> },
      { path: "lesions/:id", element: <LesionDetail /> },
      { path: "pdfs", element: <PdfVault /> },
    ]
  },
  {
    path: "/admin",
    element: <ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "users", element: <UserDirectory /> },
    ]
  }
]);

export default function App() {
  return (
    <div style={{
      backgroundColor: '#FAF7F2',
      color: '#3E2723',
      minHeight: '100vh',
      width: '100%'
    }}>
      <RouterProvider router={router} />
    </div>
  );
}
