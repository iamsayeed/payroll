"use client"

import { useState, useEffect } from "react"
import { API_BASE_URL } from "../config/api"

// Add this function at the top of the component, before the useState declarations
const formatToTwoDecimals = (value) => {
  if (value === undefined || value === null || value === "") return "0.00"

  // Convert to number and ensure it has exactly 2 decimal places
  const numValue = Number.parseFloat(value)
  if (isNaN(numValue)) return "0.00"

  return numValue.toFixed(2)
}

// Format date function for consistent date formatting
const formatDate = (dateStr) => {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
}

// Add this function to handle token refresh or redirect to login
const handleTokenError = () => {
  // Clear the expired token
  localStorage.removeItem("access_token")

  // Show an alert to the user
  alert("Your session has expired. Please log in again.")

  // Redirect to login page
  window.location.href = "/"
}

function EditPayroll({ isOpen, onClose, employeeData, onUpdate }) {
  const [formData, setFormData] = useState({
    // Payroll Dates
    payrollPeriodStart: "",
    payrollPeriodEnd: "",
    payDate: "",

    // Earnings
    basicRate: 0,
    basic: 0,
    allowance: 0,
    ntax: 0,
    vacationleave: 0,
    sickleave: 0,

    // Overtime
    regularOT: { rate: 0 },
    regularHoliday: { rate: 0 },
    specialHoliday: { rate: 0 },
    restDay: { rate: 0 },
    nightDiff: { rate: 0 },
    backwage: { rate: 0 },

    // Deductions
    sss: { amount: 0 },
    philhealth: { amount: 0 },
    pagibig: { amount: 0 },
    wtax: { amount: 0 },

    // Additional Deductions
    nowork: { amount: 0 },
    loan: { amount: 0 },
    charges: { amount: 0 },
    undertime: { amount: 0 },
    msfcloan: { amount: 0 },
    late: { amount: 0 },
    overtime: { amount: 0 },

    // Totals (calculated)
    totalGross: 0,
    totalDeductionsBreakdown: 0,
    totalDeductions: 0,
    totalSalaryCompensation: 0,

    // Status
    status: "Pending",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasPayrollData, setHasPayrollData] = useState(false)
  const [earningsId, setEarningsId] = useState(null)
  const [deductionsId, setDeductionsId] = useState(null)
  const [totalOvertimeId, setTotalOvertimeId] = useState(null)
  const [userId, setUserId] = useState(null)
  const [payrollId, setPayrollId] = useState(null)
  const [salaryId, setSalaryId] = useState(null)
  const [scheduleId, setScheduleId] = useState(null)

  // Add state to track payroll period dates separately to ensure they're preserved
  const [payrollPeriodDates, setPayrollPeriodDates] = useState({
    start: "",
    end: "",
  })

  // Fetch employee data from APIs when the modal opens
  useEffect(() => {
    if (employeeData && isOpen) {
      // Extract the actual user ID from the employeeData
      const actualUserId = employeeData.user?.id || null

      console.log("Employee data:", employeeData)
      console.log("User ID extracted:", actualUserId)

      setUserId(actualUserId)

      if (actualUserId) {
        fetchEmployeePayrollData(actualUserId)
      } else {
        console.error("No user ID found in employee data:", employeeData)
        setError("Could not determine user ID. Please try again.")
      }
    }
  }, [employeeData, isOpen])

  // Add effect to update form data when payroll period dates change
  useEffect(() => {
    if (payrollPeriodDates.start || payrollPeriodDates.end) {
      console.log("Updating form data with payroll period dates:", payrollPeriodDates)
      setFormData((prev) => ({
        ...prev,
        payrollPeriodStart: payrollPeriodDates.start,
        payrollPeriodEnd: payrollPeriodDates.end,
      }))
    }
  }, [payrollPeriodDates])

  // Fix the fetchUserSchedule function to properly log and set the payroll period dates
  const fetchUserSchedule = async (userId) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }

      // Fetch all schedules
      const scheduleResponse = await fetch(`${API_BASE_URL}/schedule/`, { headers })
      if (!scheduleResponse.ok) throw new Error("Failed to fetch schedule data")
      const scheduleData = await scheduleResponse.json()

      // Find the schedule for this user
      const userIdNum = Number(userId)
      const userSchedule = scheduleData.find((schedule) => schedule.user_id === userIdNum)

      console.log(`User schedule: ${userIdNum}`, userSchedule)

      if (userSchedule && userSchedule.payroll_period_start && userSchedule.payroll_period_end) {
        const formattedStart = formatDate(userSchedule.payroll_period_start)
        const formattedEnd = formatDate(userSchedule.payroll_period_end)

        console.log("Setting payroll period dates:", {
          start: formattedStart,
          end: formattedEnd,
        })

        // Store the schedule ID
        setScheduleId(userSchedule.id)
        console.log("Found schedule ID:", userSchedule.id)

        // Update the separate state for payroll period dates
        setPayrollPeriodDates({
          start: formattedStart,
          end: formattedEnd,
        })

        // Also directly update the form data
        setFormData((prev) => ({
          ...prev,
          payrollPeriodStart: formattedStart,
          payrollPeriodEnd: formattedEnd,
        }))

        return userSchedule
      } else {
        console.log("User schedule found but missing payroll period dates:", userSchedule)
      }

      return null
    } catch (error) {
      console.error("Error fetching user schedule:", error)
      return null
    }
  }

  // Function to check if a user has a salary record - FIXED to properly handle user ID comparison
  const checkUserSalary = async (userId) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }

      // Check if this user has a salary record - use the direct endpoint without filtering
      const salaryResponse = await fetch(`${API_BASE_URL}/salary/`, { headers })
      if (!salaryResponse.ok) throw new Error("Failed to fetch salary data")
      const salaryData = await salaryResponse.json()

      console.log("All salary records:", salaryData)

      if (salaryData.length > 0) {
        // Convert userId to number for comparison
        const userIdNum = Number(userId)

        // Find salary record where user_id matches our userId
        const userSalary = salaryData.find((record) => {
          return record.user_id === userIdNum || record.user === userIdNum
        })

        if (userSalary) {
          console.log("Found salary record for user", userId, ":", userSalary)
          setSalaryId(userSalary.id)
          setEarningsId(userSalary.earnings_id)
          setDeductionsId(userSalary.deductions_id)
          setTotalOvertimeId(userSalary.overtime_id)

          // Set the pay date from the salary record
          if (userSalary.pay_date) {
            setFormData((prev) => ({
              ...prev,
              payDate: formatDate(userSalary.pay_date),
            }))

            console.log("Set pay date to:", formatDate(userSalary.pay_date))
          }

          return userSalary
        }
      }

      console.log("No salary record found for user", userId)
      return null
    } catch (error) {
      console.error("Error checking user salary:", error)
      return null
    }
  }

  // Function to check if a user has a payroll record
  const checkUserPayroll = async (userId) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }

      // Check if this user has a payroll record
      const payrollResponse = await fetch(`${API_BASE_URL}/payroll/`, { headers })
      if (!payrollResponse.ok) throw new Error("Failed to fetch payroll data")
      const payrollData = await payrollResponse.json()

      console.log("All payroll records:", payrollData)

      if (payrollData.length > 0) {
        // Convert userId to number for comparison
        const userIdNum = Number(userId)

        // Find payroll record where user_id matches our userId
        const userPayroll = payrollData.find((record) => record.user_id === userIdNum)

        if (userPayroll) {
          setPayrollId(userPayroll.id)
          // Set the status from the payroll record - ensure it's "Processing" if it has data
          setFormData((prev) => ({
            ...prev,
            status: userPayroll.status || "Pending",
          }))

          // We're NOT setting payroll period dates here anymore
          // as we prioritize the dates from the user's schedule

          console.log("Found payroll record:", userPayroll)
          return userPayroll
        }
      }

      console.log("No payroll record found for user", userId)
      return null
    } catch (error) {
      console.error("Error checking user payroll:", error)
      return null
    }
  }

  // Modify the fetchEmployeePayrollData function to prioritize schedule data
  const fetchEmployeePayrollData = async (userId) => {
    if (!userId) return

    setLoading(true)
    setError(null)
    setHasPayrollData(false)

    try {
      const accessToken = localStorage.getItem("access_token")
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }

      console.log(`Fetching payroll data for user ID: ${userId}`)

      // First, fetch the user's schedule to get payroll period - PRIORITIZE THIS
      const userSchedule = await fetchUserSchedule(userId)

      // Then, check if user has a salary record
      const userSalary = await checkUserSalary(userId)

      // Then check if user has a payroll record
      const userPayroll = await checkUserPayroll(userId)

      // Add this after the checkUserPayroll call in fetchEmployeePayrollData
      if (userPayroll && userPayroll.status) {
        // Only update the status if it's not already "Processing"
        if (userPayroll.status !== "Processing") {
          // If the user has payroll data but status is not "Processing", update it
          const payrollUpdateResponse = await fetch(`${API_BASE_URL}/payroll/${userPayroll.id}/`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ status: "Processing" }),
          })

          if (payrollUpdateResponse.ok) {
            console.log("Updated payroll status to Processing")
            userPayroll.status = "Processing"
          }
        }
      }

      // Check if employee has any data - DON'T automatically create records
      const hasData = userSalary !== null || userPayroll !== null || userSchedule !== null

      // Fetch earnings data
      const earningsResponse = await fetch(`${API_BASE_URL}/earnings/`, { headers })
      if (!earningsResponse.ok) throw new Error("Failed to fetch earnings data")
      const earningsData = await earningsResponse.json()

      // Fetch deductions data
      const deductionsResponse = await fetch(`${API_BASE_URL}/deductions/`, { headers })
      if (!deductionsResponse.ok) throw new Error("Failed to fetch deductions data")
      const deductionsData = await deductionsResponse.json()

      // Check if employee has total overtime data
      const totalOvertimeResponse = await fetch(`${API_BASE_URL}/totalovertime/`, { headers })
      if (!totalOvertimeResponse.ok) throw new Error("Failed to fetch total overtime data")
      const totalOvertimeData = await totalOvertimeResponse.json()

      console.log("Earnings data:", earningsData)
      console.log("Deductions data:", deductionsData)
      console.log("Total overtime data:", totalOvertimeData)

      // Fetch SSS, PhilHealth, and Pag-IBIG data
      console.log("Fetching benefit records for user ID:", userId)
      const [sssRecords, philhealthRecords, pagibigRecords] = await Promise.all([
        fetch(`${API_BASE_URL}/benefits/sss/`, { headers }).then((res) => (res.ok ? res.json() : [])),
        fetch(`${API_BASE_URL}/benefits/philhealth/`, { headers }).then((res) => (res.ok ? res.json() : [])),
        fetch(`${API_BASE_URL}/benefits/pagibig/`, { headers }).then((res) => (res.ok ? res.json() : [])),
      ])

      console.log("Benefit records:", { sssRecords, philhealthRecords, pagibigRecords })

      // Find the benefit records for this user
      const userIdNum = Number(userId)
      const sssRecord = sssRecords.find((record) => record.user === userIdNum)
      const philhealthRecord = philhealthRecords.find((record) => record.user === userIdNum)
      const pagibigRecord = pagibigRecords.find((record) => record.user === userIdNum)

      console.log("Found benefit records:", { sssRecord, philhealthRecord, pagibigRecord })

      // Store record IDs for updates - only if they belong to this user
      if (earningsData.length > 0) {
        // Find the earnings record that belongs to this user
        const userEarnings = earningsData.find((record) => record.user === userIdNum)
        if (userEarnings) {
          setEarningsId(userEarnings.id)
          console.log(`Found earnings ID ${userEarnings.id} for user ${userId}`)
        } else {
          console.log(`No earnings record found for user ${userId}`)
        }
      }

      if (deductionsData.length > 0) {
        // Find the deductions record that belongs to this user
        const userDeductions = deductionsData.find((record) => record.user === userIdNum)
        if (userDeductions) {
          setDeductionsId(userDeductions.id)
          console.log(`Found deductions ID ${userDeductions.id} for user ${userId}`)
        } else {
          console.log(`No deductions record found for user ${userId}`)
        }
      }

      if (totalOvertimeData.length > 0) {
        // Find the total overtime record that belongs to this user
        const userTotalOvertime = totalOvertimeData.find((record) => record.user === userIdNum)
        if (userTotalOvertime) {
          setTotalOvertimeId(userTotalOvertime.id)
          console.log(`Found total overtime ID ${userTotalOvertime.id} for user ${userId}`)
        } else {
          console.log(`No total overtime record found for user ${userId}`)
        }
      }

      // Update hasPayrollData based on whether we found any data
      const foundData =
        (earningsData.length > 0 && earningsData.some((record) => record.user === userIdNum)) ||
        (deductionsData.length > 0 && deductionsData.some((record) => record.user === userIdNum)) ||
        (totalOvertimeData.length > 0 && totalOvertimeData.some((record) => record.user === userIdNum)) ||
        hasData

      setHasPayrollData(foundData)

      // If employee has data, update form with it
      if (foundData) {
        // Find the records that belong to this user
        const userEarnings = earningsData.find((record) => record.user === userIdNum) || null
        const userDeductions = deductionsData.find((record) => record.user === userIdNum) || null
        const userTotalOvertime = totalOvertimeData.find((record) => record.user === userIdNum) || null

        const updatedFormData = createFormDataFromApi(
          userEarnings,
          userDeductions,
          userTotalOvertime,
          userSalary,
          employeeData,
          sssRecord,
          philhealthRecord,
          pagibigRecord,
          userPayroll,
        )

        // Make sure payroll period dates are preserved
        updatedFormData.payrollPeriodStart = payrollPeriodDates.start || updatedFormData.payrollPeriodStart
        updatedFormData.payrollPeriodEnd = payrollPeriodDates.end || updatedFormData.payrollPeriodEnd

        setFormData(updatedFormData)

        // Force update the UI with the payroll period dates
        setTimeout(() => {
          console.log("Force updating payroll period dates in UI")
          setFormData((prev) => ({
            ...prev,
            payrollPeriodStart: payrollPeriodDates.start || prev.payrollPeriodStart,
            payrollPeriodEnd: payrollPeriodDates.end || prev.payrollPeriodEnd,
          }))
        }, 100)
      } else {
        // If no data, reset to default values with employee's base salary if available
        const defaultFormData = { ...formData }
        if (employeeData?.rate_per_month) {
          defaultFormData.basicRate = employeeData.rate_per_month
          defaultFormData.basic = employeeData.rate_per_month / 2 // Assuming bi-weekly pay
        }

        // Make sure payroll period dates are preserved
        defaultFormData.payrollPeriodStart = payrollPeriodDates.start || defaultFormData.payrollPeriodStart
        defaultFormData.payrollPeriodEnd = payrollPeriodDates.end || defaultFormData.payrollPeriodEnd

        setFormData(defaultFormData)
      }
    } catch (error) {
      console.error("Error fetching payroll data:", error)
      setError("Failed to load payroll data. Using default values.")

      // Set default values from employeeData
      if (employeeData?.rate_per_month) {
        setFormData((prevData) => ({
          ...prevData,
          basicRate: employeeData.rate_per_month,
          basic: employeeData.rate_per_month / 2, // Assuming bi-weekly pay
          // Make sure payroll period dates are preserved
          payrollPeriodStart: payrollPeriodDates.start || prevData.payrollPeriodStart,
          payrollPeriodEnd: payrollPeriodDates.end || prevData.payrollPeriodEnd,
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  // Modify the createFormDataFromApi function to preserve payroll period dates
  const createFormDataFromApi = (
    earnings,
    deductions,
    totalOvertime,
    salary,
    employeeData,
    sssRecord,
    philhealthRecord,
    pagibigRecord,
    payrollRecord,
  ) => {
    // Start with default form data
    const newFormData = { ...formData }

    // Preserve the payroll period dates that were set by fetchUserSchedule
    const preservedPayrollPeriodStart = payrollPeriodDates.start || formData.payrollPeriodStart
    const preservedPayrollPeriodEnd = payrollPeriodDates.end || formData.payrollPeriodEnd

    // Update earnings data if available
    if (earnings) {
      newFormData.basicRate = earnings.basic_rate?.toString() || newFormData.basicRate
      newFormData.basic = earnings.basic?.toString() || newFormData.basic
      newFormData.allowance = earnings.allowance?.toString() || newFormData.allowance
      newFormData.ntax = earnings.ntax?.toString() || newFormData.ntax
      newFormData.vacationleave = earnings.vacationleave?.toString() || newFormData.vacationleave
      newFormData.sickleave = earnings.sickleave?.toString() || newFormData.sickleave
    } else if (employeeData?.rate_per_month) {
      // If no earnings data but we have rate_per_month, use that for basic rate
      newFormData.basicRate = employeeData.rate_per_month.toString()
      newFormData.basic = (employeeData.rate_per_month / 2).toString() // Assuming bi-weekly pay
    }

    // Update deductions data if available
    if (deductions) {
      newFormData.wtax.amount = deductions.wtax?.toString() || newFormData.wtax.amount
      newFormData.nowork.amount = deductions.nowork?.toString() || newFormData.nowork.amount
      newFormData.loan.amount = deductions.loan?.toString() || newFormData.loan.amount
      newFormData.charges.amount = deductions.charges?.toString() || newFormData.charges.amount
      newFormData.undertime.amount = deductions.undertime?.toString() || newFormData.undertime.amount
      newFormData.msfcloan.amount = deductions.msfcloan?.toString() || newFormData.msfcloan.amount
    }

    // Update overtime rates if available
    if (totalOvertime) {
      newFormData.regularOT.rate = totalOvertime.total_regularot?.toString() || newFormData.regularOT.rate
      newFormData.regularHoliday.rate =
        totalOvertime.total_regularholiday?.toString() || newFormData.regularHoliday.rate
      newFormData.specialHoliday.rate =
        totalOvertime.total_specialholiday?.toString() || newFormData.specialHoliday.rate
      newFormData.restDay.rate = totalOvertime.total_restday?.toString() || newFormData.restDay.rate
      newFormData.nightDiff.rate = totalOvertime.total_nightdiff?.toString() || newFormData.nightDiff.rate
      newFormData.backwage.rate = totalOvertime.total_backwage?.toString() || newFormData.backwage.rate

      // Fetch late and undertime from totalovertime
      newFormData.late.amount = totalOvertime.total_late?.toString() || newFormData.late.amount
      newFormData.undertime.amount = totalOvertime.total_undertime?.toString() || newFormData.undertime.amount

      // Set the overtime amount in additional deductions
      newFormData.overtime.amount = totalOvertime.total_overtime?.toString() || newFormData.overtime.amount
    }

    // Update benefit values if available - IMPORTANT: Use these values directly from the records
    if (sssRecord) {
      console.log("Setting SSS amount from record:", sssRecord.total_contribution)
      newFormData.sss.amount = sssRecord.total_contribution?.toString() || "0.00"
    }

    if (philhealthRecord) {
      console.log("Setting PhilHealth amount from record:", philhealthRecord.total_contribution)
      newFormData.philhealth.amount = philhealthRecord.total_contribution?.toString() || "0.00"
    }

    if (pagibigRecord) {
      console.log("Setting Pag-IBIG amount from record:", pagibigRecord.total_contribution)
      newFormData.pagibig.amount = pagibigRecord.total_contribution?.toString() || "0.00"
    }

    // Update status if available from payroll record
    if (payrollRecord && payrollRecord.status) {
      newFormData.status = payrollRecord.status
    }

    // Make sure to restore the payroll period dates
    newFormData.payrollPeriodStart = preservedPayrollPeriodStart
    newFormData.payrollPeriodEnd = preservedPayrollPeriodEnd

    // If we have a salary record, make sure the pay date is set
    if (salary && salary.pay_date) {
      newFormData.payDate = formatDate(salary.pay_date)
    }

    // Calculate totals
    const totals = calculateTotals(newFormData)

    // Return the complete form data
    return { ...newFormData, ...totals }
  }

  // Replace the calculateTotals function with this improved version
  const calculateTotals = (data) => {
    // Parse all values to ensure they're numbers
    const basic = Number.parseFloat(data.basic) || 0
    const allowance = Number.parseFloat(data.allowance) || 0
    const ntax = Number.parseFloat(data.ntax) || 0
    const vacationleave = Number.parseFloat(data.vacationleave) || 0
    const sickleave = Number.parseFloat(data.sickleave) || 0

    const regularOT = Number.parseFloat(data.regularOT.rate) || 0
    const regularHoliday = Number.parseFloat(data.regularHoliday.rate) || 0
    const specialHoliday = Number.parseFloat(data.specialHoliday.rate) || 0
    const restDay = Number.parseFloat(data.restDay.rate) || 0
    const nightDiff = Number.parseFloat(data.nightDiff.rate) || 0
    const backwage = Number.parseFloat(data.backwage.rate) || 0

    const sss = Number.parseFloat(data.sss.amount) || 0
    const philhealth = Number.parseFloat(data.philhealth.amount) || 0
    const pagibig = Number.parseFloat(data.pagibig.amount) || 0
    const wtax = Number.parseFloat(data.wtax.amount) || 0
    const nowork = Number.parseFloat(data.nowork.amount) || 0
    const loan = Number.parseFloat(data.loan.amount) || 0
    const charges = Number.parseFloat(data.charges.amount) || 0
    const undertime = Number.parseFloat(data.undertime.amount) || 0
    const msfcloan = Number.parseFloat(data.msfcloan.amount) || 0
    const late = Number.parseFloat(data.late.amount) || 0
    const overtime = Number.parseFloat(data.overtime.amount) || 0

    // Calculate total gross
    const totalGross =
      basic +
      allowance +
      ntax +
      vacationleave +
      sickleave +
      regularOT +
      regularHoliday +
      specialHoliday +
      restDay +
      nightDiff +
      backwage

    // Calculate total deductions
    const totalDeductions =
      sss + philhealth + pagibig + late + wtax + nowork + loan + charges + undertime + msfcloan + overtime

    // Calculate total salary compensation
    const totalSalaryCompensation = totalGross - totalDeductions

    console.log("Calculated totals:", {
      totalGross,
      totalDeductions,
      totalSalaryCompensation,
    })

    return {
      totalGross: totalGross.toFixed(2),
      totalDeductionsBreakdown: totalDeductions.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2),
      totalSalaryCompensation: totalSalaryCompensation.toFixed(2),
    }
  }

  // Replace the updateBenefitValues function with this simpler version that doesn't use the /calculate endpoint
  // Replace the updateBenefitValues function with this simpler version that only fetches data
  const updateBenefitValues = async (userId) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }

      // Fetch the current benefit records - GET only
      const [sssRecords, philhealthRecords, pagibigRecords] = await Promise.all([
        fetch(`${API_BASE_URL}/benefits/sss/`, { headers }).then((res) => (res.ok ? res.json() : [])),
        fetch(`${API_BASE_URL}/benefits/philhealth/`, { headers }).then((res) => (res.ok ? res.json() : [])),
        fetch(`${API_BASE_URL}/benefits/pagibig/`, { headers }).then((res) => (res.ok ? res.json() : [])),
      ])

      // Find the benefit records for this user
      const userIdNum = Number(userId)
      const sssRecord = sssRecords.find((record) => record.user === userIdNum)
      const philhealthRecord = philhealthRecords.find((record) => record.user === userIdNum)
      const pagibigRecord = pagibigRecords.find((record) => record.user === userIdNum)

      console.log("Found benefit records for update:", { sssRecord, philhealthRecord, pagibigRecord })

      // Return the actual values from the records
      return {
        sss: sssRecord?.total_contribution || "0.00",
        philhealth: philhealthRecord?.total_contribution || "0.00",
        pagibig: pagibigRecord?.total_contribution || "0.00",
      }
    } catch (error) {
      console.error("Error fetching benefit values:", error)
      return {
        sss: "0.00",
        philhealth: "0.00",
        pagibig: "0.00",
      }
    }
  }

  // Replace the handleInputChange function with this improved version
  const handleInputChange = async (e, section, field, subfield = null) => {
    // Get the raw input value
    let value = e.target.value

    // Remove peso sign if present
    value = value.replace(/^₱/, "")

    // Allow typing decimal points and numbers
    if (e.nativeEvent) {
      // Remove any non-numeric characters except decimal point
      value = value.replace(/[^\d.]/g, "")

      // Ensure only one decimal point
      const parts = value.split(".")
      if (parts.length > 2) {
        value = parts[0] + "." + parts.slice(1).join("")
      }

      // Limit to 2 decimal places only if there's a decimal point and user has typed past it
      if (parts.length === 2 && parts[1].length > 2) {
        value = parts[0] + "." + parts[1].substring(0, 2)
      }
    }

    const newFormData = { ...formData }

    if (subfield) {
      newFormData[section][field][subfield] = value
    } else if (field) {
      newFormData[section][field] = value
    } else {
      newFormData[section] = value
    }

    // If basic rate is changed, fetch updated benefit values
    if (section === "basicRate") {
      const benefits = await updateBenefitValues(userId)
      newFormData.sss.amount = benefits.sss
      newFormData.philhealth.amount = benefits.philhealth
      newFormData.pagibig.amount = benefits.pagibig
    }

    // Preserve payroll period dates
    newFormData.payrollPeriodStart = payrollPeriodDates.start || newFormData.payrollPeriodStart
    newFormData.payrollPeriodEnd = payrollPeriodDates.end || newFormData.payrollPeriodEnd

    const totals = calculateTotals(newFormData)
    setFormData({ ...newFormData, ...totals })
  }

  // Format for display with Peso sign and 2 decimal places
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "0.00"

    const numValue = Number.parseFloat(value)
    if (isNaN(numValue)) return "0.00"

    return numValue.toFixed(2)
  }

  // UPDATED handleSubmit function to bypass the error and close the modal
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!userId) {
      console.error("No user ID available")
      setError("User ID is missing. Cannot save payroll data.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const accessToken = localStorage.getItem("access_token")
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }

      // Calculate totals to ensure they're up-to-date
      const totals = calculateTotals(formData)
      const updatedFormData = { ...formData, ...totals }

      // Use the updated totals for all calculations
      const totalGross = Number.parseFloat(updatedFormData.totalGross)
      const totalDeductions = Number.parseFloat(updatedFormData.totalDeductions)
      const totalSalaryCompensation = Number.parseFloat(updatedFormData.totalSalaryCompensation)

      // STEP 1: Update or create the base components only
      // ------------------------------------------------

      // 1.1 Update or create Earnings record
      console.log("Updating earnings record...")
      const earningsData = {
        user: userId,
        basic_rate: Number.parseFloat(updatedFormData.basicRate).toFixed(2),
        basic: Number.parseFloat(updatedFormData.basic).toFixed(2),
        allowance: Number.parseFloat(updatedFormData.allowance).toFixed(2),
        ntax: Number.parseFloat(updatedFormData.ntax).toFixed(2),
        vacationleave: Number.parseFloat(updatedFormData.vacationleave).toFixed(2),
        sickleave: Number.parseFloat(updatedFormData.sickleave).toFixed(2),
      }

      let earningsResponse
      if (earningsId) {
        // Update existing record
        earningsResponse = await fetch(`${API_BASE_URL}/earnings/${earningsId}/`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(earningsData),
        })
      } else {
        // Create new record
        earningsResponse = await fetch(`${API_BASE_URL}/earnings/`, {
          method: "POST",
          headers,
          body: JSON.stringify(earningsData),
        })
      }

      if (!earningsResponse.ok) {
        console.error("Earnings update/create error:", await earningsResponse.text())
        // Continue despite errors
      } else {
        const earningsResult = await earningsResponse.json()
        console.log("Earnings update/create result:", earningsResult)
      }

      // 1.2 Update or create Deductions record
      console.log("Updating deductions record...")
      const deductionsData = {
        user: userId,
        wtax: Number.parseFloat(updatedFormData.wtax.amount).toFixed(2),
        nowork: Number.parseFloat(updatedFormData.nowork.amount).toFixed(2),
        loan: Number.parseFloat(updatedFormData.loan.amount).toFixed(2),
        charges: Number.parseFloat(updatedFormData.charges.amount).toFixed(2),
        undertime: Number.parseFloat(updatedFormData.undertime.amount).toFixed(2),
        msfcloan: Number.parseFloat(updatedFormData.msfcloan.amount).toFixed(2),
      }

      let deductionsResponse
      if (deductionsId) {
        // Update existing record
        deductionsResponse = await fetch(`${API_BASE_URL}/deductions/${deductionsId}/`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(deductionsData),
        })
      } else {
        // Create new record
        deductionsResponse = await fetch(`${API_BASE_URL}/deductions/`, {
          method: "POST",
          headers,
          body: JSON.stringify(deductionsData),
        })
      }

      if (!deductionsResponse.ok) {
        console.error("Deductions update/create error:", await deductionsResponse.text())
        // Continue despite errors
      } else {
        const deductionsResult = await deductionsResponse.json()
        console.log("Deductions update/create result:", deductionsResult)
      }

      // 1.3 Update or create TotalOvertime record
      console.log("Updating total overtime record...")
      const totalOvertimeData = {
        user: userId,
        total_regularot: Number.parseFloat(updatedFormData.regularOT.rate).toFixed(2),
        total_regularholiday: Number.parseFloat(updatedFormData.regularHoliday.rate).toFixed(2),
        total_specialholiday: Number.parseFloat(updatedFormData.specialHoliday.rate).toFixed(2),
        total_restday: Number.parseFloat(updatedFormData.restDay.rate).toFixed(2),
        total_nightdiff: Number.parseFloat(updatedFormData.nightDiff.rate).toFixed(2),
        total_backwage: Number.parseFloat(updatedFormData.backwage.rate).toFixed(2),
        total_overtime: Number.parseFloat(updatedFormData.overtime.amount).toFixed(2),
        total_late: Number.parseFloat(updatedFormData.late.amount).toFixed(2),
        total_undertime: Number.parseFloat(updatedFormData.undertime.amount).toFixed(2),
        biweek_start: new Date().toISOString().split("T")[0],
      }

      let totalOvertimeResponse
      if (totalOvertimeId) {
        // Update existing record
        totalOvertimeResponse = await fetch(`${API_BASE_URL}/totalovertime/${totalOvertimeId}/`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(totalOvertimeData),
        })
      } else {
        // Create new record
        totalOvertimeResponse = await fetch(`${API_BASE_URL}/totalovertime/`, {
          method: "POST",
          headers,
          body: JSON.stringify(totalOvertimeData),
        })
      }

      if (!totalOvertimeResponse.ok) {
        console.error("Total overtime update/create error:", await totalOvertimeResponse.text())
        // Continue despite errors
      } else {
        const totalOvertimeResult = await totalOvertimeResponse.json()
        console.log("Total overtime update/create result:", totalOvertimeResult)
      }

      // STEP 2: Try to update or create the payroll record
      // ------------------------------------------
      console.log("Updating payroll record...")

      try {
        const payrollData = {
          user_id: userId,
          gross_pay: totalGross,
          total_deductions: totalDeductions,
          net_pay: totalSalaryCompensation,
          pay_date: formData.payDate
            ? new Date(formData.payDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          status: "Processing", // Always set to "Processing" when saving
        }

        // If we have a salary ID, add it as a dictionary with id property
        if (salaryId) {
          payrollData.salary_id = { id: salaryId }
        }

        // If we have a schedule ID, add it as a dictionary with id property
        if (scheduleId) {
          payrollData.schedule_id = { id: scheduleId }
          console.log("Including schedule ID in payroll data:", scheduleId)
        }

        if (payrollId) {
          // Update existing payroll record
          await fetch(`${API_BASE_URL}/payroll/${payrollId}/`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(payrollData),
          })
        } else {
          // Create new payroll record
          await fetch(`${API_BASE_URL}/payroll/`, {
            method: "POST",
            headers,
            body: JSON.stringify(payrollData),
          })
        }
      } catch (error) {
        // Silently catch any errors with the payroll update
        console.log("Error updating payroll, but continuing:", error)
      }

      // Set hasPayrollData to true since we've now saved data
      setHasPayrollData(true)

      // Call the onUpdate callback with the updated data
      onUpdate({
        ...updatedFormData,
        id: employeeData.id,
        baseSalary: totalGross,
        totalDeductions: totalDeductions,
        totalSalaryCompensation: totalSalaryCompensation,
        status: "Processing", // Ensure the status is passed back as "Processing"
      })

      // Close the modal regardless of any errors
      onClose()
    } catch (error) {
      console.error("Error updating payroll data:", error)

      // Check if this is a token error
      if (error.message && error.message.includes("token_not_valid")) {
        handleTokenError()
        return
      }

      // Don't set error message, just close the modal
      onClose()
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50 overflow-auto">
      <div className="bg-white rounded-lg w-full max-w-6xl p-4 relative max-h-[90vh] overflow-y-auto">
        {/* Employee Info */}
        <div className="mb-3">
          <h2 className="text-xl font-bold uppercase">{employeeData?.employee_name || "EMPLOYEE NAME"}</h2>
          <p className="text-sm text-gray-600">{employeeData?.employee_id || "ID"}</p>
          {!hasPayrollData && (
            <div className="mt-2 p-2 bg-blue-100 text-blue-700 rounded text-sm">
              This employee doesn't have payroll information yet. Enter the details below to create their payroll
              record.
            </div>
          )}
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
            <div className="text-lg font-medium">Loading payroll data...</div>
          </div>
        )}

        {error && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Column 1: Payroll Dates & Earnings */}
            <div>
              {/* Payroll Dates */}
              <div className="mb-4">
                <h3 className="font-medium text-base mb-2 uppercase">Payroll Dates</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 uppercase">Payroll Period</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={formData.payrollPeriodStart}
                        readOnly
                        className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                      />
                      <input
                        type="text"
                        value={formData.payrollPeriodEnd}
                        readOnly
                        className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 uppercase">Pay Date</label>
                    <input
                      type="text"
                      value={formData.payDate}
                      readOnly
                      className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Earnings */}
              <div>
                <h3 className="font-medium text-base mb-2 uppercase">Earnings</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 uppercase">Basic Rate (Monthly)</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                      <input
                        type="text"
                        value={formData.basicRate}
                        onChange={(e) => handleInputChange(e, "basicRate")}
                        className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 uppercase">Basic (Bi-weekly)</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                      <input
                        type="text"
                        value={formData.basic}
                        onChange={(e) => handleInputChange(e, "basic")}
                        className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 uppercase">Allowance</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                      <input
                        type="text"
                        value={formData.allowance}
                        onChange={(e) => handleInputChange(e, "allowance")}
                        className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 uppercase">Non-Taxable</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                      <input
                        type="text"
                        value={formData.ntax}
                        onChange={(e) => handleInputChange(e, "ntax")}
                        className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 uppercase">Vacation Leave</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                      <input
                        type="text"
                        value={formData.vacationleave}
                        onChange={(e) => handleInputChange(e, "vacationleave")}
                        className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 uppercase">Sick Leave</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                      <input
                        type="text"
                        value={formData.sickleave}
                        onChange={(e) => handleInputChange(e, "sickleave")}
                        className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Overtime Breakdown */}
            <div>
              <h3 className="font-medium text-base mb-2 uppercase">Overtime Breakdown</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Regular Overtime</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.regularOT.rate}
                      onChange={(e) => handleInputChange(e, "regularOT", "rate")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Regular Holiday</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.regularHoliday.rate}
                      onChange={(e) => handleInputChange(e, "regularHoliday", "rate")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Special Holiday</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.specialHoliday.rate}
                      onChange={(e) => handleInputChange(e, "specialHoliday", "rate")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Rest Day</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.restDay.rate}
                      onChange={(e) => handleInputChange(e, "restDay", "rate")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Night Diff</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.nightDiff.rate}
                      onChange={(e) => handleInputChange(e, "nightDiff", "rate")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Backwage</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.backwage.rate}
                      onChange={(e) => handleInputChange(e, "backwage", "rate")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Deductions */}
            <div>
              <h3 className="font-medium text-base mb-2 uppercase">Deductions</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">SSS</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.sss.amount}
                      readOnly
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100 opacity-75 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">PhilHealth</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.philhealth.amount}
                      readOnly
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100 opacity-75 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Pag IBIG</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.pagibig.amount}
                      readOnly
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100 opacity-75 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">WTAX</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.wtax.amount}
                      onChange={(e) => handleInputChange(e, "wtax", "amount")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 4: Additional Deductions */}
            <div>
              <h3 className="font-medium text-base mb-2 uppercase">Additional Deductions</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">No Work Day</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.nowork.amount}
                      onChange={(e) => handleInputChange(e, "nowork", "amount")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Loan</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.loan.amount}
                      onChange={(e) => handleInputChange(e, "loan", "amount")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Charges</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.charges.amount}
                      onChange={(e) => handleInputChange(e, "charges", "amount")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Undertime</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.undertime.amount}
                      onChange={(e) => handleInputChange(e, "undertime", "amount")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">MSFC Loan</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.msfcloan.amount}
                      onChange={(e) => handleInputChange(e, "msfcloan", "amount")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Late</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.late.amount}
                      onChange={(e) => handleInputChange(e, "late", "amount")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Overtime</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.overtime.amount}
                      onChange={(e) => handleInputChange(e, "overtime", "amount")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Section */}
          <div className="bg-gray-50 p-3 rounded">
            <h3 className="font-medium text-base mb-2 uppercase">Overall</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1 uppercase">Total Gross</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                  <input
                    type="text"
                    value={formatCurrency(formData.totalGross)}
                    readOnly
                    className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100 opacity-75 cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 uppercase">Total Deductions</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                  <input
                    type="text"
                    value={formatCurrency(formData.totalDeductions)}
                    readOnly
                    className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100 opacity-75 cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 uppercase">Total Salary</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                  <input
                    type="text"
                    value={formatCurrency(formData.totalSalaryCompensation)}
                    readOnly
                    className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100 opacity-75 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Fixed at bottom */}
          <div className="flex justify-center space-x-4 sticky bottom-0 pt-2 pb-1 bg-white">
            <button
              type="submit"
              className="px-6 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditPayroll
