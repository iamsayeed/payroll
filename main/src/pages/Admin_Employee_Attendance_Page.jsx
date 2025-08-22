"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import NavBar from "../components/Nav_Bar.jsx"
import { API_BASE_URL } from "../config/api"

function AdminEmployeeAttendancePage() {
  const navigate = useNavigate()

  // Calculate biweekly date range (today to 14 days from today)
  const today = new Date()
  const twoWeeksLater = new Date(today)
  twoWeeksLater.setDate(today.getDate() + 14)

  const [activeTab, setActiveTab] = useState("attendance") // Tab state
  const [attendanceData, setAttendanceData] = useState([])
  const [rawAttendanceData, setRawAttendanceData] = useState([])
  const [overtimeData, setOvertimeData] = useState([]) // State for overtime data
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 7
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Add filters for attendance data
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  // Fetch employees for the dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const accessToken = localStorage.getItem("access_token")
        const response = await fetch(`${API_BASE_URL}/employment-info/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch employees")
        }

        const data = await response.json()
        setEmployees(data)
        console.log("Employees fetched:", data.length)
      } catch (error) {
        console.error("Error fetching employees:", error)
        setError("An error occurred while fetching employees. Please try again later.")
      }
    }

    fetchEmployees()
  }, [])

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true)
      setError(null)
      try {
        const accessToken = localStorage.getItem("access_token")

        // Build the URL with query parameters
        let url = `${API_BASE_URL}/attendance/`
        const params = new URLSearchParams()

        if (params.toString()) {
          url += `?${params.toString()}`
        }

        console.log("Fetching attendance data from:", url)

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch attendance data: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Attendance data fetched:", data.length, data)

        // Store the raw data
        setRawAttendanceData(data)
      } catch (error) {
        console.error("Error fetching attendance data:", error)
        setError("An error occurred while fetching attendance data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchAttendanceData()
  }, [])

  // Fetch overtime hours data
  useEffect(() => {
    const fetchOvertimeData = async () => {
      setLoading(true)
      setError(null)
      try {
        const accessToken = localStorage.getItem("access_token")
        const url = `${API_BASE_URL}/overtimehours/`

        console.log("Fetching overtime data from:", url)

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch overtime data: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Overtime data fetched:", data.length, data)

        // Process the overtime data to include employee info
        const processedData = await enrichOvertimeData(data)

        // Sort overtime data by biweek_start in descending order (newest first)
        const sortedData = [...processedData].sort((a, b) => {
          const dateA = new Date(a.biweek_start).getTime()
          const dateB = new Date(b.biweek_start).getTime()
          return dateB - dateA
        })

        setOvertimeData(sortedData)
      } catch (error) {
        console.error("Error fetching overtime data:", error)
        setError("An error occurred while fetching overtime data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchOvertimeData()
  }, [])

  // Process attendance data whenever raw data or employees change
  useEffect(() => {
    const processAttendanceData = async () => {
      if (rawAttendanceData.length > 0 && employees.length > 0) {
        const processedData = await enrichAttendanceData(rawAttendanceData)

        // Sort the processed data by date in descending order (newest first)
        const sortedData = [...processedData].sort((a, b) => {
          // Convert dates to timestamps for comparison
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()

          // Sort in descending order (newest first)
          return dateB - dateA
        })

        setAttendanceData(sortedData)
      }
    }

    processAttendanceData()
  }, [rawAttendanceData, employees])

  // Enrich overtime data with employee names
  const enrichOvertimeData = async (overtimeRecords) => {
    // If no overtime records, return empty array
    if (!overtimeRecords || !Array.isArray(overtimeRecords) || overtimeRecords.length === 0) {
      console.log("No overtime records to process")
      return []
    }

    // Process the records directly using the new structure
    return overtimeRecords.map((record) => {
      // Get employee info from the nested employment_info object
      const employmentInfo = record.employment_info || {}

      // Create employee name from first_name and last_name in employment_info
      const firstName = employmentInfo.first_name || ""
      const lastName = employmentInfo.last_name || ""
      const employeeName = `${firstName} ${lastName}`.trim() || `Unknown (ID: ${record.user})`

      // Get employee number from employment_info
      const employeeNumber = employmentInfo.employee_number || record.user

      return {
        ...record,
        employee_name: employeeName,
        employee_id: employeeNumber,
        employment_info_id: employmentInfo.id || null,
      }
    })
  }

  // Enrich attendance data with employee names
  const enrichAttendanceData = async (attendanceRecords) => {
    // If no attendance records, return empty array
    if (!attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      console.log("No attendance records to process")
      return []
    }

    // If no employees data, return records with placeholders
    if (!employees || employees.length === 0) {
      console.log("No employee data available for mapping")
      return attendanceRecords.map((record) => ({
        ...record,
        employee_name: `Loading... (ID: ${record.user})`,
        employee_id: "Loading...",
        time_in: formatTime(record.check_in_time),
        time_out: formatTime(record.check_out_time),
      }))
    }

    // Create a map of user IDs to employee information
    const employeeMap = new Map()

    employees.forEach((employee) => {
      // Find the user ID associated with this employee
      const userId = employee.user?.id
      if (userId) {
        employeeMap.set(userId, {
          name: `${employee.first_name} ${employee.last_name}`,
          employeeNumber: employee.employee_number,
          id: employee.id, // Store the employee ID for schedule lookup
        })
      }
    })

    console.log("Employee map created with", employeeMap.size, "entries")

    // Enrich attendance records with employee names
    return attendanceRecords.map((record) => {
      const userId = record.user
      const employeeInfo = employeeMap.get(userId)

      return {
        ...record,
        employee_name: employeeInfo ? employeeInfo.name : `Unknown (ID: ${userId})`,
        employee_id: employeeInfo ? employeeInfo.employeeNumber : `User ID: ${userId}`,
        employment_info_id: employeeInfo ? employeeInfo.id : null, // Add employment_info_id for schedule lookup
        // Format times for display
        time_in: formatTime(record.check_in_time),
        time_out: formatTime(record.check_out_time),
      }
    })
  }

  // Helper function to format time from "HH:MM:SS" to "HH:MM AM/PM"
  const formatTime = (timeString) => {
    if (!timeString) return "-"

    try {
      // Parse the time string (assuming format is "HH:MM:SS")
      const [hours, minutes] = timeString.split(":")
      const hour = Number.parseInt(hours, 10)
      const minute = Number.parseInt(minutes, 10)

      // Create a date object to use toLocaleTimeString
      const date = new Date()
      date.setHours(hour)
      date.setMinutes(minute)

      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch (error) {
      console.error("Error formatting time:", error)
      return timeString // Return original if parsing fails
    }
  }

  // Helper function to format date from "YYYY-MM-DD" to a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return "-"

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString // Return original if parsing fails
    }
  }

  // Get the month from date string
  const getMonthFromDate = (dateString) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("default", { month: "long" })
  }

  // Handle delete attendance record
  const handleDeleteAttendance = async (attendanceId, userId, date, checkInTime, checkOutTime) => {
    if (
      !window.confirm(
        "Deleting an attendance record will delete its corresponding biometricdata and its summary. Are you sure you want to delete this attendance record?",
      )
    ) {
      return
    }

    setDeleteLoading(true)
    try {
      const accessToken = localStorage.getItem("access_token")

      // 1. First, fetch biometric data to find matching records
      const bioResponse = await fetch(`${API_BASE_URL}/biometricdata/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!bioResponse.ok) {
        throw new Error(`Failed to fetch biometric data: ${bioResponse.status} ${bioResponse.statusText}`)
      }

      const bioData = await bioResponse.json()
      console.log("Fetched biometric data:", bioData)

      // 2. Filter biometric records that match this attendance record
      // Convert attendance date to YYYY-MM-DD format for comparison
      const attendanceDate = new Date(date).toISOString().split("T")[0]

      const matchingBioRecords = bioData.filter((record) => {
        // Match by employee ID
        const empIdMatch = record.emp_id === userId

        // Match by date (compare only the date part of the timestamp)
        const bioDate = new Date(record.time).toISOString().split("T")[0]
        const dateMatch = bioDate === attendanceDate

        // Match by time (either check-in or check-out)
        // Extract just the time part for comparison (HH:MM:SS)
        const bioTime = new Date(record.time).toISOString().split("T")[1].substring(0, 8)
        const checkInMatch = bioTime === checkInTime
        const checkOutMatch = bioTime === checkOutTime

        return empIdMatch && dateMatch && (checkInMatch || checkOutMatch)
      })

      console.log("Matching biometric records to delete:", matchingBioRecords)

      // 3. Delete each matching biometric record
      const bioDeletionPromises = matchingBioRecords.map((record) =>
        fetch(`${API_BASE_URL}/biometricdata/${record.id}/`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }),
      )

      // Wait for all biometric deletions to complete
      const bioResults = await Promise.allSettled(bioDeletionPromises)
      console.log("Biometric deletion results:", bioResults)

      // Check if any biometric deletions failed
      const failedBioDeletions = bioResults.filter((result) => result.status === "rejected")
      if (failedBioDeletions.length > 0) {
        console.warn(`${failedBioDeletions.length} biometric records failed to delete`)
      }

      // 4. Delete the attendance record
      const attendanceResponse = await fetch(`${API_BASE_URL}/attendance/${attendanceId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!attendanceResponse.ok) {
        throw new Error(
          `Failed to delete attendance record: ${attendanceResponse.status} ${attendanceResponse.statusText}`,
        )
      }

      // 5. Remove the deleted record from the state
      setRawAttendanceData((prevData) => prevData.filter((record) => record.id !== attendanceId))
      alert("Attendance record and associated biometric data deleted successfully")
    } catch (error) {
      console.error("Error deleting records:", error)
      alert(`Failed to delete records: ${error.message}`)
    } finally {
      setDeleteLoading(false)
    }
  }

  // Get unique statuses and months for filters
  const statuses = [...new Set(attendanceData.map((record) => record.status))]
    .filter((status) => status) // Filter out null/undefined
    .sort()

  const months = [...new Set(attendanceData.map((record) => getMonthFromDate(record.date)))]
    .filter((month) => month !== "-")
    .sort()

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1) // Reset to first page when changing tabs
    // Reset filters
    setStatusFilter("all")
    setDateFilter("all")
  }

  // Filter attendance data based on search term and filters
  const filteredAttendanceData = attendanceData.filter((record) => {
    const searchTermLower = searchTerm.toLowerCase()

    // Search across multiple columns
    const nameMatch =
      record.employee_name?.toLowerCase().includes(searchTermLower) ||
      record.employee_id?.toString().toLowerCase().includes(searchTermLower) ||
      (record.date && new Date(record.date).toLocaleDateString().includes(searchTermLower)) ||
      (record.status && record.status.toLowerCase().includes(searchTermLower)) ||
      (record.time_in && record.time_in.toLowerCase().includes(searchTermLower)) ||
      (record.time_out && record.time_out.toLowerCase().includes(searchTermLower))

    const statusMatch = statusFilter === "all" || record.status === statusFilter

    const monthMatch = dateFilter === "all" || getMonthFromDate(record.date) === dateFilter

    return nameMatch && statusMatch && monthMatch
  })

  // Filter overtime data based on search term
  const filteredOvertimeData = overtimeData.filter((record) => {
    const searchTermLower = searchTerm.toLowerCase()

    // Search across multiple columns
    return (
      record.employee_name?.toLowerCase().includes(searchTermLower) ||
      record.employee_id?.toString().toLowerCase().includes(searchTermLower) ||
      (record.biweek_start && new Date(record.biweek_start).toLocaleDateString().includes(searchTermLower))
    )
  })

  // Get current records based on active tab
  const currentData = activeTab === "attendance" ? filteredAttendanceData : filteredOvertimeData

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = currentData.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(currentData.length / recordsPerPage)

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  // Reset to page 1 when changing tabs
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  // Determine status color based on status string
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "present":
        return "bg-green-100 text-green-800"
      case "late":
        return "bg-yellow-400 text-yellow-800"
      case "absent":
        return "bg-red-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container mx-auto px-4 pt-24">
        <div className="bg-[#A7BC8F] rounded-lg p-6">
          {/* Header Section with Tabs inside the box */}
          <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center mb-6">
            {/* Tab Buttons */}
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 md:px-6 md:py-2 rounded-md ${
                  activeTab === "attendance" ? "bg-[#5C7346] text-white font-semibold" : "bg-[#D1DBC4] text-gray-700"
                }`}
                onClick={() => handleTabChange("attendance")}
              >
                ATTENDANCE
              </button>
              <button
                className={`px-4 py-2 md:px-6 md:py-2 rounded-md ${
                  activeTab === "summary" ? "bg-[#5C7346] text-white font-semibold" : "bg-[#D1DBC4] text-gray-700"
                }`}
                onClick={() => handleTabChange("summary")}
              >
                SUMMARY
              </button>
            </div>

            {/* Search and Filters - Stack on mobile, side by side on larger screens */}
            <div className="flex flex-row md:flex-row md:space-y-0 md:space-x-2 md:items-center">
              <input
                type="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 mr-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346] w-full md:w-54"
              />

              {/* Only show these filters for attendance tab */}
              {activeTab === "attendance" && (
                <div className="flex space-x-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346] bg-white"
                  >
                    <option value="all">All Statuses</option>
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346] bg-white"
                  >
                    <option value="all">All Months</option>
                    {months.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-white mb-4">
            {activeTab === "attendance" ? "Attendance Records" : "Attendance Summary"}
          </h2>

          {/* Table Section - Attendance Tab */}
          {activeTab === "attendance" && (
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed">
                <thead>
                  <tr className="text-left text-white border-b border-white/20">
                    <th className="py-3 px-4 w-[10%]">DATE</th>
                    <th className="py-3 px-4 w-[10%]">EMPLOYEE ID</th>
                    <th className="py-3 px-4 w-[30%]">NAME</th>
                    <th className="py-3 px-4 w-[12%]">TIME IN</th>
                    <th className="py-3 px-4 w-[12%]">TIME OUT</th>
                    <th className="py-3 px-4 w-[12%]">STATUS</th>
                    <th className="py-3 px-4 w-[15%]">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {currentRecords.length > 0 ? (
                    currentRecords.map((record) => (
                      <tr key={record.id} className="border-b border-white/10 text-md">
                        <td className="py-3 px-4">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4">{record.employee_id}</td>
                        <td className="py-3 px-4">{record.employee_name}</td>
                        <td className="py-3 px-4">{record.time_in}</td>
                        <td className="py-3 px-4">{record.time_out}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-4 py-1 rounded-full font-medium whitespace-nowrap ${getStatusColor(record.status)}`}
                          >
                            {record.status || "Unknown"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                handleDeleteAttendance(
                                  record.id,
                                  record.user,
                                  record.date,
                                  record.check_in_time,
                                  record.check_out_time,
                                )
                              }
                              disabled={deleteLoading}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md transition-colors text-md md:text-lg"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-4 text-center">
                        No attendance records found
                      </td>
                    </tr>
                  )}
                  {/* Add empty rows to maintain table height */}
                  {currentRecords.length > 0 &&
                    [...Array(Math.max(0, recordsPerPage - currentRecords.length))].map((_, index) => (
                      <tr key={`empty-${index}`} className="border-b border-white/10 h-[52px]">
                        <td colSpan="7"></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Section - Summary Tab */}
          {activeTab === "summary" && (
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed">
                <thead>
                  <tr className="text-left text-white border-b border-white/20">
                    <th className="py-3 px-4 w-[12%]">BIWEEK START</th>
                    <th className="py-3 px-4 w-[10%]">EMPLOYEE ID</th>
                    <th className="py-3 px-4 w-[20%]">NAME</th>
                    <th className="py-3 px-4 w-[7%]">ACTUAL HRS</th>
                    <th className="py-3 px-4 w-[7%]">REG OT</th>
                    <th className="py-3 px-4 w-[7%]">REG HOLIDAY</th>
                    <th className="py-3 px-4 w-[7%]">SPEC HOLIDAY</th>
                    <th className="py-3 px-4 w-[7%]">REST DAY</th>
                    <th className="py-3 px-4 w-[7%]">NIGHT DIFF</th>
                    <th className="py-3 px-4 w-[7%]">UNDERTIME</th>
                    <th className="py-3 px-4 w-[7%]">LATE</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {currentRecords.length > 0 ? (
                    currentRecords.map((record) => (
                      <tr key={record.id} className="border-b border-white/10 text-md">
                        <td className="py-3 px-4">{formatDate(record.biweek_start)}</td>
                        <td className="py-3 px-4">{record.employee_id}</td>
                        <td className="py-3 px-4">{record.employee_name}</td>
                        <td className="py-3 px-4">{record.actualhours} h</td>
                        <td className="py-3 px-4">{record.regularot} h</td>
                        <td className="py-3 px-4">{record.regularholiday} h</td>
                        <td className="py-3 px-4">{record.specialholiday} h</td>
                        <td className="py-3 px-4">{record.restday} h</td>
                        <td className="py-3 px-4">{record.nightdiff} h</td>
                        <td className="py-3 px-4">{record.undertime} h</td>
                        <td className="py-3 px-4">{record.late} m</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" className="py-4 text-center">
                        No overtime records found
                      </td>
                    </tr>
                  )}
                  {/* Add empty rows to maintain table height */}
                  {currentRecords.length > 0 &&
                    [...Array(Math.max(0, recordsPerPage - currentRecords.length))].map((_, index) => (
                      <tr key={`empty-${index}`} className="border-b border-white/10 h-[52px]">
                        <td colSpan="11"></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Section */}
          <div className="flex justify-end items-center mt-6">
            <div className="flex space-x-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`bg-[#5C7346] text-white px-4 py-2 rounded-md hover:bg-[#4a5c38] transition-colors ${
                  currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Previous
              </button>
              <div className="bg-white text-[#5C7346] px-4 py-2 rounded-md min-w-[80px] text-center">
                {currentPage} of {totalPages || 1}
              </div>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`bg-[#5C7346] text-white px-4 py-2 rounded-md hover:bg-[#4a5c38] transition-colors ${
                  currentPage === totalPages || totalPages === 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminEmployeeAttendancePage
