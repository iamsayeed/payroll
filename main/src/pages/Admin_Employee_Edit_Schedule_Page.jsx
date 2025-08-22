"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import NavBar from "../components/Nav_Bar"
import { ArrowLeft, ArrowRight, User2, Calendar, Clock, CheckSquare, Trash2, CalendarDays } from "lucide-react"
import dayjs from "dayjs"
import { API_BASE_URL } from "../config/api"
import axios from "axios"

function AdminEmployeeEditSchedulePage() {
  const { employeeId } = useParams()
  const navigate = useNavigate()

  // State for employee data
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // State for calendar and schedule
  const currentYear = dayjs().format("YYYY")
  const currentMonth = dayjs().format("MMMM")
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [schedule, setSchedule] = useState({
    id: null,
    user_id: null, // We'll set this after fetching employee data
    shift_ids: [],
    days: [],
    sickleave: null,
    regularholiday: [],
    specialholiday: [],
    nightdiff: [],
    oncall: [],
    vacationleave: [],
    payroll_period: "",
    hours: 8,
    bi_weekly_start: "",
    payroll_period_start: null,
    payroll_period_end: null,
  })

  // State for payroll periods
  const [payrollPeriods, setPayrollPeriods] = useState([])
  const [selectedPayrollPeriodId, setSelectedPayrollPeriodId] = useState(null)
  const [payrollPeriodStart, setPayrollPeriodStart] = useState(null)
  const [payrollPeriodEnd, setPayrollPeriodEnd] = useState(null)
  const [isEditingPayrollPeriod, setIsEditingPayrollPeriod] = useState(false)
  const [hasScheduleBeenSaved, setHasScheduleBeenSaved] = useState(false)

  // State for selected days and shifts - start with none selected
  const [selectedDays, setSelectedDays] = useState({
    S: false,
    M: false,
    T: false,
    W: false,
    T2: false,
    F: false,
    S2: false,
  })
  const [selectedShift, setSelectedShift] = useState("")
  const [customShiftStart, setCustomShiftStart] = useState("8:00 AM")
  const [customShiftEnd, setCustomShiftEnd] = useState("5:00 PM")

  // State for calendar data
  const [calendarDays, setCalendarDays] = useState([])
  const [dayStatus, setDayStatus] = useState({})
  const [shifts, setShifts] = useState([])
  const [attendanceData, setAttendanceData] = useState({})
  const [holidays, setHolidays] = useState([])

  // State to track if we're currently processing shifts to prevent duplicates
  const [isProcessingShifts, setIsProcessingShifts] = useState(false)

  // State to track day-specific shifts
  const [dayShifts, setDayShifts] = useState({
    Sunday: { type: "", start: "", end: "" },
    Monday: { type: "", start: "", end: "" },
    Tuesday: { type: "", start: "", end: "" },
    Wednesday: { type: "", start: "", end: "" },
    Thursday: { type: "", start: "", end: "" },
    Friday: { type: "", start: "", end: "" },
    Saturday: { type: "", start: "", end: "" },
  })

  // Helper function to check if a date is within the current payroll period
  const isDateInPayrollPeriod = (date) => {
    if (!payrollPeriodStart || !payrollPeriodEnd) return true // If no period set, allow all dates

    const dateObj = dayjs(date)
    const startDate = dayjs(payrollPeriodStart)
    const endDate = dayjs(payrollPeriodEnd)

    return dateObj.isAfter(startDate.subtract(1, "day")) && dateObj.isBefore(endDate.add(1, "day"))
  }

  // Helper function to convert time string (e.g., "8:00 AM") to time format (e.g., "08:00:00")
  const convertTimeStringToTimeFormat = (timeString) => {
    if (!timeString) return "00:00:00"

    const [time, modifier] = timeString.split(" ")
    let [hours, minutes] = time.split(":")
    hours = Number.parseInt(hours)

    if (modifier === "PM" && hours !== 12) hours = hours + 12
    if (modifier === "AM" && hours === 12) hours = 0

    hours = hours.toString().padStart(2, "0")
    minutes = minutes.padStart(2, "0")

    return `${hours}:${minutes}:00`
  }

  // Helper function to convert time format (e.g., "08:00:00") to time string (e.g., "8:00 AM")
  const convertTimeFormatToTimeString = (timeFormat) => {
    if (!timeFormat) return "12:00 AM"

    const [hours, minutes, seconds] = timeFormat.split(":")
    let hour = Number.parseInt(hours)
    const modifier = hour >= 12 ? "PM" : "AM"

    hour = hour % 12
    hour = hour ? hour : 12 // the hour '0' should be '12'

    return `${hour}:${minutes} ${modifier}`
  }

  // Fetch holidays
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const accessToken = localStorage.getItem("access_token")
        const response = await fetch(`${API_BASE_URL}/master-calendar/holidays/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setHolidays(data)
          console.log("Fetched holidays:", data)
        }
      } catch (error) {
        console.error("Error fetching holidays:", error)
      }
    }

    fetchHolidays()
  }, [])

  // Fetch payroll periods
  useEffect(() => {
    const fetchPayrollPeriods = async () => {
      try {
        setLoading(true)
        const accessToken = localStorage.getItem("access_token")

        // Use the correct endpoint for master calendar payroll periods
        const response = await fetch(`${API_BASE_URL}/master-calendar/payrollperiod/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch payroll periods: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Fetched payroll periods:", data)

        // Sort payroll periods by start date (newest first)
        const sortedPeriods = data.sort((a, b) => new Date(a.payroll_period_start) - new Date(b.payroll_period_start))

        setPayrollPeriods(sortedPeriods)

        // If we have payroll periods, find the one that includes today's date
        if (sortedPeriods.length > 0) {
          const today = dayjs()
          // Find a period that includes today
          const currentPeriod =
            sortedPeriods.find((period) => {
              const start = dayjs(period.payroll_period_start)
              const end = dayjs(period.payroll_period_end)
              return today.isAfter(start.subtract(1, "day")) && today.isBefore(end.add(1, "day"))
            }) || sortedPeriods[0] // Default to first period if none includes today

          setSelectedPayrollPeriodId(currentPeriod.id)
          setPayrollPeriodStart(currentPeriod.payroll_period_start)
          setPayrollPeriodEnd(currentPeriod.payroll_period_end)
        }
      } catch (error) {
        console.error("Error fetching payroll periods:", error)
        setError(`Failed to fetch payroll periods: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchPayrollPeriods()
  }, [])

  // Handle payroll period selection
  const handlePayrollPeriodChange = (e) => {
    const periodId = Number(e.target.value)
    setSelectedPayrollPeriodId(periodId)

    const selectedPeriod = payrollPeriods.find((period) => period.id === periodId)
    if (selectedPeriod) {
      setPayrollPeriodStart(selectedPeriod.payroll_period_start)
      setPayrollPeriodEnd(selectedPeriod.payroll_period_end)

      // Navigate to the month of the selected period
      const periodStart = dayjs(selectedPeriod.payroll_period_start)
      if (periodStart.month() !== currentDate.month() || periodStart.year() !== currentDate.year()) {
        setCurrentDate(periodStart)
        setSelectedDate(periodStart)
      }

      // Update the schedule with the new payroll period if a schedule exists and has been saved
      if (schedule.id && hasScheduleBeenSaved) {
        updateSchedulePayrollPeriod(schedule.id, selectedPeriod.payroll_period_start, selectedPeriod.payroll_period_end)
      }

      // Update the calendar to reflect the new payroll period
      setTimeout(() => {
        if (schedule && schedule.days && schedule.days.length > 0) {
          updateCalendarWithSchedule(schedule, schedule.days)
        }
      }, 100)
    }
  }

  // Update schedule with new payroll period
  const updateSchedulePayrollPeriod = async (scheduleId, startDate, endDate) => {
    try {
      setIsSaving(true)
      const accessToken = localStorage.getItem("access_token")

      const response = await fetch(`${API_BASE_URL}/schedule/${scheduleId}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payroll_period_start: startDate,
          payroll_period_end: endDate,
          bi_weekly_start: startDate,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update schedule payroll period: ${response.statusText}`)
      }

      const updatedSchedule = await response.json()
      console.log("Updated schedule with new payroll period:", updatedSchedule)
      setSchedule(updatedSchedule)
      setSaveSuccess(true)
      setSaveMessage("Payroll period updated successfully")
    } catch (error) {
      console.error("Error updating schedule payroll period:", error)
      setSaveSuccess(false)
      setSaveMessage(`Error: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Generate shifts for all instances of a specific day in the current payroll period
  const generateShiftsForDay = async (dayName) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const year = currentDate.year()
      const month = currentDate.month()
      const daysInMonth = currentDate.daysInMonth()

      // Use day-specific shift if available, otherwise use the selected shift
      const shiftType = dayShifts[dayName].type || selectedShift || "morning" // Default to morning if no shift selected
      console.log(`Generating shifts for ${dayName} with shift type: ${shiftType}`)

      // Find all dates in the current month that match the day name AND are within the payroll period
      const matchingDates = []
      for (let i = 1; i <= daysInMonth; i++) {
        const date = dayjs(new Date(year, month, i))
        if (date.format("dddd") === dayName) {
          const dateStr = date.format("YYYY-MM-DD")
          // Only include dates within the payroll period
          if (isDateInPayrollPeriod(dateStr)) {
            matchingDates.push(dateStr)
          }
        }
      }

      console.log(`Found ${matchingDates.length} matching dates for ${dayName} within payroll period:`, matchingDates)

      // Get shift times based on selected shift type
      let shiftStart, shiftEnd
      if (dayShifts[dayName].type) {
        // Use day-specific shift times if available
        const shiftType = dayShifts[dayName].type
        if (dayShifts[dayName].start && dayShifts[dayName].end) {
          shiftStart = dayShifts[dayName].start
          shiftEnd = dayShifts[dayName].end
        } else {
          // Calculate times based on the day-specific shift type
          switch (shiftType) {
            case "morning":
              shiftStart = "10:00:00"
              shiftEnd = "19:00:00"
              break
            case "midday":
              shiftStart = "12:00:00"
              shiftEnd = "21:00:00"
              break
            case "night":
              shiftStart = "14:00:00" // Corrected night shift start time
              shiftEnd = "23:00:00"
              break
            case "custom":
              shiftStart = convertTimeStringToTimeFormat(customShiftStart)
              shiftEnd = convertTimeStringToTimeFormat(customShiftEnd)
              break
            default:
              shiftStart = "10:00:00"
              shiftEnd = "19:00:00"
          }
        }
      } else {
        // Use global shift type if no day-specific type is set
        switch (shiftType) {
          case "morning":
            shiftStart = "10:00:00"
            shiftEnd = "19:00:00"
            break
          case "midday":
            shiftStart = "12:00:00"
            shiftEnd = "21:00:00"
            break
          case "night":
            shiftStart = "14:00:00" // Corrected night shift start time
            shiftEnd = "23:00:00"
            break
          case "custom":
            shiftStart = convertTimeStringToTimeFormat(customShiftStart)
            shiftEnd = convertTimeStringToTimeFormat(customShiftEnd)
            break
          default:
            // Default to morning shift if somehow no shift is selected
            shiftStart = "10:00:00"
            shiftEnd = "19:00:00"
        }
      }

      // Check for existing shifts for these dates to avoid duplicates
      const existingShifts = {}
      if (schedule.shift_ids && schedule.shift_ids.length > 0) {
        const shiftRequests = schedule.shift_ids.map((shiftId) =>
          fetch(`${API_BASE_URL}/shift/${shiftId}/`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }).then((response) => (response.ok ? response.json() : null)),
        )

        const shiftDataArray = await Promise.all(shiftRequests)
        shiftDataArray.filter(Boolean).forEach((shift) => {
          existingShifts[shift.date] = true
        })
      }

      // Create shifts for each matching date (only if no shift exists for that date)
      const newShiftIds = []
      for (const dateStr of matchingDates) {
        // Skip if we already have a shift for this date
        if (existingShifts[dateStr]) {
          console.log(`Skipping shift creation for ${dateStr} - shift already exists`)
          continue
        }

        // Create a new shift
        const shiftResponse = await fetch(`${API_BASE_URL}/shift/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: dateStr,
            shift_start: shiftStart,
            shift_end: shiftEnd,
          }),
        })

        if (shiftResponse.ok) {
          const shiftData = await shiftResponse.json()
          newShiftIds.push(shiftData.id)
          console.log(`Created shift ${shiftData.id} for ${dateStr}`)
        } else {
          console.error(`Failed to create shift for ${dateStr}:`, await shiftResponse.text())
        }
      }

      console.log(`Created ${newShiftIds.length} new shifts`)

      // Update the day status to show selected days as blue instead of green
      const newDayStatus = { ...dayStatus }
      matchingDates.forEach((dateStr) => {
        // Only update if the date doesn't have a special event status
        const hasSpecialStatus =
          schedule.sickleave === dateStr ||
          (schedule.regularholiday && schedule.regularholiday.includes(dateStr)) ||
          (schedule.specialholiday && schedule.specialholiday.includes(dateStr)) ||
          (schedule.nightdiff && schedule.nightdiff.includes(dateStr)) ||
          (schedule.oncall && schedule.oncall.includes(dateStr)) ||
          (schedule.vacationleave && schedule.vacationleave.includes(dateStr))

        // Don't change past days that are marked as absent
        const isPastDay = dayjs(dateStr).isBefore(dayjs(), "day")
        if (!hasSpecialStatus && !(isPastDay && newDayStatus[dateStr] === "absent")) {
          newDayStatus[dateStr] = "selected"
        }
      })
      setDayStatus(newDayStatus)

      return newShiftIds
    } catch (error) {
      console.error(`Error generating shifts for ${dayName}:`, error)
      return []
    }
  }

  // Create a single shift for a specific date
  const createShiftForDate = async (dateStr) => {
    try {
      // If no shift type is selected, select a default one
      if (!selectedShift) {
        setSelectedShift("morning")
      }

      const accessToken = localStorage.getItem("access_token")

      // Get shift times based on selected shift type
      let shiftStart, shiftEnd
      switch (selectedShift) {
        case "morning":
          shiftStart = "10:00:00"
          shiftEnd = "19:00:00"
          break
        case "midday":
          shiftStart = "12:00:00"
          shiftEnd = "21:00:00"
          break
        case "night":
          shiftStart = "19:00:00"
          shiftEnd = "23:00:00"
          break
        case "custom":
          shiftStart = convertTimeStringToTimeFormat(customShiftStart)
          shiftEnd = convertTimeStringToTimeFormat(customShiftEnd)
          break
        default:
          // Default to morning shift
          shiftStart = "10:00:00"
          shiftEnd = "19:00:00"
          break
      }

      // Create a new shift
      const shiftResponse = await fetch(`${API_BASE_URL}/shift/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: dateStr,
          shift_start: shiftStart,
          shift_end: shiftEnd,
        }),
      })

      if (shiftResponse.ok) {
        const shiftData = await shiftResponse.json()
        console.log(`Created shift ${shiftData.id} for ${dateStr}`)
        return shiftData.id
      } else {
        console.error(`Failed to create shift for ${dateStr}:`, await shiftResponse.text())
        return null
      }
    } catch (error) {
      console.error(`Error creating shift for ${dateStr}:`, error)
      return null
    }
  }

  // Remove shifts for a specific day
  const removeShiftsForDay = async (dayName) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const year = currentDate.year()
      const month = currentDate.month()
      const daysInMonth = currentDate.daysInMonth()

      console.log(`Removing shifts for ${dayName}`)

      // Find all dates in the current month that match the day name AND are within the payroll period
      const matchingDates = []
      for (let i = 1; i <= daysInMonth; i++) {
        const date = dayjs(new Date(year, month, i))
        if (date.format("dddd") === dayName) {
          const dateStr = date.format("YYYY-MM-DD")
          // Only include dates within the payroll period
          if (isDateInPayrollPeriod(dateStr)) {
            matchingDates.push(dateStr)
          }
        }
      }

      console.log(`Found ${matchingDates.length} dates to remove shifts for`)

      // Collect shift IDs that need to be removed
      const shiftsToRemove = []
      const shiftsToKeep = []

      if (schedule.shift_ids && schedule.shift_ids.length > 0) {
        const shiftRequests = schedule.shift_ids.map((shiftId) =>
          fetch(`${API_BASE_URL}/shift/${shiftId}/`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }).then((response) => (response.ok ? response.json() : null)),
        )

        const shiftDataArray = await Promise.all(shiftRequests)

        shiftDataArray.forEach((shiftData, index) => {
          if (shiftData && matchingDates.includes(shiftData.date)) {
            shiftsToRemove.push(schedule.shift_ids[index])
            console.log(`Found shift ${schedule.shift_ids[index]} to remove for date ${shiftData.date}`)
          } else if (shiftData) {
            shiftsToKeep.push(schedule.shift_ids[index])
          }
        })
      }

      console.log(`Removing ${shiftsToRemove.length} shifts, keeping ${shiftsToKeep.length} shifts`)

      // Update the day status for the removed days
      const newDayStatus = { ...dayStatus }
      const today = dayjs()

      matchingDates.forEach((dateStr) => {
        const date = dayjs(dateStr)
        const isPastDay = date.isBefore(today, "day")

        // For past days, mark as absent
        if (isPastDay) {
          newDayStatus[dateStr] = "absent"
        } else {
          // For future days, mark as unselected
          newDayStatus[dateStr] = "unselected"
        }
      })

      setDayStatus(newDayStatus)

      // **Optimistically update UI BEFORE waiting for the API response**
      setSchedule((prev) => ({
        ...prev,
        days: prev.days.filter((d) => d !== dayName),
        shift_ids: shiftsToKeep,
      }))

      // Reset the day-specific shift
      setDayShifts((prev) => ({
        ...prev,
        [dayName]: { type: "", start: "", end: "" },
      }))

      // If we have shifts to remove and a schedule ID, update the schedule
      if (shiftsToRemove.length > 0 && schedule.id && hasScheduleBeenSaved) {
        // Update the schedule to remove the day from the days array
        const updatedDays = schedule.days.filter((d) => d !== dayName)

        const response = await fetch(`${API_BASE_URL}/schedule/${schedule.id}/`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            remove_shift_ids: shiftsToRemove,
            days: updatedDays,
          }),
        })

        if (response.ok) {
          const updatedSchedule = await response.json()
          console.log("Successfully updated schedule after removing shifts:", updatedSchedule)

          // Update the schedule state with the server response
          setSchedule(updatedSchedule)
        } else {
          console.error("Failed to update schedule after removing shifts")
        }
      }

      // **Batch delete shifts in chunks (e.g., 10 at a time)**
      if (hasScheduleBeenSaved) {
        const chunkSize = 10
        for (let i = 0; i < shiftsToRemove.length; i += chunkSize) {
          const chunk = shiftsToRemove.slice(i, i + chunkSize)
          console.log(`Sending batch delete for ${chunk.length} shifts`)

          fetch(`${API_BASE_URL}/shifts/batch-delete/`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ shift_ids: chunk }),
          })
            .then((res) => {
              if (!res.ok) {
                throw new Error(`Batch deletion failed for ${chunk.length} shifts`)
              }
              console.log(`Successfully deleted ${chunk.length} shifts`)
            })
            .catch((err) => console.error(err))
        }
      }
    } catch (error) {
      console.error(`Error removing shifts for ${dayName}:`, error)
    }
  }

  // Add shifts for a specific day without affecting other days
  const addShiftsForDay = async (dayName) => {
    try {
      setIsSaving(true)
      setSaveSuccess(false)
      setSaveMessage("")

      // Check if we already have this day in the schedule
      if (schedule.days && schedule.days.includes(dayName)) {
        setSaveSuccess(false)
        setSaveMessage(`${dayName} is already in the schedule.`)
        setIsSaving(false)
        return
      }

      // Generate shifts for this day
      const newShiftIds = await generateShiftsForDay(dayName)

      if (newShiftIds.length === 0) {
        setSaveSuccess(false)
        setSaveMessage(`Failed to create shifts for ${dayName}.`)
        setIsSaving(false)
        return
      }

      // If we have a schedule ID and it has been saved, use the add-shifts endpoint
      if (schedule.id && hasScheduleBeenSaved) {
        const accessToken = localStorage.getItem("access_token")

        // Call the add-shifts endpoint
        const response = await fetch(`${API_BASE_URL}/schedule/${schedule.id}/add-shifts/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shift_ids: newShiftIds,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to add shifts: ${response.statusText}`)
        }

        const updatedSchedule = await response.json()
        console.log("Successfully added shifts:", updatedSchedule)

        // Update the schedule state
        setSchedule(updatedSchedule)

        // Update the selected days
        const daysMap = {
          Sunday: "S",
          Monday: "M",
          Tuesday: "T",
          Wednesday: "W",
          Thursday: "T2",
          Friday: "F",
          Saturday: "S2",
        }

        if (daysMap[dayName]) {
          setSelectedDays((prev) => ({
            ...prev,
            [daysMap[dayName]]: true,
          }))
        }

        setSaveSuccess(true)
        setSaveMessage(`Successfully added ${dayName} to the schedule.`)
      } else {
        // If no schedule exists or it hasn't been saved, just update the UI
        // We'll create the schedule when the user explicitly saves it
        console.log("Schedule not saved yet, just updating UI")

        // Update the selected days
        const daysMap = {
          Sunday: "S",
          Monday: "M",
          Tuesday: "T",
          Wednesday: "W",
          Thursday: "T2",
          Friday: "F",
          Saturday: "S2",
        }

        if (daysMap[dayName]) {
          setSelectedDays((prev) => ({
            ...prev,
            [daysMap[dayName]]: true,
          }))
        }

        // Update calendar colors for the selected day
        updateCalendarForSelectedDay(dayName, true)
      }
    } catch (error) {
      console.error(`Error adding shifts for ${dayName}:`, error)
      setSaveSuccess(false)
      setSaveMessage(`Error: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Delete the entire schedule
  const handleDeleteSchedule = async () => {
    if (isDeleting) return

    try {
      setIsDeleting(true)
      setSaveSuccess(false)
      setSaveMessage("")

      if (!schedule.id) {
        setSaveMessage("No schedule to delete")
        setSaveSuccess(false)
        setShowDeleteConfirm(false)
        return
      }

      const accessToken = localStorage.getItem("access_token")

      // Delete the schedule
      const response = await fetch(`${API_BASE_URL}/schedule/${schedule.id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete schedule: ${response.statusText}`)
      }

      // Reset all state
      setSchedule({
        id: null,
        user_id: employee?.user?.id || null,
        shift_ids: [],
        days: [],
        sickleave: null,
        regularholiday: [],
        specialholiday: [],
        nightdiff: [],
        oncall: [],
        vacationleave: [],
        payroll_period: "",
        hours: 8,
        bi_weekly_start: "",
        payroll_period_start: null,
        payroll_period_end: null,
      })

      setSelectedDays({
        S: false,
        M: false,
        T: false,
        W: false,
        T2: false,
        F: false,
        S2: false,
      })

      setSelectedShift("")
      setDayStatus({})
      setDayShifts({
        Sunday: { type: "", start: "", end: "" },
        Monday: { type: "", start: "", end: "" },
        Tuesday: { type: "", start: "", end: "" },
        Wednesday: { type: "", start: "", end: "" },
        Thursday: { type: "", start: "", end: "" },
        Friday: { type: "", start: "", end: "" },
        Saturday: { type: "", start: "", end: "" },
      })

      // Preserve holiday information
      const newDayStatus = {}
      holidays.forEach((holiday) => {
        const dateStr = holiday.date
        if (dayjs(dateStr).month() === currentDate.month() && dayjs(dateStr).year() === currentDate.year()) {
          newDayStatus[dateStr] = holiday.holiday_type === "regular" ? "regularholiday" : "specialholiday"
        }
      })
      setDayStatus(newDayStatus)

      setHasScheduleBeenSaved(false)
      setSaveSuccess(true)
      setSaveMessage("Schedule deleted successfully")
      setShowDeleteConfirm(false)
    } catch (error) {
      console.error("Error deleting schedule:", error)
      setSaveSuccess(false)
      setSaveMessage(`Error: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // Fetch employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      setLoading(true)
      try {
        const accessToken = localStorage.getItem("access_token")
        const response = await fetch(`${API_BASE_URL}/employment-info/${employeeId}/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch employee data")
        }

        const data = await response.json()
        console.log("Fetched employee data:", data)
        setEmployee(data)

        // Update schedule with the correct user_id
        setSchedule((prev) => ({
          ...prev,
          user_id: data.user?.id || null,
        }))
      } catch (error) {
        console.error("Error fetching employee:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (employeeId) {
      fetchEmployeeData()
    }
  }, [employeeId])

  // Fetch attendance data
  const fetchAttendanceData = async () => {
    try {
      if (!employee?.user?.id) {
        console.log("No user ID available, skipping attendance fetch")
        return
      }

      const accessToken = localStorage.getItem("access_token")
      const userId = employee.user.id

      // Get the first and last day of the current month
      const year = currentDate.year()
      const month = currentDate.month()
      const firstDay = dayjs(new Date(year, month, 1)).format("YYYY-MM-DD")
      const lastDay = dayjs(new Date(year, month + 1, 0)).format("YYYY-MM-DD")

      // First, clear any existing attendance data
      setAttendanceData({})

      // Fetch actual attendance data
      console.log(`Fetching attendance data for user ${userId} from ${firstDay} to ${lastDay}`)

      const response = await fetch(
        `${API_BASE_URL}/attendance/?user=${userId}&date_after=${firstDay}&date_before=${lastDay}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        console.log(`Received ${data.length} attendance records:`, data)

        // Filter to only include records for this specific user
        const filteredData = data.filter((record) => Number(record.user) === Number(userId))
        console.log(`Filtered to ${filteredData.length} records for user ${userId}:`, filteredData)

        // Convert to a map of date -> status
        const attendanceMap = {}
        filteredData.forEach((record) => {
          // Store status in lowercase for consistent comparison
          attendanceMap[record.date] = record.status.toLowerCase()
          console.log(`Setting attendance for ${record.date} to ${record.status.toLowerCase()} (User: ${record.user})`)
        })

        setAttendanceData(attendanceMap)
        console.log("Final processed attendance data:", attendanceMap)

        // Update day status based on attendance
        updateDayStatusWithAttendance(attendanceMap)
      } else {
        console.log("No attendance data found or error fetching data")
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error)
    }
  }

  // Helper function to update day status based on attendance
  const updateDayStatusWithAttendance = (attendanceData) => {
    setDayStatus((prevStatus) => {
      const newStatus = { ...prevStatus }

      // Update status for each day based on attendance
      Object.entries(attendanceData).forEach(([dateStr, status]) => {
        // Convert status to lowercase for consistent comparison
        const lowerStatus = status.toLowerCase()
        console.log(`Updating day status for ${dateStr} to ${lowerStatus}`)

        if (lowerStatus === "present") {
          newStatus[dateStr] = "attended"
        } else if (lowerStatus === "absent") {
          newStatus[dateStr] = "absent"
        } else if (lowerStatus === "late") {
          newStatus[dateStr] = "late"
        } else if (lowerStatus === "overtime") {
          newStatus[dateStr] = "overtime"
        } else if (lowerStatus === "undertime") {
          newStatus[dateStr] = "undertime"
        }
      })

      return newStatus
    })
  }

  // Fetch shifts data
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const accessToken = localStorage.getItem("access_token")
        const response = await fetch(`${API_BASE_URL}/shift/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setShifts(data)
        }
      } catch (error) {
        console.error("Error fetching shifts:", error)
      }
    }

    fetchShifts()
  }, [])

  // Fetch schedule data - CRITICAL FIX: Ensure we're fetching the correct employee's schedule
  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        console.log("Starting fetchScheduleData...")
        setLoading(true)

        // Reset schedule state first to avoid showing previous employee's data
        setSchedule({
          id: null,
          user_id: employee?.user?.id || null,
          shift_ids: [],
          days: [],
          sickleave: null,
          regularholiday: [],
          specialholiday: [],
          nightdiff: [],
          oncall: [],
          vacationleave: [],
          payroll_period: "",
          hours: 8,
          bi_weekly_start: "",
          payroll_period_start: null,
          payroll_period_end: null,
        })

        // Reset selected days to none selected
        setSelectedDays({
          S: false,
          M: false,
          T: false,
          W: false,
          T2: false,
          F: false,
          S2: false,
        })

        // Reset selected shift
        setSelectedShift("")

        // Reset day status to clear any events from previous employees
        setDayStatus({})

        // Reset day-specific shifts
        setDayShifts({
          Sunday: { type: "", start: "", end: "" },
          Monday: { type: "", start: "", end: "" },
          Tuesday: { type: "", start: "", end: "" },
          Wednesday: { type: "", start: "", end: "" },
          Thursday: { type: "", start: "", end: "" },
          Friday: { type: "", start: "", end: "" },
          Saturday: { type: "", start: "", end: "" },
        })

        const accessToken = localStorage.getItem("access_token")
        if (!accessToken) {
          console.error("No access token found")
          setLoading(false)
          return
        }

        // Use the user ID from the employee data if available
        const userId = employee?.user?.id
        if (!userId) {
          console.warn("No user ID found in employee data, using employeeId as fallback")
          setLoading(false)
          return
        }

        console.log(`Fetching schedule for user ID: ${userId}`)

        // CRITICAL FIX: Use the exact user_id parameter to ensure we get only this employee's schedule
        // Use axios instead of fetch for better error handling
        try {
          const response = await axios.get(`${API_BASE_URL}/schedule/?user_id=${userId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          })

          console.log(`Fetched schedule data:`, response.data)

          if (response.data && response.data.length > 0) {
            // CRITICAL FIX: Filter to ensure we only get schedules for this specific user
            // and sort by ID to get the most recent schedule first
            const userSchedules = response.data
              .filter((schedule) => schedule.user_id === userId)
              .sort((a, b) => b.id - a.id) // Sort by ID in descending order

            if (userSchedules.length > 0) {
              // Always use the most recent schedule (highest ID)
              const scheduleData = userSchedules[0]
              console.log("Found most recent schedule for this user:", scheduleData)

              // Set the schedule
              setSchedule(scheduleData)
              setHasScheduleBeenSaved(true)

              // Set payroll period dates
              if (scheduleData.payroll_period_start) {
                setPayrollPeriodStart(scheduleData.payroll_period_start)

                // If we have payroll periods loaded, select the matching one
                if (payrollPeriods.length > 0) {
                  const matchingPeriod = payrollPeriods.find(
                    (period) => period.payroll_period_start === scheduleData.payroll_period_start,
                  )
                  if (matchingPeriod) {
                    setSelectedPayrollPeriodId(matchingPeriod.id)
                  }
                }
              }
              if (scheduleData.payroll_period_end) {
                setPayrollPeriodEnd(scheduleData.payroll_period_end)
              }

              // Set selected days based on schedule
              const daysMap = {
                Monday: "M",
                Tuesday: "T",
                Wednesday: "W",
                Thursday: "T2",
                Friday: "F",
                Saturday: "S2",
                Sunday: "S",
              }

              const newSelectedDays = {
                S: false,
                M: false,
                T: false,
                W: false,
                T2: false,
                F: false,
                S2: false,
              }

              if (scheduleData.days && Array.isArray(scheduleData.days)) {
                scheduleData.days.forEach((day) => {
                  if (daysMap[day]) {
                    newSelectedDays[daysMap[day]] = true
                  }
                })

                console.log("Setting selected days based on schedule:", newSelectedDays)
                setSelectedDays(newSelectedDays)
              } else {
                console.warn("Schedule days is not an array or is undefined:", scheduleData.days)
              }

              // Determine shift type based on shift_ids
              if (scheduleData.shift_ids && scheduleData.shift_ids.length > 0) {
                // Fetch all shifts to determine day-specific shifts
                try {
                  const shiftPromises = scheduleData.shift_ids.map((shiftId) =>
                    fetch(`${API_BASE_URL}/shift/${shiftId}/`, {
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                      },
                    }).then((res) => (res.ok ? res.json() : null)),
                  )

                  const shiftsData = await Promise.all(shiftPromises)
                  const validShifts = shiftsData.filter((shift) => shift !== null)

                  // Group shifts by day of week
                  const shiftsByDay = {}
                  validShifts.forEach((shift) => {
                    const date = dayjs(shift.date)
                    const dayOfWeek = date.format("dddd")

                    if (!shiftsByDay[dayOfWeek]) {
                      shiftsByDay[dayOfWeek] = []
                    }

                    shiftsByDay[dayOfWeek].push(shift)
                  })

                  // Determine shift type for each day
                  const newDayShifts = { ...dayShifts }
                  let startTime, endTime

                  Object.entries(shiftsByDay).forEach(([day, dayShifts]) => {
                    if (dayShifts.length > 0) {
                      // Use the first shift for this day to determine type
                      const shift = dayShifts[0]
                      startTime = shift.shift_start
                      endTime = shift.shift_end

                      let shiftType = ""
                      if (startTime === "10:00:00" && endTime === "19:00:00") {
                        shiftType = "morning"
                      } else if (startTime === "12:00:00" && endTime === "21:00:00") {
                        shiftType = "midday"
                      } else if (startTime === "19:00:00" && endTime === "23:00:00") {
                        shiftType = "night"
                      } else {
                        shiftType = "custom"
                      }
                      newDayShifts[day] = {
                        type: shiftType,
                        start: startTime,
                        end: endTime,
                      }
                    }
                  })

                  setDayShifts(newDayShifts)

                  // Set the global shift type based on the most common shift
                  const shiftCounts = { morning: 0, midday: 0, night: 0, custom: 0 }
                  Object.values(newDayShifts).forEach(({ type }) => {
                    if (type) {
                      shiftCounts[type]++
                    }
                  })

                  // Find the most common shift type
                  let mostCommonShift = ""
                  let maxCount = 0
                  Object.entries(shiftCounts).forEach(([type, count]) => {
                    if (count > maxCount) {
                      mostCommonShift = type
                      maxCount = count
                    }
                  })

                  if (mostCommonShift) {
                    setSelectedShift(mostCommonShift)

                    // If custom is the most common, set the custom times
                    if (mostCommonShift === "custom") {
                      // Find a day with custom shift
                      const customShiftDay = Object.entries(newDayShifts).find(([_, data]) => data.type === "custom")
                      if (customShiftDay) {
                        const [_, data] = customShiftDay
                        setCustomShiftStart(convertTimeFormatToTimeString(data.start))
                        setCustomShiftEnd(convertTimeFormatToTimeString(data.end))
                      }
                    }
                  }
                } catch (error) {
                  console.error("Error fetching shift details:", error)
                }
              }
            } else {
              console.log(`No schedule found for employee ${employeeId} with user ID ${userId}`)
            }
          } else {
            console.log(`No schedules found at all`)
          }
        } catch (error) {
          console.error("Error fetching schedule:", error)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching schedule:", error)
        setLoading(false)
      }
    }

    if (employeeId && employee) {
      fetchScheduleData()
    }
  }, [employeeId, employee])

  // Function to reset all selections after saving
  const resetSelections = () => {
    setSelectedDays({
      S: false,
      M: false,
      T: false,
      W: false,
      T2: false,
      F: false,
      S2: false,
    })
    setSelectedShift("")
    setDayShifts({
      Sunday: { type: "", start: "", end: "" },
      Monday: { type: "", start: "", end: "" },
      Tuesday: { type: "", start: "", end: "" },
      Wednesday: { type: "", start: "", end: "" },
      Thursday: { type: "", start: "", end: "" },
      Friday: { type: "", start: "", end: "" },
      Saturday: { type: "", start: "", end: "" },
    })
  }

  // This useEffect ensures the calendar is updated whenever the schedule data changes
  useEffect(() => {
    if (schedule && schedule.id && schedule.days && schedule.days.length > 0) {
      console.log("Schedule data changed, updating calendar with days:", schedule.days)

      // Run debug logging automatically
      debugSchedule()

      // Small delay to ensure all state is updated
      setTimeout(() => {
        updateCalendarWithSchedule(schedule, schedule.days)
      }, 100)
    }
  }, [schedule, JSON.stringify(schedule.days)])

  // Generate calendar days for the current month
  useEffect(() => {
    const year = currentDate.year()
    const month = currentDate.month()

    const firstDayOfMonth = dayjs(new Date(year, month, 1))
    const daysInMonth = currentDate.daysInMonth()

    const dayObjects = []

    // Add days from previous month to fill the first week
    const firstDayWeekday = firstDayOfMonth.day()
    for (let i = 0; i < firstDayWeekday; i++) {
      const prevMonthDay = firstDayOfMonth.subtract(firstDayWeekday - i, "day")
      dayObjects.push({
        date: prevMonthDay,
        dayOfMonth: prevMonthDay.date(),
        isCurrentMonth: false,
      })
    }

    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = dayjs(new Date(year, month, i))
      dayObjects.push({
        date,
        dayOfMonth: i,
        isCurrentMonth: true,
      })
    }

    // Add days from next month to complete the last week
    const lastDayOfMonth = dayjs(new Date(year, month, daysInMonth))
    const lastDayWeekday = lastDayOfMonth.day()

    if (lastDayWeekday < 6) {
      for (let i = 1; i <= 6 - lastDayWeekday; i++) {
        const nextMonthDay = lastDayOfMonth.add(i, "day")
        dayObjects.push({
          date: nextMonthDay,
          dayOfMonth: nextMonthDay.date(),
          isCurrentMonth: false,
        })
      }
    }

    setCalendarDays(dayObjects)

    // Initialize day status
    const newDayStatus = {}
    const today = dayjs()

    // First, apply holiday information
    holidays.forEach((holiday) => {
      const dateStr = holiday.date
      if (dayjs(dateStr).month() === currentDate.month() && dayjs(dateStr).year() === currentDate.year()) {
        newDayStatus[dateStr] = holiday.holiday_type === "regular" ? "regularholiday" : "specialholiday"
      }
    })

    dayObjects.forEach((day) => {
      if (day.isCurrentMonth) {
        const dateStr = day.date.format("YYYY-MM-DD")
        const dayOfWeek = day.date.format("dddd")
        const isPastDay = day.date.isBefore(today, "day")
        const isInPayrollPeriod = isDateInPayrollPeriod(dateStr)

        // Skip if already marked as a holiday
        if (newDayStatus[dateStr] === "regularholiday" || newDayStatus[dateStr] === "specialholiday") {
          return
        }

        // Priority order for status:
        // 1. Special events (sickleave, holidays, etc.)
        // 2. Attendance data for past days (attended/absent)
        // 3. Selected days from schedule for future days
        // 4. Default status

        // Check if the day is in any of the special categories
        if (schedule.sickleave === dateStr) {
          newDayStatus[dateStr] = "sickleave"
        } else if (schedule.regularholiday?.includes(dateStr)) {
          newDayStatus[dateStr] = "regularholiday"
        } else if (schedule.specialholiday?.includes(dateStr)) {
          newDayStatus[dateStr] = "specialholiday"
        } else if (schedule.nightdiff?.includes(dateStr)) {
          newDayStatus[dateStr] = "nightdiff"
        } else if (schedule.oncall?.includes(dateStr)) {
          newDayStatus[dateStr] = "oncall"
        } else if (schedule.vacationleave?.includes(dateStr)) {
          newDayStatus[dateStr] = "vacationleave"
        } else if (isPastDay && attendanceData[dateStr]) {
          // For past days, show actual attendance if available
          const lowerStatus = attendanceData[dateStr].toLowerCase()
          if (lowerStatus === "present") {
            newDayStatus[dateStr] = "attended"
          } else if (lowerStatus === "absent") {
            newDayStatus[dateStr] = "absent"
          } else if (lowerStatus === "late") {
            newDayStatus[dateStr] = "late"
          }
        } else if (schedule.days?.includes(dayOfWeek) && isInPayrollPeriod) {
          // If it's a scheduled day and in the payroll period
          if (isPastDay && !attendanceData[dateStr]) {
            // Past scheduled days without attendance records should be marked as absent
            newDayStatus[dateStr] = "absent"
          } else {
            // Future scheduled days
            newDayStatus[dateStr] = "selected"
          }
        } else if (isPastDay) {
          // Any past day without attendance or schedule should be marked as absent
          newDayStatus[dateStr] = "absent"
        } else {
          // Default status for future days
          newDayStatus[dateStr] = isInPayrollPeriod ? "unselected" : "outside-period"
        }
      }
    })

    // This will ensure the calendar shows scheduled days when it first loads
    if (schedule && schedule.days && schedule.days.length > 0) {
      const scheduledDates = []
      for (let i = 1; i <= daysInMonth; i++) {
        const date = dayjs(new Date(year, month, i))
        const dayOfWeek = date.format("dddd")
        const dateStr = date.format("YYYY-MM-DD")
        const isInPayrollPeriod = isDateInPayrollPeriod(dateStr)

        if (schedule.days.includes(dayOfWeek) && isInPayrollPeriod) {
          scheduledDates.push(dateStr)

          // Mark this date as scheduled if it's not already marked as something else
          if (!newDayStatus[dateStr] || newDayStatus[dateStr] === "unselected") {
            const isPastDay = date.isBefore(today, "day")
            if (isPastDay && attendanceData[dateStr]) {
              // Keep attendance data for past days
            } else {
              newDayStatus[dateStr] = "selected"
            }
          }
        }
      }
      console.log(`Initialized ${scheduledDates.length} scheduled dates for ${currentDate.format("MMMM")}`)
    }

    // CRITICAL FIX: Process holidays from the schedule
    if (schedule && (schedule.regularholiday?.length > 0 || schedule.specialholiday?.length > 0)) {
      console.log("Processing holidays from schedule:", {
        regularHolidays: schedule.regularholiday,
        specialHolidays: schedule.specialholiday,
      })

      // Process regular holidays
      if (schedule.regularholiday && Array.isArray(schedule.regularholiday)) {
        schedule.regularholiday.forEach((dateStr) => {
          // Only update if it's in the current month
          const holidayDate = dayjs(dateStr)
          if (holidayDate.month() === month && holidayDate.year() === year) {
            console.log(`Marking regular holiday: ${dateStr}`)
            newDayStatus[dateStr] = "regularholiday"
          }
        })
      }

      // Process special holidays
      if (schedule.specialholiday && Array.isArray(schedule.specialholiday)) {
        schedule.specialholiday.forEach((dateStr) => {
          // Only update if it's in the current month
          const holidayDate = dayjs(dateStr)
          if (holidayDate.month() === month && holidayDate.year() === year) {
            console.log(`Marking special holiday: ${dateStr}`)
            newDayStatus[dateStr] = "specialholiday"
          }
        })
      }
    }

    setDayStatus(newDayStatus)
    console.log("Calendar days generated:", calendarDays.length)
    console.log("Day status after generation:", newDayStatus)
    console.log("Schedule days being used:", schedule.days)
  }, [currentDate, schedule, employeeId, attendanceData, payrollPeriodStart, payrollPeriodEnd, holidays])

  // Handle day click in calendar
  const handleDayClick = (day) => {
    if (day.isCurrentMonth) {
      setSelectedDate(day.date)
    }
  }

  // Handle day selection in schedule panel
  const handleDaySelection = async (day) => {
    // Prevent multiple operations at once
    if (isProcessingShifts) return

    setIsProcessingShifts(true)

    try {
      // Get the day name from the key
      const daysMap = {
        S: "Sunday",
        M: "Monday",
        T: "Tuesday",
        W: "Wednesday",
        T2: "Thursday",
        F: "Friday",
        S2: "Saturday",
      }
      const dayName = daysMap[day]

      // Check if the day is currently selected
      const isCurrentlySelected = selectedDays[day]

      // Update the UI state first for immediate feedback
      setSelectedDays((prev) => ({
        ...prev,
        [day]: !prev[day],
      }))

      // If the day is being deselected
      if (isCurrentlySelected) {
        console.log(`Deselecting day: ${dayName}`)

        // Just update the local UI without modifying the schedule
        updateCalendarForSelectedDay(dayName, false)
      } else {
        // If the day is being selected
        console.log(`Selecting day: ${dayName}`)

        // Set the day-specific shift type if not already set
        if (!dayShifts[dayName].type) {
          // Use the currently selected shift type
          const shiftType = selectedShift || "morning"
          let shiftStart, shiftEnd

          switch (shiftType) {
            case "morning":
              shiftStart = "10:00:00"
              shiftEnd = "19:00:00"
              break
            case "midday":
              shiftStart = "12:00:00"
              shiftEnd = "21:00:00"
              break
            case "night":
              shiftStart = "14:00:00"
              shiftEnd = "23:00:00"
              break
            case "custom":
              shiftStart = convertTimeStringToTimeFormat(customShiftStart)
              shiftEnd = convertTimeStringToTimeFormat(customShiftEnd)
              break
            default:
              shiftStart = "10:00:00"
              shiftEnd = "19:00:00"
          }

          setDayShifts((prev) => ({
            ...prev,
            [dayName]: {
              type: shiftType,
              start: shiftStart,
              end: shiftEnd,
            },
          }))
        }

        // Just update the local UI without creating a schedule
        updateCalendarForSelectedDay(dayName, true)
      }
    } catch (error) {
      console.error("Error handling day selection:", error)
    } finally {
      setIsProcessingShifts(false)
    }
  }

  // Helper function to update calendar for a selected day without creating a schedule
  const updateCalendarForSelectedDay = (dayName, isSelected) => {
    const newDayStatus = { ...dayStatus }
    const today = dayjs()

    calendarDays.forEach((day) => {
      if (day.isCurrentMonth) {
        const dateStr = day.date.format("YYYY-MM-DD")
        const dayOfWeek = day.date.format("dddd")
        const isInPayrollPeriod = isDateInPayrollPeriod(dateStr)

        // Skip if it's a holiday
        if (newDayStatus[dateStr] === "regularholiday" || newDayStatus[dateStr] === "specialholiday") {
          return
        }

        if (dayOfWeek === dayName && isInPayrollPeriod) {
          const isPastDay = day.date.isBefore(today, "day")
          const hasAttendanceRecord = attendanceData[dateStr] === "present" || attendanceData[dateStr] === "absent"

          if (isSelected) {
            if (isPastDay && hasAttendanceRecord) {
              // Keep attendance status
            } else {
              newDayStatus[dateStr] = "selected"
            }
          } else {
            if (isPastDay && hasAttendanceRecord) {
              // Keep attendance status
            } else if (isPastDay) {
              newDayStatus[dateStr] = "absent"
            } else {
              newDayStatus[dateStr] = "unselected"
            }
          }
        }
      }
    })

    setDayStatus(newDayStatus)
  }

  // Handle shift selection for a specific day
  const handleDayShiftSelection = (dayName, shiftType) => {
    // If the same shift is selected, unselect it
    if (dayShifts[dayName].type === shiftType) {
      setDayShifts((prev) => ({
        ...prev,
        [dayName]: { type: "", start: "", end: "" },
      }))
    } else {
      // Set the shift type and times for this day
      let shiftStart, shiftEnd
      switch (shiftType) {
        case "morning":
          shiftStart = "10:00:00"
          shiftEnd = "19:00:00"
          break
        case "midday":
          shiftStart = "12:00:00"
          shiftEnd = "21:00:00"
          break
        case "night":
          shiftStart = "19:00:00"
          shiftEnd = "23:00:00"
          break
        case "custom":
          shiftStart = convertTimeStringToTimeFormat(customShiftStart)
          shiftEnd = convertTimeStringToTimeFormat(customShiftEnd)
          break
        default:
          shiftStart = ""
          shiftEnd = ""
      }

      setDayShifts((prev) => ({
        ...prev,
        [dayName]: { type: shiftType, start: shiftStart, end: shiftEnd },
      }))
    }
  }

  // Handle shift selection
  const handleShiftSelection = async (shift) => {
    // If the same shift is selected, unselect it
    if (selectedShift === shift) {
      setSelectedShift("")
      return
    }

    // Prevent multiple operations at once
    if (isProcessingShifts) return

    setIsProcessingShifts(true)

    try {
      setSelectedShift(shift)
      console.log(`Selected shift type: ${shift}`)

      // We'll just set the shift type but not regenerate shifts
      // This will be used for any new days that are selected
      console.log(`Set shift type to ${shift} for future use`)
    } catch (error) {
      console.error("Error handling shift selection:", error)
    } finally {
      setIsProcessingShifts(false)
    }
  }

  // Handle event selection for the selected date
  const handleEventSelection = (eventType) => {
    if (!selectedDate) return

    const dateStr = selectedDate.format("YYYY-MM-DD")
    const newSchedule = { ...schedule }
    const currentStatus = dayStatus[dateStr]

    // If the same event type is clicked again, remove it (toggle off)
    if (currentStatus === eventType) {
      // Remove the date from the event array
      if (eventType === "sickleave") {
        newSchedule.sickleave = null
      } else if (["regularholiday", "specialholiday", "nightdiff", "oncall", "vacationleave"].includes(eventType)) {
        if (Array.isArray(newSchedule[eventType])) {
          newSchedule[eventType] = newSchedule[eventType].filter((d) => d !== dateStr)
        }
      }

      // Reset to default status based on whether it's a working day
      const dayOfWeek = selectedDate.format("dddd")
      const isWorkingDay = newSchedule.days?.includes(dayOfWeek)
      const isPastDay = selectedDate.isBefore(dayjs(), "day")
      const isInPayrollPeriod = isDateInPayrollPeriod(dateStr)

      if (isWorkingDay && isInPayrollPeriod) {
        if (isPastDay && !attendanceData[dateStr]) {
          // Past working day with no attendance
          setDayStatus((prev) => ({
            ...prev,
            [dateStr]: "absent",
          }))
        } else if (isPastDay && attendanceData[dateStr] === "present") {
          // Past working day with attendance
          setDayStatus((prev) => ({
            ...prev,
            [dateStr]: "attended",
          }))
        } else {
          // Future working day
          setDayStatus((prev) => ({
            ...prev,
            [dateStr]: "selected",
          }))
        }
      } else if (!isInPayrollPeriod) {
        setDayStatus((prev) => ({
          ...prev,
          [dateStr]: "outside-period",
        }))
      } else {
        setDayStatus((prev) => ({
          ...prev,
          [dateStr]: "unselected",
        }))
      }
    } else {
      // Remove the date from all event arrays first
      if (newSchedule.sickleave === dateStr) {
        newSchedule.sickleave = null
      }
      // Clear from all event arrays
      ;["regularholiday", "specialholiday", "nightdiff", "oncall", "vacationleave"].forEach((field) => {
        if (Array.isArray(newSchedule[field])) {
          newSchedule[field] = newSchedule[field].filter((d) => d !== dateStr)
        } else {
          newSchedule[field] = []
        }
      })

      // Add the date to the selected event type
      if (eventType === "sickleave") {
        newSchedule.sickleave = dateStr
      } else if (eventType === "absent") {
        // For "absent", we just remove the date from all arrays
        // and make sure it's not in the working days
        const dayOfWeek = selectedDate.format("dddd")
        if (newSchedule.days && newSchedule.days.includes(dayOfWeek)) {
          // This is a simplification - in a real app, you'd need to handle this differently
          // as you can't modify the days array for just one date
          console.log(`Note: ${dateStr} is marked as absent but is part of the regular working days (${dayOfWeek})`)
        }
      } else if (["regularholiday", "specialholiday", "nightdiff", "oncall", "vacationleave"].includes(eventType)) {
        if (!Array.isArray(newSchedule[eventType])) {
          newSchedule[eventType] = []
        }
        newSchedule[eventType].push(dateStr)
      }

      // Update day status
      setDayStatus((prev) => ({
        ...prev,
        [dateStr]: eventType,
      }))
    }

    console.log(`Updated ${eventType} for ${dateStr}:`, newSchedule)
    setSchedule(newSchedule)
  }

  // New function to save only events without modifying the schedule
  const handleSaveEvents = async () => {
    if (isSaving) return
    setIsSaving(true)
    setSaveSuccess(false)
    setSaveMessage("")

    try {
      const accessToken = localStorage.getItem("access_token")
      if (!accessToken) {
        throw new Error("No access token found")
      }

      // Check if we have a schedule ID
      if (!schedule.id) {
        // If no schedule exists, we need to create one first
        await handleSaveSchedule()
        return
      }

      // Collect all events from dayStatus
      const events = {
        sickleave: schedule.sickleave,
        regularholiday: schedule.regularholiday || [],
        specialholiday: schedule.specialholiday || [],
        nightdiff: schedule.nightdiff || [],
        oncall: schedule.oncall || [],
        vacationleave: schedule.vacationleave || [],
      }

      // Update only the event fields in the schedule
      const response = await fetch(`${API_BASE_URL}/schedule/${schedule.id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(events),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Server response:", errorText)
        throw new Error(`Failed to save events: ${response.statusText}`)
      }

      const updatedSchedule = await response.json()
      setSchedule(updatedSchedule)
      setSaveSuccess(true)
      setSaveMessage("Events saved successfully!")

      // Reset selections after successful save
      resetSelections()
    } catch (error) {
      console.error("Error saving events:", error)
      setSaveSuccess(false)
      setSaveMessage(`Error: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSchedule = async () => {
    try {
      setIsSaving(true)
      setSaveSuccess(false)
      setSaveMessage("")

      // Convert selected days to array of day names
      const daysMap = {
        S: "Sunday",
        M: "Monday",
        T: "Tuesday",
        W: "Wednesday",
        T2: "Thursday",
        F: "Friday",
        S2: "Saturday",
      }

      const selectedDaysArray = Object.entries(selectedDays)
        .filter(([_, isSelected]) => isSelected)
        .map(([day, _]) => daysMap[day])

      console.log("Selected days for schedule:", selectedDaysArray)

      // Check if we have any selected days
      if (selectedDaysArray.length === 0) {
        setSaveSuccess(false)
        setSaveMessage("Please select at least one day for the schedule.")
        setIsSaving(false)
        return
      }

      // Check if we have payroll period dates
      if (!payrollPeriodStart || !payrollPeriodEnd) {
        setSaveSuccess(false)
        setSaveMessage("Please select a payroll period.")
        setIsSaving(false)
        return
      }

      // Get the correct user ID from the employee data
      const userId = employee?.user?.id || Number.parseInt(employeeId)
      const accessToken = localStorage.getItem("access_token")

      // For each selected day, create shifts with the correct shift type
      console.log("Creating shifts for selected days...")
      setIsProcessingShifts(true)

      const newShiftIds = []
      try {
        // Process each selected day to create shifts
        for (const dayName of selectedDaysArray) {
          // Only create shifts for days that aren't already in the schedule
          if (!schedule.days || !schedule.days.includes(dayName)) {
            const shiftIds = await generateShiftsForDay(dayName)
            newShiftIds.push(...shiftIds)
          }
        }
      } catch (error) {
        console.error("Error creating shifts:", error)
      } finally {
        setIsProcessingShifts(false)
      }

      console.log(`Created ${newShiftIds.length} new shifts`)

      // If we have a schedule ID, use PATCH with add_shift_ids
      if (schedule.id) {
        console.log(`Updating existing schedule ${schedule.id} with add_shift_ids:`, newShiftIds)

        // Preserve existing days when updating
        const existingDays = schedule.days || []

        // Add any new selected days that aren't already in the schedule
        const updatedDays = [...existingDays]
        selectedDaysArray.forEach((day) => {
          if (!updatedDays.includes(day)) {
            updatedDays.push(day)
          }
        })

        console.log(`Updating schedule with days: ${updatedDays.join(", ")}`)

        // Prepare the update data with add_shift_ids
        const updateData = {
          add_shift_ids: newShiftIds,
          days: updatedDays,
          payroll_period_start: payrollPeriodStart,
          payroll_period_end: payrollPeriodEnd,
          bi_weekly_start: payrollPeriodStart,
          sickleave: schedule.sickleave,
          regularholiday: schedule.regularholiday || [],
          specialholiday: schedule.specialholiday || [],
          nightdiff: schedule.nightdiff || [],
          oncall: schedule.oncall || [],
          vacationleave: schedule.vacationleave || [],
          hours: 8,
          user_id: userId,
        }

        // Log the data being sent to the server
        console.log("Sending update data to server:", JSON.stringify(updateData, null, 2))

        // Update the schedule using PATCH to add new shifts
        const response = await fetch(`${API_BASE_URL}/schedule/${schedule.id}/`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Server response:", errorText)
          throw new Error(`Failed to update schedule: ${response.statusText}`)
        }

        const updatedSchedule = await response.json()
        console.log("Schedule updated successfully:", updatedSchedule)
        setSchedule(updatedSchedule)
        setHasScheduleBeenSaved(true)

        // Update the calendar with the new schedule
        updateCalendarWithSchedule(updatedSchedule, updatedSchedule.days)

        setSaveSuccess(true)
        setSaveMessage("Schedule updated successfully!")

        // Only reset selections after successful save
        resetSelections()
      } else {
        // If no schedule exists, create a new one
        console.log("Creating new schedule with shifts:", newShiftIds)

        // Prepare the new schedule data
        const scheduleData = {
          user_id: userId,
          shift_ids: newShiftIds,
          days: selectedDaysArray,
          payroll_period_start: payrollPeriodStart,
          payroll_period_end: payrollPeriodEnd,
          bi_weekly_start: payrollPeriodStart,
          sickleave: schedule.sickleave,
          regularholiday: schedule.regularholiday || [],
          specialholiday: schedule.specialholiday || [],
          nightdiff: schedule.nightdiff || [],
          oncall: schedule.oncall || [],
          vacationleave: schedule.vacationleave || [],
          hours: 8,
        }

        // Log the data being sent to the server
        console.log("Creating new schedule with data:", JSON.stringify(scheduleData, null, 2))

        // Create a new schedule
        const response = await fetch(`${API_BASE_URL}/schedule/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(scheduleData),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Server response:", errorText)
          throw new Error(`Failed to create schedule: ${response.statusText}`)
        }

        const newSchedule = await response.json()
        console.log("Schedule created successfully:", newSchedule)
        setSchedule(newSchedule)
        setHasScheduleBeenSaved(true)

        // Update the calendar with the new schedule
        updateCalendarWithSchedule(newSchedule, newSchedule.days)

        setSaveSuccess(true)
        setSaveMessage("Schedule created successfully!")

        // Only reset selections after successful save
        resetSelections()
      }

      // Force a re-render of the calendar
      setCurrentDate((prev) => dayjs(prev))
    } catch (error) {
      console.error("Error saving schedule:", error)
      setSaveSuccess(false)
      setSaveMessage(`Error: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const updateCalendarWithSchedule = (savedSchedule, scheduledDays) => {
    if (!scheduledDays || !Array.isArray(scheduledDays) || scheduledDays.length === 0) {
      console.warn("No scheduled days provided to updateCalendarWithSchedule")
      return
    }

    const today = dayjs()
    const year = currentDate.year()
    const month = currentDate.month() + 1 // Month is 0-indexed, so add 1 for formatting
    const daysInMonth = currentDate.daysInMonth()

    console.log("Current month/year being displayed:", currentDate.format("MMMM YYYY"))
    console.log("Scheduled days from saved schedule:", scheduledDays)

    // Find all dates in the current month that match the scheduled days
    const scheduledDates = []
    for (let i = 1; i <= daysInMonth; i++) {
      // Create date with the correct month (month-1 because Date constructor uses 0-indexed months)
      const date = dayjs(new Date(year, currentDate.month(), i))
      const dayOfWeek = date.format("dddd")
      const dateStr = date.format("YYYY-MM-DD")
      const isInPayrollPeriod = isDateInPayrollPeriod(dateStr)

      if (scheduledDays.includes(dayOfWeek) && isInPayrollPeriod) {
        scheduledDates.push(dateStr)
        console.log(`Found scheduled date: ${dateStr} (${dayOfWeek})`)
      }
    }

    console.log(
      `Found ${scheduledDates.length} dates in ${currentDate.format("MMMM")} that match scheduled days:`,
      scheduledDates,
    )

    if (scheduledDates.length === 0) {
      console.warn("No scheduled dates found for the current month. Check if the days array is correct:", scheduledDays)
      return
    }

    // Update the day status for all scheduled dates
    setDayStatus((prevStatus) => {
      const newStatus = { ...prevStatus }

      // First, reset all days that might have been previously scheduled but aren't anymore
      Object.keys(newStatus).forEach((dateStr) => {
        // Only process dates from the current month
        const dateMonth = dateStr.split("-")[1] // Get month part (MM) from YYYY-MM-DD
        if (dateMonth === String(month).padStart(2, "0")) {
          if (newStatus[dateStr] === "selected" && !scheduledDates.includes(dateStr)) {
            const isInPayrollPeriod = isDateInPayrollPeriod(dateStr)
            newStatus[dateStr] = isInPayrollPeriod ? "unselected" : "outside-period"
          }
        }
      })

      // Then mark all scheduled dates
      scheduledDates.forEach((dateStr) => {
        const date = dayjs(dateStr)
        const isPastDay = date.isBefore(today, "day")

        // Check if this date has any special event status
        const hasSpecialStatus =
          savedSchedule.sickleave === dateStr ||
          (savedSchedule.regularholiday && savedSchedule.regularholiday.includes(dateStr)) ||
          (savedSchedule.specialholiday && savedSchedule.specialholiday.includes(dateStr)) ||
          (savedSchedule.nightdiff && savedSchedule.nightdiff.includes(dateStr)) ||
          (savedSchedule.oncall && savedSchedule.oncall.includes(dateStr)) ||
          (savedSchedule.vacationleave && savedSchedule.vacationleave.includes(dateStr))

        // Only update if it doesn't have a special status
        if (!hasSpecialStatus) {
          if (isPastDay && attendanceData[dateStr]) {
            // For past days with attendance data, keep the attendance status
            newStatus[dateStr] = attendanceData[dateStr] === "present" ? "attended" : "absent"
          } else {
            // For future days or days without attendance, mark as scheduled
            newStatus[dateStr] = "selected"
            console.log(`Marking ${dateStr} as 'selected' in calendar`)
          }
        }
      })

      // CRITICAL FIX: Process holidays from the schedule
      if (savedSchedule.regularholiday && Array.isArray(savedSchedule.regularholiday)) {
        savedSchedule.regularholiday.forEach((dateStr) => {
          // Only update if it's in the current month
          const holidayDate = dayjs(dateStr)
          if (holidayDate.month() === currentDate.month() && holidayDate.year() === currentDate.year()) {
            console.log(`Marking regular holiday: ${dateStr}`)
            newStatus[dateStr] = "regularholiday"
          }
        })
      }

      if (savedSchedule.specialholiday && Array.isArray(savedSchedule.specialholiday)) {
        savedSchedule.specialholiday.forEach((dateStr) => {
          // Only update if it's in the current month
          const holidayDate = dayjs(dateStr)
          if (holidayDate.month() === currentDate.month() && holidayDate.year() === currentDate.year()) {
            console.log(`Marking special holiday: ${dateStr}`)
            newStatus[dateStr] = "specialholiday"
          }
        })
      }

      // Mark days outside the payroll period
      Object.keys(newStatus).forEach((dateStr) => {
        if (!isDateInPayrollPeriod(dateStr) && newStatus[dateStr] !== "outside-period") {
          newStatus[dateStr] = "outside-period"
        }
      })

      console.log("Updated day status:", newStatus)
      return newStatus
    })
  }

  // Add this function after the updateCalendarWithSchedule function
  const debugSchedule = () => {
    const year = currentDate.year()
    const month = currentDate.month()
    const daysInMonth = currentDate.daysInMonth()

    console.log("Current schedule:", schedule)
    console.log("Selected days:", selectedDays)

    // Find all dates in the current month that should be scheduled
    const scheduledDates = []
    for (let i = 1; i <= daysInMonth; i++) {
      const date = dayjs(new Date(year, month, i))
      const dayOfWeek = date.format("dddd")
      const dateStr = date.format("YYYY-MM-DD")
      const isInPayrollPeriod = isDateInPayrollPeriod(dateStr)

      if (schedule.days && schedule.days.includes(dayOfWeek) && isInPayrollPeriod) {
        scheduledDates.push({
          date: dateStr,
          dayOfWeek,
          status: dayStatus[dateStr] || "unknown",
        })
      }
    }

    console.log(
      `Debug: Found ${scheduledDates.length} dates in ${currentDate.format("MMMM YYYY")} that should be scheduled:`,
      scheduledDates,
    )

    // Check if these dates are actually marked as scheduled in dayStatus
    const correctlyMarked = scheduledDates.filter((d) => dayStatus[d.date] === "selected").length
    console.log(`Debug: ${correctlyMarked} out of ${scheduledDates.length} dates are correctly marked as scheduled`)
  }

  // Add this after the other handler functions
  const handleMonthChange = (direction) => {
    const newDate = direction === "next" ? currentDate.add(1, "month") : currentDate.subtract(1, "month")

    // Reset the day status for the new month to avoid showing selected days from previous month
    setDayStatus({})

    // Update the current date
    setCurrentDate(newDate)

    // Also update the selected date to the first day of the new month
    setSelectedDate(dayjs(new Date(newDate.year(), newDate.month(), 1)))

    // Force refresh the calendar with the current schedule
    setTimeout(() => {
      if (schedule && schedule.days && schedule.days.length > 0) {
        updateCalendarWithSchedule(schedule, schedule.days)
      }
    }, 100)
  }

  // Add this function after the handleMonthChange function:

  const refreshCalendarWithCurrentSchedule = () => {
    if (schedule && schedule.days && schedule.days.length > 0) {
      console.log("Refreshing calendar with current schedule:", schedule.days)
      updateCalendarWithSchedule(schedule, schedule.days)
    }
  }

  // Helper function to get the event status for a specific event type
  const getEventStatus = (eventType) => {
    if (!selectedDate) return false

    const dateStr = selectedDate.format("YYYY-MM-DD")

    switch (eventType) {
      case "sickleave":
        return schedule.sickleave === dateStr
      case "regularholiday":
        return schedule.regularholiday?.includes(dateStr) || false
      case "specialholiday":
        return schedule.specialholiday?.includes(dateStr) || false
      case "nightdiff":
        return schedule.nightdiff?.includes(dateStr) || false
      case "oncall":
        return schedule.oncall?.includes(dateStr) || false
      case "vacationleave":
        return schedule.vacationleave?.includes(dateStr) || false
      default:
        return false
    }
  }

  // Function to determine the background color of a calendar day based on its status
  const getDayStatusColor = (day) => {
    if (!day.isCurrentMonth) {
      return "bg-gray-400 text-white" // Light gray for days outside the current month
    }

    const dateStr = day.date.format("YYYY-MM-DD")
    const status = dayStatus[dateStr]

    switch (status) {
      case "attended":
      case "Present":
        return "bg-green-500 text-white" // Green for attended days
      case "absent":
      case "Absent":
        return "bg-red-500 text-white" // Red for absent days
      case "Late":
      case "late":
        return "bg-yellow-500 text-white" // Yellow for late days
      case "Overtime":
      case "overtime":
        return "bg-blue-400 text-white" // Blue for overtime days
      case "Undertime":
      case "undertime":
        return "bg-orange-500 text-white" // Orange for undertime days
      case "selected":
        return "bg-blue-200 text-gray-800" // Light blue for selected days
      case "sickleave":
      case "specialholiday":
      case "regularholiday":
      case "vacationleave":
        return "bg-orange-400 text-white" // Orange for events
      case "nightdiff":
        return "bg-blue-500 text-white" // Dark blue for night differential
      case "oncall":
        return "bg-purple-500 text-white" // Purple for on-call
      case "outside-period":
        return "bg-gray-200 text-gray-400" // Gray for days outside payroll period
      default:
        return "bg-white text-gray-700" // White for unselected days
    }
  }

  // Add this useEffect to call the refresh function when the month changes
  useEffect(() => {
    refreshCalendarWithCurrentSchedule()
  }, [currentDate, schedule.days])

  // This useEffect ensures the calendar is updated when the month changes
  useEffect(() => {
    console.log("Month or year changed, refreshing calendar")
    if (schedule && schedule.days && schedule.days.length > 0) {
      console.log(
        `Month changed to ${currentDate.format("MMMM YYYY")}, updating calendar with schedule days:`,
        schedule.days,
      )
      // Small delay to ensure all state is updated
      setTimeout(() => {
        updateCalendarWithSchedule(schedule, schedule.days)
      }, 100)
    }
  }, [currentDate.month(), currentDate.year(), schedule])

  useEffect(() => {
    if (schedule && schedule.days && schedule.days.length > 0) {
      console.log("Schedule data changed, updating calendar with days:", schedule.days)

      // Small delay to ensure all state is updated
      setTimeout(() => {
        updateCalendarWithSchedule(schedule, schedule.days)
      }, 100)
    }
  }, [schedule.id, schedule])

  // Add this useEffect after the other useEffects
  useEffect(() => {
    // Fetch attendance data when employee or current date changes
    if (employee?.user?.id) {
      fetchAttendanceData()
    }
  }, [employee, currentDate])

  // Add this useEffect to update the selected date info when it changes
  useEffect(() => {
    // Force refresh attendance data when selected date changes
    if (employee?.user?.id && selectedDate) {
      const dateStr = selectedDate.format("YYYY-MM-DD")
      console.log(`Selected date changed to ${dateStr}, checking attendance status`)

      // If we don't have attendance data for this date yet, fetch it
      if (!attendanceData[dateStr] && dayjs(dateStr).month() === currentDate.month()) {
        fetchAttendanceData()
      }
    }
  }, [selectedDate])

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="py-4 max-w-7xl mx-auto">
        <div className="container mx-auto px-4 pt-4 pb-8 flex flex-col gap-6">
          {/* Main content container with two panels side by side */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Calendar Panel - Fixed size with max-height */}
            <div className="bg-[#5C7346] rounded-lg p-6 lg:w-2/3 h-auto max-h-[800px] overflow-auto">
              {/* Header with back button, month navigation, and month title */}
              <div className="flex items-center justify-between mb-4">
                <button
                  className="flex items-center gap-2 bg-[#3A4D2B] text-white px-4 py-2 rounded-md hover:bg-[#2a3b1d] transition-colors"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <div className="flex items-center">
                  <button
                    className="bg-[#3A4D2B] text-white px-3 py-1 rounded-md hover:bg-[#2a3b1d] mr-2"
                    onClick={() => handleMonthChange("prev")}
                  >
                    <ArrowLeft className="w-5 h-7"></ArrowLeft>
                  </button>
                  <h2 className="text-white text-4xl font-bold p-2">{currentDate.format("MMMM YYYY")}</h2>
                  <button
                    className="bg-[#3A4D2B] text-white px-3 py-1 rounded-md hover:bg-[#2a3b1d] ml-2"
                    onClick={() => handleMonthChange("next")}
                  >
                    <ArrowRight className="w-5 h-7"></ArrowRight>
                  </button>
                </div>
                <div className="w-20"></div> {/* Spacer for alignment */}
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => (
                  <div key={day} className="text-white font-medium text-center py-1 text-sm md:text-lg">
                    <span className="hidden md:inline">{day}</span>
                    <span className="md:hidden">{day.substring(0, 3)}</span>
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {calendarDays.map((day, index) => {
                  const dateStr = day.date.format("YYYY-MM-DD")
                  const status = day.isCurrentMonth ? dayStatus[dateStr] : null
                  const isInPayrollPeriod = isDateInPayrollPeriod(dateStr)

                  return (
                    <div
                      key={index}
                      className={`${getDayStatusColor(
                        day,
                      )} rounded-lg h-20 flex flex-col items-center justify-center cursor-pointer transition-colors hover:opacity-90 relative p-2 sm:p-3 md:p-4
                      ${
                        day.date.format("YYYY-MM-DD") === selectedDate.format("YYYY-MM-DD")
                          ? "ring-4 ring-blue-500 font-bold shadow-lg"
                          : ""
                      } ${!isInPayrollPeriod && day.isCurrentMonth ? "opacity-50" : ""}`}
                      onClick={() => handleDayClick(day)}
                    >
                      <span className="text-md sm:text-lg md:text-xl font-bold">{day.dayOfMonth}</span>

                      {/* Event indicators */}
                      {day.isCurrentMonth && status && status !== "attended" && status !== "absent" && (
                        <div className="absolute bottom-[-2px] left-0 right-0 text-center">
                          <span className="text-xs md:text-sm px-2 whitespace-nowrap overflow-hidden text-ellipsis inline-block max-w-full">
                            {status === "sickleave" && "Sick Leave"}
                            {status === "specialholiday" && "Special Holiday"}
                            {status === "regularholiday" && "Regular Holiday"}
                            {status === "vacationleave" && "Vacation Leave"}
                            {status === "nightdiff" && "Night Differential"}
                            {status === "oncall" && "On Call"}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex justify-end flex-wrap mt-8 gap-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-white text-md">Attended</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-white text-md">Absent</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-200 mr-2"></div>
                  <span className="text-white text-md">Scheduled</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-orange-400 mr-2"></div>
                  <span className="text-white text-md">Events</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-200 mr-2"></div>
                  <span className="text-white text-md">Outside Period</span>
                </div>
              </div>
            </div>

            {/* Employee Schedule Panel - Fixed size with max-height */}
            <div className="bg-[#3A4D2B] rounded-lg p-4 lg:w-1/3 h-auto max-h-[800px] overflow-y-auto scrollbar-hide flex flex-col">
              {/* Employee Info - Horizontal layout */}
              <div className="flex items-center mb-6 bg-[#5C7346] p-3 rounded-lg">
                <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center mr-3">
                  {employee?.profile_picture ? (
                    <img
                      src={employee.profile_picture || "/placeholder.svg"}
                      alt={`${employee.first_name} ${employee.last_name}`}
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <User2 className="h-6 w-6" style={{ color: "#42573C" }} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {employee && employee.first_name && employee.last_name
                      ? `${employee.first_name} ${employee.last_name}`
                      : employee && employee.user && employee.user.first_name && employee.user.last_name
                        ? `${employee.user.first_name} ${employee.user.last_name}`
                        : "Employee"}
                  </h3>
                  <p className="text-md text-white">
                    {employee?.employee_id || employee?.user?.id || employeeId || ""}
                  </p>
                </div>
              </div>

              {/* Payroll Period Display in Employee Panel */}
              <div className="mb-4 bg-[#5C7346] p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <CalendarDays className="h-5 w-5 text-white mr-2" />
                    <span className="text-white font-bold">Payroll Period:</span>
                  </div>
                </div>
                <div className="w-full">
                  <select
                    value={selectedPayrollPeriodId || ""}
                    onChange={handlePayrollPeriodChange}
                    className="w-full px-2 py-2 rounded border border-gray-300 bg-white text-[#3A4D2B]"
                  >
                    <option value="">Select a payroll period</option>
                    {payrollPeriods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {dayjs(period.payroll_period_start).format("MMM DD")} -{" "}
                        {dayjs(period.payroll_period_end).format("MMM DD")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Schedule Section */}
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <Calendar className="h-5 w-5 text-white mr-2" />
                  <p className="text-md font-bold text-white">Schedule</p>
                </div>
                <div className="bg-[#A3BC84] rounded-md p-3">
                  {/* Days of week selector - improved design */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => {
                      const dayKey = index === 4 ? "T2" : index === 6 ? "S2" : day
                      return (
                        <button
                          key={day}
                          className={`h-8 rounded-lg flex items-center justify-center text-md font-medium transition-all ${
                            selectedDays[dayKey]
                              ? "bg-white text-[#5C7346]"
                              : "bg-[#5C7346] text-white hover:bg-opacity-80"
                          }`}
                          onClick={() => handleDaySelection(dayKey)}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Shift Section */}
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <Clock className="h-5 w-5 text-white mr-2" />
                  <p className="text-md font-bold text-white">Shifts</p>
                </div>
                <div className="bg-[#A3BC84] rounded-md p-3">
                  {/* Main shift buttons */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {["morning", "midday", "night"].map((shift) => (
                      <button
                        key={shift}
                        className={`py-2 px-3 w-full rounded-md text-sm font-medium transition-all ${
                          selectedShift === shift
                            ? "bg-white text-[#5C7346]"
                            : "bg-[#5C7346] text-white hover:bg-opacity-80"
                        }`}
                        onClick={() => handleShiftSelection(shift)}
                      >
                        <span className="text-lg font-bold capitalize">{shift}</span>
                        <span className="text-md block mt-1 opacity-80">
                          {shift === "morning" ? "10 AM - 7 PM" : shift === "midday" ? "12 PM - 9 PM" : "7 PM - 11 PM"}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Custom Shift Selection - Improved layout */}
                  <div>
                    {/* Custom Shift Button - Full width when not selected */}
                    <button
                      className={`py-2 px-3 w-full rounded-md text-sm font-medium transition-all ${
                        selectedShift === "custom"
                          ? "bg-white text-[#5C7346]"
                          : "bg-[#5C7346] text-white hover:bg-opacity-80"
                      }`}
                      onClick={() => handleShiftSelection("custom")}
                    >
                      <span className="text-lg font-bold">Custom</span>
                    </button>

                    {/* Time Inputs - Only shown when custom is selected */}
                    {selectedShift === "custom" && (
                      <div className="flex items-center gap-2 mt-2 bg-[#5C7346] p-2 rounded-md">
                        <input
                          type="time"
                          value={customShiftStart}
                          onChange={(e) => setCustomShiftStart(e.target.value)}
                          className="py-2 px-3 flex-1 text-md bg-white text-[#5C7346] border border-gray-400 rounded-md focus:outline-none"
                        />

                        <span className="text-white text-md font-medium">-</span>

                        <input
                          type="time"
                          value={customShiftEnd}
                          onChange={(e) => setCustomShiftEnd(e.target.value)}
                          className="py-2 px-3 flex-1 text-md bg-white text-[#5C7346] border border-gray-400 rounded-md focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                  {/* Time Inputs - Only shown when custom is selected */}
                </div>
              </div>

              {/* Events Section - More compact */}
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <CheckSquare className="h-5 w-5 text-white mr-2" />
                  <p className="text-md font-bold text-white">Events</p>
                </div>
                <div className="bg-[#A3BC84] rounded-md p-3">
                  {/* Selected date display with fixed layout */}
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xl font-bold text-white">
                      {/* Event type goes here */}
                      {(() => {
                        const dateStr = selectedDate.format("YYYY-MM-DD")
                        const status = dayStatus[dateStr]

                        // Check if we have attendance data for this date
                        const attendanceStatus = attendanceData[dateStr]?.toLowerCase()

                        // First priority: Check attendance data
                        if (attendanceStatus) {
                          if (attendanceStatus === "late") return "Late"
                          if (attendanceStatus === "overtime") return "Overtime"
                          if (attendanceStatus === "undertime") return "Undertime"
                          if (attendanceStatus === "present") return "Present"
                          if (attendanceStatus === "absent") return "Absent"
                        }

                        // Second priority: Check day status
                        if (status === "late") return "Late"
                        if (status === "overtime") return "Overtime"
                        if (status === "undertime") return "Undertime"
                        if (status === "attended") return "Present"
                        if (status === "absent") return "Absent"

                        // Third priority: Check for events
                        if (status === "sickleave") return "Sick Leave"
                        if (status === "regularholiday") return "Regular Holiday"
                        if (status === "specialholiday") return "Special Holiday"
                        if (status === "vacationleave") return "Vacation Leave"
                        if (status === "nightdiff") return "Night Differential"
                        if (status === "oncall") return "On Call"

                        // Default
                        return "No Event"
                      })()}
                    </div>
                    <div className="text-xl font-bold text-white">
                      {/* Date is fixed on the right */}
                      {selectedDate.format("MMMM D")}
                    </div>
                  </div>

                  {/* Add attendance details section */}
                  <div className="mt-4 space-y-2">
                    {/* Status field with color coding */}
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">Status:</span>
                      {(() => {
                        const dateStr = selectedDate.format("YYYY-MM-DD")
                        const status = dayStatus[dateStr]
                        const attendanceStatus = attendanceData[dateStr]?.toLowerCase()

                        // Determine status text and color
                        let statusText = "No Event"
                        let statusColor = "text-white"

                        if (attendanceStatus === "late" || status === "late") {
                          statusText = "Late"
                          statusColor = "text-yellow-300 font-bold"
                        } else if (attendanceStatus === "overtime" || status === "overtime") {
                          statusText = "Overtime"
                          statusColor = "text-blue-300 font-bold"
                        } else if (attendanceStatus === "undertime" || status === "undertime") {
                          statusText = "Undertime"
                          statusColor = "text-orange-300 font-bold"
                        } else if (attendanceStatus === "present" || status === "attended") {
                          statusText = "Present"
                          statusColor = "text-green-300 font-bold"
                        } else if (attendanceStatus === "absent" || status === "absent") {
                          statusText = "Absent"
                          statusColor = "text-red-300 font-bold"
                        } else if (status === "sickleave") {
                          statusText = "Sick Leave"
                          statusColor = "text-orange-300 font-bold"
                        } else if (status === "regularholiday" || status === "specialholiday") {
                          statusText = status === "regularholiday" ? "Regular Holiday" : "Special Holiday"
                          statusColor = "text-orange-300 font-bold"
                        } else if (status === "vacationleave") {
                          statusText = "Vacation Leave"
                          statusColor = "text-orange-300 font-bold"
                        } else if (status === "nightdiff") {
                          statusText = "Night Differential"
                          statusColor = "text-blue-300 font-bold"
                        } else if (status === "oncall") {
                          statusText = "On Call"
                          statusColor = "text-purple-300 font-bold"
                        }

                        return <span className={statusColor}>{statusText}</span>
                      })()}
                    </div>
                  </div>

                  {/* Event options in a more compact grid */}
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {[
                      {
                        id: "regularHoliday",
                        label: "Regular Holiday",
                        type: "regularholiday",
                      },
                      {
                        id: "sickLeave",
                        label: "Sick Leave",
                        type: "sickleave",
                      },
                      {
                        id: "specialHoliday",
                        label: "Special Holiday",
                        type: "specialholiday",
                      },
                      { id: "onCall", label: "Oncall", type: "oncall" },
                      { id: "restDay", label: "Rest Day", type: "absent" },
                      {
                        id: "nightDiff",
                        label: "Nightdiff",
                        type: "nightdiff",
                      },
                      {
                        id: "vacationLeave",
                        label: "Vacation Leave",
                        type: "vacationleave",
                      },
                    ].map((event) => (
                      <label
                        key={event.id}
                        htmlFor={event.id}
                        className={`flex items-center p-2 rounded-md cursor-pointer transition-all ${
                          getEventStatus(event.type)
                            ? "bg-white text-[#5C7346]"
                            : "bg-[#5C7346] text-white hover:bg-opacity-90"
                        }`}
                      >
                        <input
                          type="checkbox"
                          id={event.id}
                          checked={getEventStatus(event.type)}
                          onChange={() => handleEventSelection(event.type)}
                          className="mr-4 h-4 w-4 accent-[#5C7346] cursor-pointer"
                        />
                        <span className="text-md font-medium">{event.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Success/Error Message */}
              {saveMessage && (
                <div
                  className={`mb-4 p-3 rounded-md text-center ${
                    saveSuccess ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  }`}
                >
                  {saveMessage}
                </div>
              )}

              {/* Delete Confirmation Dialog */}
              {showDeleteConfirm && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded-md">
                  <p className="text-red-700 mb-2 font-medium">Are you sure you want to delete this schedule?</p>
                  <div className="flex justify-end gap-2">
                    <button
                      className="bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 flex items-center"
                      onClick={handleDeleteSchedule}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-end mt-auto">
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center gap-1"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={!schedule.id || isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>

                <button
                  className="bg-[#373A45] text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  onClick={() => navigate(`/payslip?employeeId=${employeeId}`)}
                >
                  Payslip
                </button>

                {/* New button to save only events */}
                <button
                  className="bg-[#5C7346] text-white px-4 py-2 rounded-md hover:bg-[#4a5c38] transition-colors"
                  onClick={handleSaveEvents}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Events Only"}
                </button>

                <button
                  className="bg-[#373A45] text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  onClick={handleSaveSchedule}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  )
}

export default AdminEmployeeEditSchedulePage
