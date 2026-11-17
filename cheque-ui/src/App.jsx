import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import AppLayout from "./components/AppLayout.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Welcome from "./pages/Welcome.jsx";
import ChequePrintPage from "./pages/ChequePrintPage.jsx";
import LayoutSettings from "./pages/LayoutSettings.jsx";
import Reports from "./pages/Reports.jsx";

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Pages after login: share the menu bar */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/cheque/:bankId" element={<ChequePrintPage />} />
        <Route path="/settings/:bankId" element={<LayoutSettings />} />
        <Route path="/reports" element={<Reports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
