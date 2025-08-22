"use client"

import { useState, useEffect, useRef } from "react"
import { UserCircle, LogOut } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import logo from "../assets/Login_Page/fresco_logo_white.png"
import { API_BASE_URL } from "../config/api"

function NavBar() {
  const [userRole, setUserRole] = useState(null)
  const [userName, setUserName] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Get user role from localStorage
    const role = localStorage.getItem("user_role")
    setUserRole(role)

    // Fetch user data to get the name
    const fetchUserData = async () => {
      try {
        const accessToken = localStorage.getItem("access_token")
        const userId = localStorage.getItem("user_id")
        if (!accessToken || !userId) return

        // Fetch employment info to get the first name
        const response = await fetch(`${API_BASE_URL}/employment-info/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const employmentData = await response.json()

          // Find the employment info that matches the current user
          const userEmploymentInfo = employmentData.find((info) => {
            // Check if this employment info belongs to the current user
            if (info.user && info.user.id === Number.parseInt(userId)) {
              return true
            }
            return false
          })

          if (userEmploymentInfo) {
            // Set only the first name for easier application
            setUserName(userEmploymentInfo.first_name || "User")
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    fetchUserData()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownRef])

  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user_id")
    localStorage.removeItem("user_email")
    localStorage.removeItem("user_role")
    localStorage.removeItem("session_start")

    // Prevent going back to protected pages
    window.history.pushState(null, "", "/")

    // Navigate to login page
    navigate("/", { replace: true })
  }

  // Define navigation links based on user role
  const getNavLinks = () => {
    if (userRole === "admin" || userRole === "owner" || !userRole) {
      // For admin/owner or when role is not set yet, show all admin links
      return [
        { name: "DASHBOARD", href: "/dashboard" },
        { name: "EMPLOYEE", href: "/employee" },
        { name: "ATTENDANCE", href: "/attendance" },
        { name: "PAYROLL", href: "/payroll" },
        { name: "MASTER CALENDAR", href: "/master-calendar" },
        { name: "ACTIVITY LOGS", href: "/activity-logs" },
      ]
    } else if (userRole === "employee") {
      // For employees, show only relevant links
      return [
        { name: "SCHEDULE", href: "/employee/schedule" },
        { name: "PAYSLIP", href: `/employee-payslip/${localStorage.getItem("user_id") || ""}` },
      ]
    }

    // Default fallback
    return []
  }

  const navLinks = getNavLinks()

  return (
    <nav className="bg-gray-800 text-white p-6">
      <div className="container mx-auto flex justify-between items-center">
        <Link to={userRole === "employee" ? "/employee/schedule" : "/dashboard"}>
          <img src={logo || "/placeholder.svg"} alt="Fresco Logo" className="h-16 w-auto" />
        </Link>
        <div className="flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link key={link.name} to={link.href} className="font-medium hover:text-gray-300">
              {link.name}
            </Link>
          ))}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center cursor-pointer" onClick={() => setShowDropdown(!showDropdown)}>
              <span className="font-medium mr-4">{userName}</span>
              <UserCircle className="h-8 w-8 hover:text-gray-300 transition-colors" />
            </div>

            {/* Dropdown menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors duration-150"
                >
                  <LogOut className="h-4 w-4 mr-2 text-red-500" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default NavBar
