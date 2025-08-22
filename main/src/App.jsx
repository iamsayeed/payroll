"use client"

import { useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom"

import LoginPage from "./pages/Login_Page"
import ForgotPasswordPage from "./pages/Forgot_Password_Page"
import ResetPasswordPage from "./pages/Reset_Password_Page"
import AdminDashboardPage from "./pages/Admin_Dashboard_Page"
import AdminEmployeePayrollPage from "./pages/Admin_Employee_Payroll_Page"
import AdminEmployeePage from "./pages/Admin_Employees_Page"
import EmployeePayslipPage from "./pages/Employee_Payslip_Page.jsx"
import AdminEmployeeEditSchedulePage from "./pages/Admin_Employee_Edit_Schedule_Page"
import AdminEmployeeAttendancePage from "./pages/Admin_Employee_Attendance_Page"
import AdminMasterCalendarPage from "./pages/Admin_Master_Calendar_Page"
import EmployeeSchedulePage from "./pages/Employee_Schedule_Page"
import ActivityLogPage from "./pages/Admin_Activity_Logs_Page.jsx";
import AdminPayslipPage from "./pages/Admin_Payslip_Page.jsx";

// Session checker component
function SessionChecker() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Check if the current route is not a public route
    const isPublicRoute =
      location.pathname === "/" ||
      location.pathname.startsWith("/forgot-password") ||
      location.pathname.startsWith("/reset-password")

    if (!isPublicRoute) {
      const token = localStorage.getItem("access_token")
      if (!token) {
        // Redirect to login if no token
        navigate("/", { replace: true })
      }
    }

    // Prevent back navigation after logout
    const handlePopState = () => {
      const token = localStorage.getItem("access_token")
      if (!token && !isPublicRoute) {
        navigate("/", { replace: true })
      }
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [navigate, location])

  return null
}

// Protected route component
function ProtectedRoute({ children, allowedRoles, redirectPath = "/" }) {
  const navigate = useNavigate()
  const role = localStorage.getItem("user_role")
  const isAuthenticated = !!localStorage.getItem("access_token")

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/", { replace: true })
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    if (role === "employee") {
      return <Navigate to="/employee/schedule" replace />
    } else if (role === "admin" || role === "owner") {
      return <Navigate to="/dashboard" replace />
    } else {
      return <Navigate to="/" replace />
    }
  }

  return children
}

function App() {
  return (
    <Router>
      <SessionChecker />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Admin/Owner routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <AdminEmployeePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payroll"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <AdminEmployeePayrollPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/schedule/:employeeId"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <AdminEmployeeEditSchedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <AdminEmployeeAttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/master-calendar"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <AdminMasterCalendarPage />
            </ProtectedRoute>
          }
        />
          <Route
          path="/admin-payslip/:userId"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <AdminPayslipPage />
            </ProtectedRoute>
          }
        />

        {/* Employee routes */}
        <Route
          path="/employee/schedule"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <EmployeeSchedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee-payslip/:userId"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner", "employee"]}>
              <EmployeePayslipPage />
            </ProtectedRoute>
          }
        />
           <Route
          path="/activity-logs"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <ActivityLogPage />
            </ProtectedRoute>
          }
        />

        {/* Catch all route - redirect to appropriate dashboard or login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
  