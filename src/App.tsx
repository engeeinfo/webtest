import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AdminDashboard } from "./pages/AdminDashboard";
import { CustomerView } from "./pages/CustomerView";
import { KitchenDisplay } from "./pages/KitchenDisplay";
import { Login } from "./pages/Login";
import { MenuView } from "./pages/MenuView";
import { OrderReview } from "./pages/OrderReview";

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" richColors />

      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kitchen"
          element={
            <ProtectedRoute allowedRoles={["kitchen", "admin"]}>
              <KitchenDisplay />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={["customer", "waiter", "admin"]}>
              <CustomerView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/menu/:tableId"
          element={
            <ProtectedRoute allowedRoles={["customer", "waiter", "admin"]}>
              <MenuView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/order/:sessionId"
          element={
            <ProtectedRoute allowedRoles={["customer", "waiter", "admin"]}>
              <OrderReview />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
