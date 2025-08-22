"use client"
import { useEffect, useState } from "react"
import NavBar from "../components/Nav_Bar"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_BASE_URL } from "../config/api"

function AdminDashboardPage() {
  const navigate = useNavigate()
  // Default data for when API is loading
  const [payrollData, setPayrollData] = useState({
    previous_payroll: "0.00",
    previous_paydate: "Loading...",
    upcoming_payroll: "0.00",
    upcoming_paydate: "Loading..."
  })
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Add state for current user info
  const [currentUser, setCurrentUser] = useState({
    firstName: "",
    loading: true
  })

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("access_token")
        const userId = localStorage.getItem("user_id") // Assuming you store user_id in localStorage upon login

        if (!userId || !token) {
          console.error("User ID or token not found")
          return
        }

        // Fetch the current user's employment info
        const response = await fetch(`${API_BASE_URL}/employment-info/employee-number/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) throw new Error("Failed to fetch user data")

        const userData = await response.json()
        setCurrentUser({
          firstName: userData.first_name || "User",
          loading: false
        })
      } catch (err) {
        console.error("Error fetching current user:", err)
        setCurrentUser({
          firstName: "User", // Default fallback
          loading: false
        })
      }
    }

    fetchCurrentUser()
  }, [])

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("access_token")

        // Fetch total payroll
        const totalPayrollRes = await fetch(`${API_BASE_URL}/total-payroll/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!totalPayrollRes.ok) throw new Error("Failed to fetch total payroll data")
        const totalPayrollData = await totalPayrollRes.json()

        // Fetch payslips
        const payslipRes = await fetch(`${API_BASE_URL}/payslip/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!payslipRes.ok) throw new Error("Failed to fetch payslip data")
        const payslipData = await payslipRes.json()

        // Process payslips
        const processedTransactions = payslipData.map(item => ({
          id: item.id,
          name: item.payroll_id?.employment_info_id
            ? `${item.payroll_id.employment_info_id.first_name} ${item.payroll_id.employment_info_id.last_name}`
            : "Unknown",
          role: item.payroll_id?.employment_info_id?.position || "Unknown",
          date: item.payroll_id?.pay_date
            ? new Date(item.payroll_id.pay_date).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              })
            : "Unknown",
          formattedDate: item.payroll_id?.pay_date
            ? `${new Date(item.payroll_id.pay_date).toLocaleDateString('en-US', {
                month: 'short'
              })} ${new Date(item.payroll_id.pay_date).getDate()},\n${new Date(item.payroll_id.pay_date).getFullYear()}`
            : "Unknown",
          netPay: item.payroll_id?.net_pay
            ? `₱${parseFloat(item.payroll_id.net_pay).toLocaleString(undefined, {
                minimumFractionDigits: 2, maximumFractionDigits: 2
              })}`
            : "₱0.00",
          grossPay: item.payroll_id?.gross_pay
            ? `₱${parseFloat(item.payroll_id.gross_pay).toLocaleString(undefined, {
                minimumFractionDigits: 2, maximumFractionDigits: 2
              })}`
            : "₱0.00",
          totalDeductions: item.payroll_id?.total_deductions
            ? `₱${parseFloat(item.payroll_id.total_deductions).toLocaleString(undefined, {
                minimumFractionDigits: 2, maximumFractionDigits: 2
              })}`
            : "₱0.00",
          rate: item.payroll_id?.salary_id?.earnings_id?.basic_rate
            ? `₱${parseFloat(item.payroll_id.salary_id.earnings_id.basic_rate).toLocaleString(undefined, {
                minimumFractionDigits: 2, maximumFractionDigits: 2
              })}/MONTH`
            : "N/A",
          user_id: item.user_id,
          profilePicture: item.payroll_id?.employment_info_id?.profile_picture || null
        }))

        // Format payroll data
        const formattedPayrollData = totalPayrollData.length > 0
          ? {
              previous_payroll: totalPayrollData[0].previous_payroll
                ? `₱${parseFloat(totalPayrollData[0].previous_payroll).toLocaleString(undefined, {
                    minimumFractionDigits: 2, maximumFractionDigits: 2
                  })}`
                : "₱0.00",
              previous_paydate: totalPayrollData[0].previous_paydate
                ? new Date(totalPayrollData[0].previous_paydate).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })
                : "N/A",
              upcoming_payroll: totalPayrollData[0].upcoming_payroll
                ? `₱${parseFloat(totalPayrollData[0].upcoming_payroll).toLocaleString(undefined, {
                    minimumFractionDigits: 2, maximumFractionDigits: 2
                  })}`
                : "₱0.00",
              upcoming_paydate: totalPayrollData[0].upcoming_paydate
                ? new Date(totalPayrollData[0].upcoming_paydate).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })
                : "N/A"
            }
          : {
              previous_payroll: "₱0.00",
              previous_paydate: "N/A",
              upcoming_payroll: "₱0.00",
              upcoming_paydate: "N/A"
            }

        setPayrollData(formattedPayrollData)
        setTransactions(processedTransactions)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("Failed to load dashboard data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-16">
        {/* Welcome Section */}
        <div className="mb-12">
          <p className="text-2xl">Welcome,</p>
          <h1 className="text-5xl font-bold">
            {currentUser.loading ? "Loading..." : currentUser.firstName}
          </h1>
        </div>

        {/* Dashboard Grid */}
        <div className="justify-center grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transaction History */}
          <div className="lg:col-span-2">
            <div className="bg-[#5C7346] rounded-lg p-6 text-white h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Payroll Overview</h2>
                {/*
                <button className="text-sm">See All</button>
                */}
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <p>Loading transaction data...</p>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center py-8">
                  <p>{error}</p>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  {/* Column Headers - Fixed at top */}
                  <div className="grid grid-cols-12 gap-2 mb-4 px-2">
                    <div className="col-span-4 font-semibold text-base">Employee</div>
                    <div className="col-span-2 text-center font-semibold text-base">Date</div>
                    <div className="col-span-2 text-right font-semibold text-base">Gross Pay</div>
                    <div className="col-span-2 text-right font-semibold text-base">Deductions</div>
                    <div className="col-span-2 text-right font-semibold text-base">Amount</div>
                  </div>

                  {/* Scrollable Transaction List */}
                  <div className="overflow-y-auto max-h-80 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent pr-1">
                    <div className="space-y-6 px-2">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="grid grid-cols-12 gap-2 items-center text-sm">
                          {/* Profile Picture, Name and Role */}
                          <div className="col-span-4 flex items-center gap-3">
                            <div className="h-10 w-10 flex-shrink-0">
                              {transaction.profilePicture ? (
                                <img
                                  src={transaction.profilePicture}
                                  alt={transaction.name}
                                  className="rounded-full h-full w-full object-cover"
                                />
                              ) : (
                                <div className="bg-yellow-500 rounded-full h-10 w-10 flex items-center justify-center text-white">
                                  {transaction.name.split(' ').map(n => n[0]).join('')}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{transaction.name}</p>
                              <p className="text-xs opacity-80">{transaction.role}</p>
                            </div>
                          </div>

                          {/* Date */}
                          <div className="col-span-2 text-center whitespace-pre-line text-sm">
                            {transaction.formattedDate}
                          </div>

                          {/* Gross Pay */}
                          <div className="col-span-2 text-right text-sm">
                            {transaction.grossPay}
                          </div>

                          {/* Total Deductions */}
                          <div className="col-span-2 text-right text-sm">
                            {transaction.totalDeductions}
                          </div>

                          {/* Amount (Net Pay) */}
                          <div className="col-span-2 text-right flex flex-col items-end">
                            <p className="text-sm">{transaction.netPay}</p>
                            <p className="text-xs opacity-80">{transaction.rate}</p>
                          </div>
                        </div>
                      ))}

                      {transactions.length === 0 && (
                        <div className="text-center py-4">
                          <p>No transaction records found.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payroll Cards */}
          <div className="space-y-6">
            {/* Previous Payroll */}
            <div className="bg-[#A7BC8F] rounded-lg p-6 text-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium">Previous Payroll</h3>
                <p className="text-sm">{payrollData.previous_paydate}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-4xl font-bold">{payrollData.previous_payroll}</p>
              </div>
            </div>

            {/* Upcoming Payroll */}
            <div className="bg-[#A7BC8F] rounded-lg p-6 text-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium">Upcoming Payroll</h3>
                <p className="text-sm">{payrollData.upcoming_paydate}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-4xl font-bold">{payrollData.upcoming_payroll}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage