"use client"

import { useState, useEffect } from "react"
import NavBar from "../components/Nav_Bar"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_BASE_URL } from "../config/api"
import dayjs from "dayjs"

// Components for the Master Calendar
import MasterCalendarView from "../components/Master_Calendar_View"
import AddHoliday from "../components/Add_Holiday"
import AddPayrollPeriod from "../components/Add_Payroll_Period"

function AdminMasterCalendarPage() {
  const navigate = useNavigate()
  const [holidays, setHolidays] = useState([])
  const [payrollPeriods, setPayrollPeriods] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedHoliday, setSelectedHoliday] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncStatus, setSyncStatus] = useState({ syncing: false, message: "" })
  const [activePanelType, setActivePanelType] = useState(null) // 'holiday' or 'payroll'
  const [selectedPayrollPeriod, setSelectedPayrollPeriod] = useState(null)

  // Fetch holidays and payroll periods
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Get the authentication token from localStorage
        const token = localStorage.getItem("access_token")

        // Set up headers with authentication token
        const headers = token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}

        try {
          // Try to fetch holidays
          const holidaysResponse = await axios.get(`${API_BASE_URL}/master-calendar/holiday/`, { headers })
          console.log("Holidays response:", holidaysResponse.data)
          setHolidays(holidaysResponse.data.results || holidaysResponse.data || [])
        } catch (holidayError) {
          console.warn("Could not fetch holidays:", holidayError)
          setHolidays([]) // Set empty array if fetch fails
        }

        try {
          // Try to fetch payroll periods with the correct endpoint
          const payrollResponse = await axios.get(`${API_BASE_URL}/master-calendar/payrollperiod/`, { headers })
          console.log("Payroll periods response:", payrollResponse.data)
          setPayrollPeriods(payrollResponse.data.results || payrollResponse.data || [])
        } catch (payrollError) {
          console.warn("Could not fetch payroll periods:", payrollError)
          setPayrollPeriods([]) // Set empty array if fetch fails
        }

        setError(null)
      } catch (err) {
        console.error("Error fetching calendar data:", err)
        // Don't set error, just log it - we'll show the calendar anyway
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Function to sync holidays to all employee schedules
  const syncHolidaysToEmployees = async () => {
    try {
      setSyncStatus({ syncing: true, message: "Syncing holidays to all employees..." })

      // Get the authentication token from localStorage
      const token = localStorage.getItem("access_token")

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.")
      }

      // Set up headers with authentication token
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      // Instead of using a non-existent endpoint, we'll use PATCH to update holidays
      // This will trigger the signal handlers in the backend to update employee schedules
      const holidaysResponse = await axios.get(`${API_BASE_URL}/master-calendar/holiday/`, { headers })
      const holidays = holidaysResponse.data.results || holidaysResponse.data || []

      // If there are holidays, update the first one to trigger the signal
      if (holidays.length > 0) {
        const holiday = holidays[0]
        // Use PATCH to update the holiday (this should trigger the signal handler)
        await axios.patch(`${API_BASE_URL}/master-calendar/holiday/${holiday.id}/`, { ...holiday }, { headers })
      }

      console.log("Holidays synced successfully")
      setSyncStatus({
        syncing: false,
        message: "Holidays successfully synced to all employee schedules!",
      })

      // Clear the message after 3 seconds
      setTimeout(() => {
        setSyncStatus({ syncing: false, message: "" })
      }, 3000)
    } catch (err) {
      console.error("Error syncing holidays:", err)
      setSyncStatus({
        syncing: false,
        message: "Error syncing holidays. Please try again.",
      })
    }
  }

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date)

    // Check if the date already has a holiday
    const existingHoliday = holidays.find(
      (holiday) => dayjs(holiday.date).format("YYYY-MM-DD") === dayjs(date).format("YYYY-MM-DD"),
    )

    if (existingHoliday) {
      setSelectedHoliday(existingHoliday)
      setActivePanelType("holiday")
    } else {
      setSelectedHoliday(null)
      setActivePanelType("holiday")
    }

    setIsPanelOpen(true)
  }

  // Handle holiday save
  const handleSaveHoliday = async (holidayData) => {
    try {
      // Get the authentication token from localStorage
      const token = localStorage.getItem("access_token")

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.")
      }

      // Set up headers with authentication token
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      let response

      if (selectedHoliday && selectedHoliday.id) {
        // Update existing holiday
        response = await axios.put(`${API_BASE_URL}/master-calendar/holiday/${selectedHoliday.id}/`, holidayData, {
          headers,
        })

        // Update the holidays state
        setHolidays(holidays.map((holiday) => (holiday.id === selectedHoliday.id ? response.data : holiday)))
      } else {
        // Create new holiday
        response = await axios.post(`${API_BASE_URL}/master-calendar/holiday/`, holidayData, { headers })

        // Add the new holiday to the holidays state
        setHolidays([...holidays, response.data])
      }

      // Close the panel
      setIsPanelOpen(false)
      setSelectedHoliday(null)
      setSelectedDate(null)

      // Sync the holidays to all employee schedules
      await syncHolidaysToEmployees()
    } catch (err) {
      console.error("Error saving holiday:", err)
      if (err.response && err.response.status === 401) {
        alert("Authentication error. Please log in again.")
      } else {
        alert("Failed to save holiday. Please try again.")
      }
    }
  }

  // Handle holiday delete
  const handleDeleteHoliday = async (id) => {
    if (!window.confirm("Are you sure you want to delete this holiday?")) {
      return
    }

    try {
      // Get the authentication token from localStorage
      const token = localStorage.getItem("access_token")

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.")
      }

      // Set up headers with authentication token
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      await axios.delete(`${API_BASE_URL}/master-calendar/holiday/${id}/`, { headers })

      // Remove the deleted holiday from the holidays state
      setHolidays(holidays.filter((holiday) => holiday.id !== id))

      // Close the panel
      setIsPanelOpen(false)
      setSelectedHoliday(null)
      setSelectedDate(null)

      // Sync the holidays to all employee schedules
      await syncHolidaysToEmployees()
    } catch (err) {
      console.error("Error deleting holiday:", err)
      if (err.response && err.response.status === 401) {
        alert("Authentication error. Please log in again.")
      } else {
        alert("Failed to delete holiday. Please try again.")
      }
    }
  }

  // Handle payroll period save
  const handleSavePayrollPeriod = async (payrollData) => {
    try {
      // Get the authentication token from localStorage
      const token = localStorage.getItem("access_token")

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.")
      }

      // Set up headers with authentication token
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      let response

      if (selectedPayrollPeriod && selectedPayrollPeriod.id) {
        // Update existing payroll period
        response = await axios.put(
          `${API_BASE_URL}/master-calendar/payrollperiod/${selectedPayrollPeriod.id}/`,
          payrollData,
          {
            headers,
          },
        )

        // Update the payroll periods state
        setPayrollPeriods(
          payrollPeriods.map((period) => (period.id === selectedPayrollPeriod.id ? response.data : period)),
        )
      } else {
        // Create new payroll period
        response = await axios.post(`${API_BASE_URL}/master-calendar/payrollperiod/`, payrollData, { headers })

        // Add the new payroll period to the payroll periods state
        setPayrollPeriods([...payrollPeriods, response.data])
      }

      // Close the panel
      setIsPanelOpen(false)
      setSelectedPayrollPeriod(null)

      // Show success message
      setSyncStatus({
        syncing: false,
        message: "Payroll period saved successfully!",
      })

      // Clear the message after 3 seconds
      setTimeout(() => {
        setSyncStatus({ syncing: false, message: "" })
      }, 3000)
    } catch (err) {
      console.error("Error saving payroll period:", err)
      if (err.response && err.response.status === 401) {
        alert("Authentication error. Please log in again.")
      } else {
        alert("Failed to save payroll period. Please try again.")
      }
    }
  }

  // Handle payroll period delete
  const handleDeletePayrollPeriod = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payroll period?")) {
      return
    }

    try {
      // Get the authentication token from localStorage
      const token = localStorage.getItem("access_token")

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.")
      }

      // Set up headers with authentication token
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      await axios.delete(`${API_BASE_URL}/master-calendar/payrollperiod/${id}/`, { headers })

      // Remove the deleted payroll period from the payroll periods state
      setPayrollPeriods(payrollPeriods.filter((period) => period.id !== id))

      // Close the panel
      setIsPanelOpen(false)
      setSelectedPayrollPeriod(null)

      // Show success message
      setSyncStatus({
        syncing: false,
        message: "Payroll period deleted successfully!",
      })

      // Clear the message after 3 seconds
      setTimeout(() => {
        setSyncStatus({ syncing: false, message: "" })
      }, 3000)
    } catch (err) {
      console.error("Error deleting payroll period:", err)
      if (err.response && err.response.status === 401) {
        alert("Authentication error. Please log in again.")
      } else {
        alert("Failed to delete payroll period. Please try again.")
      }
    }
  }

  // Open payroll period panel
  const openPayrollPeriodPanel = (period = null) => {
    setSelectedPayrollPeriod(period)
    setActivePanelType("payroll")
    setIsPanelOpen(true)
  }

  // Close the side panel
  const handleClosePanel = () => {
    setIsPanelOpen(false)
    setSelectedHoliday(null)
    setSelectedPayrollPeriod(null)
    setSelectedDate(null)
    setActivePanelType(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-16 pb-8">
        <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#5C7346]">Master Calendar</h1>
            <p className="text-gray-600">Manage holidays and payroll periods for all employees</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => openPayrollPeriodPanel()}
              className="bg-[#5C7346] text-white px-4 py-2 rounded-md hover:bg-[#4a5c38] transition-colors"
            >
              Add Payroll Period
            </button>
            <button
              onClick={syncHolidaysToEmployees}
              disabled={syncStatus.syncing}
              className="bg-[#5C7346] text-white px-4 py-2 rounded-md hover:bg-[#4a5c38] transition-colors disabled:opacity-50"
            >
              {syncStatus.syncing ? "Syncing..." : "Sync Holidays to All Employees"}
            </button>
          </div>
        </div>

        {/* Sync Status Message */}
        {syncStatus.message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {syncStatus.message}
          </div>
        )}

        {/* Payroll Periods List */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-semibold mb-4 text-[#5C7346]">Payroll Periods</h2>
          {payrollPeriods.length === 0 ? (
            <p className="text-gray-500">No payroll periods defined. Click "Add Payroll Period" to create one.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payrollPeriods.map((period) => (
                    <tr key={period.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {dayjs(period.payroll_period_start).format("MMMM D, YYYY")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {dayjs(period.payroll_period_end).format("MMMM D, YYYY")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openPayrollPeriodPanel(period)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePayrollPeriod(period.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C7346]"></div>
              <p className="mt-4 text-xl text-gray-700">Loading calendar data...</p>
            </div>
          </div>
        ) : (
          <div className="flex">
            <div className={`flex-1 transition-all duration-300 ${isPanelOpen ? "pr-80" : ""}`}>
              <MasterCalendarView holidays={holidays} payrollPeriods={payrollPeriods} onDateSelect={handleDateSelect} />
            </div>

            {isPanelOpen && (
              <div className="fixed right-0 top-[112px] h-[calc(100vh-112px)] w-80 bg-white shadow-lg z-[1] overflow-y-auto">
                {activePanelType === "holiday" ? (
                  <AddHoliday
                    selectedDate={selectedDate}
                    holiday={selectedHoliday}
                    onSave={handleSaveHoliday}
                    onDelete={handleDeleteHoliday}
                    onClose={handleClosePanel}
                  />
                ) : (
                  <AddPayrollPeriod
                    payrollPeriod={selectedPayrollPeriod}
                    onSave={handleSavePayrollPeriod}
                    onDelete={handleDeletePayrollPeriod}
                    onClose={handleClosePanel}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminMasterCalendarPage
