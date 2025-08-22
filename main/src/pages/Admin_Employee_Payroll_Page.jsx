"use client"

import { useState, useEffect } from "react"
import NavBar from "../components/Nav_Bar.jsx"
import EditPayroll from "../components/Edit_Payroll.jsx"
import { API_BASE_URL } from "../config/api"
import { useNavigate } from "react-router-dom"

function AdminEmployeePayrollPage() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [payrollData, setPayrollData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const recordsPerPage = 5
  const [yearFilter, setYearFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")

  // Fetch payroll data from API
  const fetchPayrollData = async () => {
    try {
      setLoading(true)
      const accessToken = localStorage.getItem("access_token")
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }

      // Fetch employees first
      const employeeResponse = await fetch(`${API_BASE_URL}/employment-info/`, { headers })

      if (!employeeResponse.ok) {
        throw new Error("Failed to fetch employees")
      }

      const employeeData = await employeeResponse.json()
      const activeEmployees = employeeData.filter((employee) => employee.active !== false)
      setEmployees(activeEmployees)

      // Create a map to store payroll data
      const payrollMap = new Map()

      // Fetch all payroll records
      const payrollResponse = await fetch(`${API_BASE_URL}/payroll/`, { headers })

      let payrollRecords = []
      if (payrollResponse.ok) {
        payrollRecords = await payrollResponse.json()
      }

      // Fetch salary data for all employees
      const salaryResponse = await fetch(`${API_BASE_URL}/salary/`, { headers })

      let salaryRecords = []
      if (salaryResponse.ok) {
        salaryRecords = await salaryResponse.json()
      }

      // Fetch earnings data for all employees
      const earningsResponse = await fetch(`${API_BASE_URL}/earnings/`, { headers })

      if (earningsResponse.ok) {
        const earningsData = await earningsResponse.json()

        // Process earnings data
        earningsData.forEach((earning) => {
          const userId = earning.user
          if (!payrollMap.has(userId)) {
            payrollMap.set(userId, {
              userId,
              base_salary: Number.parseFloat(earning.basic_rate) || 0,
              earnings: earning,
            })
          } else {
            payrollMap.get(userId).base_salary = Number.parseFloat(earning.basic_rate) || 0
            payrollMap.get(userId).earnings = earning
          }
        })
      }

      // Fetch deductions data
      const deductionsResponse = await fetch(`${API_BASE_URL}/deductions/`, { headers })

      if (deductionsResponse.ok) {
        const deductionsData = await deductionsResponse.json()

        // Process deductions data
        deductionsData.forEach((deduction) => {
          const userId = deduction.user
          if (!payrollMap.has(userId)) {
            payrollMap.set(userId, {
              userId,
              deductions:
                Number.parseFloat(deduction.wtax || 0) +
                  Number.parseFloat(deduction.nowork || 0) +
                  Number.parseFloat(deduction.loan || 0) +
                  Number.parseFloat(deduction.charges || 0) +
                  Number.parseFloat(deduction.msfcloan || 0) || 0,
              deductionsData: deduction,
            })
          } else {
            const totalDeductions =
              Number.parseFloat(deduction.wtax || 0) +
                Number.parseFloat(deduction.nowork || 0) +
                Number.parseFloat(deduction.loan || 0) +
                Number.parseFloat(deduction.charges || 0) +
                Number.parseFloat(deduction.msfcloan || 0) || 0

            payrollMap.get(userId).deductions = totalDeductions
            payrollMap.get(userId).deductionsData = deduction
          }
        })
      }

      // Fetch SSS data
      const sssResponse = await fetch(`${API_BASE_URL}/benefits/sss/`, { headers })
      let sssData = []
      if (sssResponse.ok) {
        sssData = await sssResponse.json()

        // Process SSS data
        sssData.forEach((sss) => {
          const userId = sss.user
          if (payrollMap.has(userId)) {
            payrollMap.get(userId).sssData = sss

            // Add SSS contribution to deductions if not already included
            if (payrollMap.get(userId).deductions !== undefined) {
              payrollMap.get(userId).deductions += Number.parseFloat(sss.employee_share || 0)
            }
          } else {
            payrollMap.set(userId, {
              userId,
              sssData: sss,
              deductions: Number.parseFloat(sss.employee_share || 0),
            })
          }
        })
      }

      // Fetch PhilHealth data
      const philhealthResponse = await fetch(`${API_BASE_URL}/benefits/philhealth/`, { headers })
      let philhealthData = []
      if (philhealthResponse.ok) {
        philhealthData = await philhealthResponse.json()

        // Process PhilHealth data
        philhealthData.forEach((philhealth) => {
          const userId = philhealth.user
          if (payrollMap.has(userId)) {
            payrollMap.get(userId).philhealthData = philhealth

            // Add PhilHealth contribution to deductions if not already included
            if (payrollMap.get(userId).deductions !== undefined) {
              payrollMap.get(userId).deductions += Number.parseFloat(philhealth.total_contribution || 0)
            }
          } else {
            payrollMap.set(userId, {
              userId,
              philhealthData: philhealth,
              deductions: Number.parseFloat(philhealth.total_contribution || 0),
            })
          }
        })
      }

      // Fetch Pag-IBIG data
      const pagibigResponse = await fetch(`${API_BASE_URL}/benefits/pagibig/`, { headers })
      let pagibigData = []
      if (pagibigResponse.ok) {
        pagibigData = await pagibigResponse.json()

        // Process Pag-IBIG data
        pagibigData.forEach((pagibig) => {
          const userId = pagibig.user
          if (payrollMap.has(userId)) {
            payrollMap.get(userId).pagibigData = pagibig

            // Add Pag-IBIG contribution to deductions if not already included
            if (payrollMap.get(userId).deductions !== undefined) {
              payrollMap.get(userId).deductions += Number.parseFloat(pagibig.employee_share || 0)
            }
          } else {
            payrollMap.set(userId, {
              userId,
              pagibigData: pagibig,
              deductions: Number.parseFloat(pagibig.employee_share || 0),
            })
          }
        })
      }

      // Fetch total overtime data
      const overtimeResponse = await fetch(`${API_BASE_URL}/totalovertime/`, { headers })

      if (overtimeResponse.ok) {
        const overtimeData = await overtimeResponse.json()

        // Process overtime data
        overtimeData.forEach((overtime) => {
          const userId = overtime.user
          if (payrollMap.has(userId)) {
            const payrollEntry = payrollMap.get(userId)

            // Add overtime to base salary for gross calculation
            const overtimeTotal = Number.parseFloat(overtime.total_overtime) || 0
            payrollEntry.overtimeTotal = overtimeTotal
            payrollEntry.overtimeData = overtime
          }
        })
      }

      // Convert payroll map to array and match with employees
      const payrollData = []

      activeEmployees.forEach((employee) => {
        const userId = employee.user?.id

        if (userId) {
          // Find payroll record for this user
          const userPayroll = payrollRecords.find((record) => record.user_id === userId)

          // Find salary record for this user
          const userSalary = salaryRecords.find((record) => record.user === userId)

          if (userPayroll) {
            // Employee has payroll data from the API
            payrollData.push({
              id: employee.id,
              employee_id: employee.employee_number,
              employee_name: `${employee.first_name} ${employee.last_name}`,
              position: employee.position || "Staff",
              base_salary: Number.parseFloat(userPayroll.gross_pay) || 0,
              deductions: Number.parseFloat(userPayroll.total_deductions) || 0,
              net_salary: Number.parseFloat(userPayroll.net_pay) || 0,
              status: userPayroll.status || "Pending",
              rate_per_month: userSalary ? userSalary.rate_per_month : "0",
              user: employee.user,
              // Store the raw data for editing
              payrollRecord: userPayroll,
              salaryRecord: userSalary,
              earnings: payrollMap.get(userId)?.earnings,
              deductionsData: payrollMap.get(userId)?.deductionsData,
              overtimeData: payrollMap.get(userId)?.overtimeData,
              sssData: payrollMap.get(userId)?.sssData,
              philhealthData: payrollMap.get(userId)?.philhealthData,
              pagibigData: payrollMap.get(userId)?.pagibigData,
            })
          } else if (payrollMap.has(userId)) {
            // Employee has data in our map but no payroll record
            const payrollInfo = payrollMap.get(userId)
            const grossSalary = (payrollInfo.base_salary || 0) + (payrollInfo.overtimeTotal || 0)
            const deductions = payrollInfo.deductions || 0
            const netSalary = grossSalary - deductions

            payrollData.push({
              id: employee.id,
              employee_id: employee.employee_number,
              employee_name: `${employee.first_name} ${employee.last_name}`,
              position: employee.position || "Staff",
              base_salary: grossSalary,
              deductions: deductions,
              net_salary: netSalary,
              status: "Pending", // Default status
              rate_per_month: payrollInfo.base_salary?.toString() || "0",
              user: employee.user,
              // Store the raw data for editing
              earnings: payrollInfo.earnings,
              deductionsData: payrollInfo.deductionsData,
              overtimeData: payrollInfo.overtimeData,
              sssData: payrollInfo.sssData,
              philhealthData: payrollInfo.philhealthData,
              pagibigData: payrollInfo.pagibigData,
            })
          } else {
            // Employee has no payroll data - use zeros
            payrollData.push({
              id: employee.id,
              employee_id: employee.employee_number,
              employee_name: `${employee.first_name} ${employee.last_name}`,
              position: employee.position || "Staff",
              base_salary: 0,
              allowances: 0,
              deductions: 0,
              net_salary: 0,
              status: "Pending", // Default status
              rate_per_month: "0",
              user: employee.user,
            })
          }
        }
      })

      setPayrollData(payrollData)
      console.log("Payroll data loaded:", payrollData)
    } catch (error) {
      console.error("Error fetching payroll data:", error)
      setError("An error occurred while fetching payroll data. Please try again later.")

      // Fall back to zeros for all employees if API fails
      if (employees.length > 0) {
        const zeroPayroll = employees.map((employee) => ({
          id: employee.id,
          employee_id: employee.employee_number,
          employee_name: `${employee.first_name} ${employee.last_name}`,
          position: employee.position || "Staff",
          base_salary: 0,
          allowances: 0,
          deductions: 0,
          net_salary: 0,
          status: "Pending", // Default status
          rate_per_month: "0",
          user: employee.user,
        }))
        setPayrollData(zeroPayroll)
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchPayrollData()
  }, [])

  // Handle edit payroll - open modal with employee data
  const handleEditPayroll = (employeeId) => {
    const employee = payrollData.find((emp) => emp.id === employeeId)
    if (employee) {
      // Find the original employee data to get the user ID
      const originalEmployee = employees.find((emp) => emp.id === employeeId)

      // Combine the payroll data with the user ID from the original employee data
      const employeeWithUserId = {
        ...employee,
        user: originalEmployee?.user || null,
      }

      setSelectedEmployee(employeeWithUserId)
      setIsEditModalOpen(true)
    }
  }

  // NEW: Add Payslip Button Handler
  const handleGoToPayslip = (UserId) => {
    navigate(`/admin-payslip/${UserId}`)
  }

  // Updated delete payroll function to completely delete records
  const handleDeletePayroll = async (employeeId, userId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this employee's payroll information? This action cannot be undone.",
      )
    ) {
      return
    }

    try {
      const accessToken = localStorage.getItem("access_token")
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }

      // Find employee record to get all associated IDs
      const employee = payrollData.find((emp) => emp.id === employeeId)

      if (!employee || !employee.user?.id) {
        alert("Cannot find employee data")
        return
      }

      // We'll collect all deletion promises to execute them together
      const deletionPromises = []

      // Delete payroll record if it exists
      if (employee.payrollRecord && employee.payrollRecord.id) {
        deletionPromises.push(
          fetch(`${API_BASE_URL}/payroll/${employee.payrollRecord.id}/`, {
            method: "DELETE",
            headers,
          }),
        )
      }

      // Delete earnings record if it exists
      if (employee.earnings && employee.earnings.id) {
        deletionPromises.push(
          fetch(`${API_BASE_URL}/earnings/${employee.earnings.id}/`, {
            method: "DELETE",
            headers,
          }),
        )
      }

      // Delete deductions record if it exists
      if (employee.deductionsData && employee.deductionsData.id) {
        deletionPromises.push(
          fetch(`${API_BASE_URL}/deductions/${employee.deductionsData.id}/`, {
            method: "DELETE",
            headers,
          }),
        )
      }

      // Delete overtime record if it exists
      if (employee.overtimeData && employee.overtimeData.id) {
        deletionPromises.push(
          fetch(`${API_BASE_URL}/totalovertime/${employee.overtimeData.id}/`, {
            method: "DELETE",
            headers,
          }),
        )
      }

      // Delete salary record if it exists
      if (employee.salaryRecord && employee.salaryRecord.id) {
        deletionPromises.push(
          fetch(`${API_BASE_URL}/salary/${employee.salaryRecord.id}/`, {
            method: "DELETE",
            headers,
          }),
        )
      }

      // Delete SSS record if it exists
      if (employee.sssData && employee.sssData.id) {
        deletionPromises.push(
          fetch(`${API_BASE_URL}/benefits/sss/${employee.sssData.id}/`, {
            method: "DELETE",
            headers,
          }),
        )
      }

      // Delete PhilHealth record if it exists
      if (employee.philhealthData && employee.philhealthData.id) {
        deletionPromises.push(
          fetch(`${API_BASE_URL}/benefits/philhealth/${employee.philhealthData.id}/`, {
            method: "DELETE",
            headers,
          }),
        )
      }

      // Delete Pag-IBIG record if it exists
      if (employee.pagibigData && employee.pagibigData.id) {
        deletionPromises.push(
          fetch(`${API_BASE_URL}/benefits/pagibig/${employee.pagibigData.id}/`, {
            method: "DELETE",
            headers,
          }),
        )
      }

      // Execute all deletion requests
      const results = await Promise.allSettled(deletionPromises)

      // Check if any deletions failed
      const failedDeletes = results.filter((r) => r.status === "rejected")
      if (failedDeletes.length > 0) {
        console.error("Some deletions failed:", failedDeletes)
        alert("Some payroll data could not be deleted. Please try again.")
      } else {
        alert("Payroll information deleted successfully")

        // Update UI by removing deleted data
        setPayrollData((prevData) =>
          prevData.map((emp) => {
            if (emp.id === employeeId) {
              return {
                ...emp,
                base_salary: 0,
                deductions: 0,
                net_salary: 0,
                status: "Pending",
                payrollRecord: null,
                salaryRecord: null,
                earnings: null,
                deductionsData: null,
                overtimeData: null,
                sssData: null,
                philhealthData: null,
                pagibigData: null,
              }
            }
            return emp
          }),
        )
      }

      // Refresh data after a short delay
      setTimeout(() => {
        fetchPayrollData()
      }, 1000)
    } catch (error) {
      console.error("Error deleting payroll:", error)
      alert(`Failed to delete payroll: ${error.message}`)
    }
  }

  // Handle marking payroll as paid
  const handleMarkAsPaid = async (employeeId, userId) => {
    try {
      const accessToken = localStorage.getItem("access_token")

      // Find the payroll record for this user
      const employee = payrollData.find((emp) => emp.id === employeeId)
      if (!employee || !employee.payrollRecord || !employee.payrollRecord.id) {
        alert("No payroll record found for this employee")
        return
      }

      // Update the payroll status to "Paid"
      const payrollResponse = await fetch(`${API_BASE_URL}/payroll/${employee.payrollRecord.id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "Paid" }),
      })

      if (!payrollResponse.ok) {
        throw new Error(`Failed to update payroll status: ${payrollResponse.status} ${payrollResponse.statusText}`)
      }

      // Update the UI to reflect the change
      setPayrollData((prevData) =>
        prevData.map((emp) => {
          if (emp.id === employeeId) {
            return {
              ...emp,
              status: "Paid",
            }
          }
          return emp
        }),
      )

      alert("Payment has been marked as sent to the employee")
    } catch (error) {
      console.error("Error marking payroll as paid:", error)
      alert(`Failed to mark payroll as paid: ${error.message}`)
    }
  }

  // Handle payroll update
  const handlePayrollUpdate = (updatedData) => {
    console.log("Updating payroll data with:", updatedData)

    if (selectedEmployee) {
      // Parse values to ensure they're numbers
      const totalGross = Number.parseFloat(updatedData.totalGross)
      const totalDeductions = Number.parseFloat(updatedData.totalDeductions)
      const totalSalaryCompensation = Number.parseFloat(updatedData.totalSalaryCompensation)

      console.log("Parsed values:", {
        totalGross,
        totalDeductions,
        totalSalaryCompensation,
      })

      // Update the payroll data in the state directly
      const updatedPayrollData = payrollData.map((emp) => {
        if (emp.id === selectedEmployee.id) {
          return {
            ...emp,
            base_salary: totalGross,
            deductions: totalDeductions,
            net_salary: totalSalaryCompensation,
            status: "Processing", // Change status after update
          }
        }
        return emp
      })

      setPayrollData(updatedPayrollData)
      setIsEditModalOpen(false)
      setSelectedEmployee(null)
    }
  }

  // Improved search function that checks multiple fields
  const filteredPayrollData = payrollData
    .filter((record) => {
      if (!searchTerm) return true

      const searchLower = searchTerm.toLowerCase()

      // Check multiple fields for the search term
      return (
        // Check employee name
        record.employee_name?.toLowerCase().includes(searchLower) ||
        // Check employee ID
        record.employee_id
          ?.toString()
          .includes(searchLower) ||
        // Check position
        record.position
          ?.toLowerCase()
          .includes(searchLower) ||
        // Check status
        record.status
          ?.toLowerCase()
          .includes(searchLower) ||
        // Check salary amounts (as formatted currency)
        formatCurrency(record.base_salary)
          .toLowerCase()
          .includes(searchLower) ||
        formatCurrency(record.net_salary).toLowerCase().includes(searchLower) ||
        // Check if searching for specific amounts without currency symbol
        record.base_salary
          ?.toString()
          .includes(searchTerm) ||
        record.net_salary?.toString().includes(searchTerm) ||
        record.deductions?.toString().includes(searchTerm)
      )
    })
    .filter((record) => {
      // Apply year filter if set
      if (yearFilter === "all") return true

      // Get year from hire_date if available in the employee data
      const employee = employees.find((emp) => emp.id === record.id)
      const yearEmployed = employee?.hire_date ? new Date(employee.hire_date).getFullYear() : null
      return yearEmployed && yearEmployed.toString() === yearFilter
    })
    .filter((record) => {
      // Apply role filter if set
      if (roleFilter === "all") return true

      return (
        (roleFilter === "owner" && !record.user) ||
        (record.user && record.user.role && record.user.role.toLowerCase() === roleFilter.toLowerCase())
      )
    })

  // Sort by employee ID in descending order (assuming higher ID = newer employee)
  const sortedPayrollData = [...filteredPayrollData].sort((a, b) => {
    // Convert to numbers and sort in descending order
    return Number.parseInt(b.employee_id) - Number.parseInt(a.employee_id)
  })

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = sortedPayrollData.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(sortedPayrollData.length / recordsPerPage)

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  // Format currency
  const formatCurrency = (amount) => {
    const PHP = new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount)
    return PHP
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-500"
      case "processing":
        return "bg-yellow-500"
      case "pending":
        return "bg-blue-500"
      case "rejected":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container mx-auto px-4 pt-24">
        <div className="bg-[#A7BC8F] rounded-lg p-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-2xl font-semibold text-white">Employee Payroll</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="search"
                  placeholder="Search by name, ID, position, amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346] w-full sm:w-auto"
                />
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346] bg-white"
                >
                  <option value="all">All Years</option>
                  {[...new Set(employees.map((e) => (e.hire_date ? new Date(e.hire_date).getFullYear() : null)))]
                    .filter((year) => year !== null)
                    .sort((a, b) => b - a)
                    .map((year) => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    ))}
                </select>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346] bg-white"
                >
                  <option value="all">All Roles</option>
                  {["owner", "admin", "employee"].map((role) => (
                    <option key={role} value={role.toLowerCase()}>
                      {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-white border-b border-white/20 whitespace-nowrap">
                  <th className="py-3 px-4 w-[10%]">ID</th>
                  <th className="py-3 px-4 w-[30%]">NAME</th>
                  <th className="py-3 px-4 w-[15%]">POSITION</th>
                  <th className="py-3 px-4 w-[12%]">GROSS SALARY</th>
                  <th className="py-3 px-4 w-[12%]">NET SALARY</th>
                  <th className="py-3 px-4 w-[10%]">STATUS</th>
                  <th className="py-3 px-4 w-[15%]">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {currentRecords.length > 0 ? (
                  currentRecords.map((record) => (
                    <tr key={record.id} className="border-b border-white/10">
                      <td className="py-3 px-4">{record.employee_id}</td>
                      <td className="py-3 px-4">{record.employee_name}</td>
                      <td className="py-3 px-4">{record.position}</td>
                      <td className="py-3 px-4">{formatCurrency(record.base_salary)}</td>
                      <td className="py-3 px-4">{formatCurrency(record.net_salary)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-4 py-1 rounded-full font-medium whitespace-nowrap ${getStatusColor(record.status)}`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditPayroll(record.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md transition-colors text-md md:text-lg"
                          >
                            Edit
                          </button>

                          {/*
                          {record.status === "Processing" && (
                            <button
                              onClick={() => handleMarkAsPaid(record.id, record.user?.id)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md transition-colors text-md md:text-lg"
                            >
                              Pay
                            </button>

                          )}
                          */}
                          <button
                            onClick={() => handleGoToPayslip(record.user?.id)}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-md transition-colors text-md md:text-lg"
                          >
                            Payslip
                          </button>
                          <button
                            onClick={() => handleDeletePayroll(record.id, record.user?.id)}
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
                      No payroll records found
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

          {/* Footer Section */}
          <div className="flex justify-between items-center mt-4">
            <div>
              <p className="text-white">
                Showing {currentRecords.length} of {sortedPayrollData.length} employees
              </p>
            </div>
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
              <button className="bg-white text-[#5C7346] px-4 py-2 rounded-md">
                {currentPage} of {totalPages || 1}
              </button>
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

      {/* Edit Payroll Modal */}
      <EditPayroll
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedEmployee(null)
        }}
        employeeData={selectedEmployee}
        onUpdate={handlePayrollUpdate}
      />
    </div>
  )
}

export default AdminEmployeePayrollPage
