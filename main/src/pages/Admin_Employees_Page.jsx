"use client"

import { useState, useEffect } from "react"
import NavBar from "../components/Nav_Bar"
import AddEmployee from "../components/Add_Employee"
import EditEmployee from "../components/Edit_Employee"
import DeleteEmployee from "../components/Delete_Employee"
import { API_BASE_URL } from "../config/api"
import { useNavigate } from "react-router-dom"

function AdminEmployeePage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("active")
  const [currentPage, setCurrentPage] = useState(1)
  const [yearFilter, setYearFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [employeeToEdit, setEmployeeToEdit] = useState(null)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const employeesPerPage = 5

  const navigate = useNavigate()

  const fetchEmployees = async () => {
    setLoading(true)
    setError(null)

    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/employment-info/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      console.log("Fetched employee data:", data)

      if (response.ok) {
        if (Array.isArray(data)) {
          setEmployees(data)
        } else {
          setError("Unexpected data format received from the server.")
        }
      } else {
        setError(data.message || "Failed to fetch employee data. Please try again.")
      }
    } catch (error) {
      console.error("Error fetching employees:", error)
      setError("An error occurred while fetching employee data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  // Helper function to capitalize role for display
  const capitalizeRole = (role) => {
    if (!role) return ""
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
  }

  const getYearFromDate = (dateString) => {
    if (!dateString) return "-"
    return new Date(dateString).getFullYear()
  }

  const handleAddEmployee = (newEmployee) => {
    // Add the new employee to the beginning of the array instead of the end
    setEmployees((prev) => [newEmployee, ...prev])

    // Reset to the first page to ensure the new employee is visible
    setCurrentPage(1)
  }

  const handleEditClick = (employee) => {
    console.log("Employee being edited:", employee)
    setEmployeeToEdit(employee)
    setIsEditModalOpen(true)
  }

  const handleUpdateEmployee = async (updatedEmployee) => {
    try {
      console.log("Updated employee data:", updatedEmployee)

      // First update the local state
      setEmployees((prevEmployees) =>
        prevEmployees.map((emp) => (emp.id === updatedEmployee.id ? updatedEmployee : emp)),
      )

      // Then fetch fresh data from the server to ensure everything is in sync
      await fetchEmployees()

      // If this was a resignation, switch to the inactive tab
      if (updatedEmployee.resignation_date && !updatedEmployee.active) {
        setActiveTab("inactive")
      }
    } catch (error) {
      console.error("Error updating employee state:", error)
    }
  }

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1) // Reset to first page when changing tabs
    // Reset filters when switching tabs
    if (tab === "inactive") {
      setYearFilter("all")
      setRoleFilter("all")
    }
  }

  // Improved search function that checks multiple fields
  const filteredEmployees = employees.filter((employee) => {
    // First check if employee matches the active/inactive tab
    const matchesTab = activeTab === "active" ? employee.active : !employee.active
    if (!matchesTab) return false

    // If we're on the inactive tab, we don't apply year and role filters
    if (activeTab === "inactive") {
      // For inactive tab, only apply search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchLower) ||
          employee.employee_number?.toString().includes(searchLower) ||
          employee.position?.toLowerCase().includes(searchLower) ||
          employee.address?.toLowerCase().includes(searchLower) ||
          (employee.user?.email && employee.user.email.toLowerCase().includes(searchLower))
        )
      }
      return true
    }

    // For active tab, apply all filters
    const yearEmployed = getYearFromDate(employee.hire_date)
    const matchesYear = yearFilter === "all" || yearEmployed.toString() === yearFilter

    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "owner" && !employee.user) ||
      (employee.user && employee.user.role && employee.user.role.toLowerCase() === roleFilter.toLowerCase())

    // If year or role filter doesn't match, exclude this employee
    if (!matchesYear || !matchesRole) return false

    // If there's a search term, check if any field matches
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchLower) ||
        employee.employee_number?.toString().includes(searchLower) ||
        employee.position?.toLowerCase().includes(searchLower) ||
        employee.address?.toLowerCase().includes(searchLower) ||
        (employee.user?.email && employee.user.email.toLowerCase().includes(searchLower))
      )
    }

    // If we got here, all filters match
    return true
  })

  // After the filteredEmployees definition, add a sorting step:
  const sortedFilteredEmployees = [...filteredEmployees].sort((a, b) => {
    // Sort by ID in descending order (newer employees first)
    return b.id - a.id
  })

  // Get unique years and roles for filters
  const years = [...new Set(employees.map((e) => getYearFromDate(e.hire_date)))]
    .filter((year) => year !== "-")
    .sort((a, b) => b - a)
  const roles = ["owner", "admin", "employee"]

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(sortedFilteredEmployees.length / employeesPerPage))
  // Ensure current page is within valid range
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  if (currentPage !== validCurrentPage) {
    setCurrentPage(validCurrentPage)
  }

  const indexOfLastEmployee = validCurrentPage * employeesPerPage
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage
  const currentEmployees = sortedFilteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee)

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    try {
      if (!employeeToDelete) return

      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(`${API_BASE_URL}/employment-info/${employeeToDelete.id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Remove the employee from the state
        setEmployees((prevEmployees) => prevEmployees.filter((emp) => emp.id !== employeeToDelete.id))
        console.log(`Employee ${employeeToDelete.first_name} ${employeeToDelete.last_name} deleted successfully`)
      } else {
        const errorData = await response.json()
        console.error("Error deleting employee:", errorData)
        setError(errorData.message || "Failed to delete employee. Please try again.")
      }
    } catch (error) {
      console.error("Error in delete operation:", error)
      setError("An error occurred while deleting the employee. Please try again later.")
    } finally {
      setIsDeleteModalOpen(false)
      setEmployeeToDelete(null)
    }
  }

  const handleViewSchedule = (employeeId) => {
    if (!employeeId) {
      alert("Cannot view schedule: Employee ID not found")
      return
    }
    navigate(`/employee/schedule/${employeeId}`)
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container mx-auto px-4 pt-24">
        <div className="bg-[#A7BC8F] rounded-lg p-4 md:p-6">
          {/* Header Section - Responsive Layout */}
          <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center mb-6">
            {/* Tab Buttons - Always at the top on mobile */}
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 md:px-6 md:py-2 rounded-md ${
                  activeTab === "active" ? "bg-[#5C7346] text-white font-semibold" : "bg-[#D1DBC4] text-gray-700"
                }`}
                onClick={() => handleTabChange("active")}
              >
                ACTIVE
              </button>
              <button
                className={`px-4 py-2 md:px-6 md:py-2 rounded-md ${
                  activeTab === "inactive" ? "bg-[#5C7346] text-white font-semibold" : "bg-[#D1DBC4] text-gray-700"
                }`}
                onClick={() => handleTabChange("inactive")}
              >
                INACTIVE
              </button>
            </div>

            {/* Search and Filters - Stack on mobile, side by side on larger screens */}
            <div className="flex flex-row md:flex-row md:space-y-0 md:space-x-2 md:items-center">
              <input
                type="search"
                placeholder="Search by name, ID, position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 mr-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346] w-full md:w-54"
              />
              {activeTab === "active" && (
                <div className="flex space-x-2">
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346] bg-white"
                  >
                    <option value="all">All Years</option>
                    {years.map((year) => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346] bg-white md:flex-none"
                  >
                    <option value="all">All Roles</option>
                    {roles.map((role) => (
                      <option key={role} value={role.toLowerCase()}>
                        {capitalizeRole(role)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Employees</h2>

          {/* Employee Table - Responsive with horizontal scroll on small screens */}
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="min-w-[800px] md:min-w-0 px-4 md:px-0">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-white border-b border-white/20 whitespace-nowrap">
                    <th className="py-3 px-4 w-[10%]">ID</th>
                    <th className="py-3 px-4 w-[20%]">NAME</th>
                    <th className="py-3 px-4 w-[10%]">POSITION</th>
                    <th className="py-3 px-4 w-[10%]">YEAR EMPLOYED</th>
                    {activeTab === "inactive" && <th className="py-3 px-4 w-[15%]">YEAR RESIGNED</th>}
                    {activeTab === "active" && <th className="py-3 px-4 w-[10%]">STATUS</th>}
                    {activeTab === "active" && <th className="py-3 px-4 w-[15%]">ACTIONS</th>}
                  </tr>
                </thead>
                <tbody className="text-white">
                  {currentEmployees.map((employee) => (
                    <tr key={employee.id} className="border-b border-white/10">
                      <td className="py-3 px-4 overflow-hidden text-ellipsis whitespace-nowrap">
                        {employee.employee_number}
                      </td>
                      <td
                        className="py-3 px-4 overflow-hidden text-ellipsis whitespace-nowrap"
                        title={`${employee.first_name} ${employee.last_name}`}
                      >
                        {(() => {
                          const fullName = `${employee.first_name} ${employee.last_name}`
                          return fullName.length > 60 ? fullName.substring(0, 57) + "..." : fullName
                        })()}
                      </td>
                      <td
                        className="py-3 px-4 overflow-hidden text-ellipsis whitespace-nowrap"
                        title={employee.position}
                      >
                        {employee.position}
                      </td>
                      <td className="py-3 px-4 overflow-hidden text-ellipsis whitespace-nowrap">
                        {getYearFromDate(employee.hire_date)}
                      </td>

                      {/* Show Year Resigned only for inactive employees */}
                      {activeTab === "inactive" && (
                        <td className="py-3 px-4 overflow-hidden text-ellipsis whitespace-nowrap">
                          {getYearFromDate(employee.resignation_date) || "-"}
                        </td>
                      )}

                      {/* Status column - only for active tab */}
                      {activeTab === "active" && (
                        <td className="py-3 px-4">
                          <span className="px-4 py-1 bg-green-100 text-green-800 rounded-full font-medium whitespace-nowrap">
                            Active
                          </span>
                        </td>
                      )}

                      {/* Actions column - only for active tab */}
                      {activeTab === "active" && (
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditClick(employee)}
                              className="bg-[#5C7346] text-white px-3 py-1 rounded-md hover:bg-[#4a5c38] transition-colors text-md md:text-lg"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleViewSchedule(employee.id)}
                              className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors text-md md:text-lg"
                            >
                              Schedule
                            </button>
                            <button
                              onClick={() => handleDeleteClick(employee)}
                              className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors text-md md:text-lg"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}

                  {/* Empty rows for consistent height */}
                  {[...Array(Math.max(0, employeesPerPage - currentEmployees.length))].map((_, index) => (
                    <tr key={`empty-${index}`} className="border-b border-white/10 h-[52px]">
                      <td colSpan={activeTab === "inactive" ? "5" : "7"}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Section - Responsive layout */}
          {/* Footer Section - Responsive layout with Add Account and pagination on same row */}
          <div className="flex flex-row justify-between items-center mt-6">
            {activeTab === "active" && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-[#5C7346] text-white px-6 py-2 rounded-md hover:bg-[#4a5c38] transition-colors font-medium"
              >
                Add Account
              </button>
            )}
            {activeTab === "inactive" && <div></div>} {/* Empty div for spacing when inactive tab */}
            <div className="flex justify-center space-x-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="bg-[#5C7346] text-white px-4 py-2 rounded-md hover:bg-[#4a5c38] transition-colors disabled:opacity-50"
              >
                Previous
              </button>
              <div className="bg-white text-[#5C7346] px-4 py-2 rounded-md min-w-[80px] text-center">
                {currentPage} of {totalPages}
              </div>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="bg-[#5C7346] text-white px-4 py-2 rounded-md hover:bg-[#4a5c38] transition-colors disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddEmployee isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddEmployee} />

      <EditEmployee
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEmployeeToEdit(null)
        }}
        onUpdate={handleUpdateEmployee}
        employeeData={employeeToEdit}
      />

      <DeleteEmployee
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setEmployeeToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        employeeName={employeeToDelete ? `${employeeToDelete.first_name} ${employeeToDelete.last_name}` : ""}
      />
    </div>
  )
}

export default AdminEmployeePage
