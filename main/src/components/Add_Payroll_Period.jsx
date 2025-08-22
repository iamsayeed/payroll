"use client"

import { useState, useEffect } from "react"
import dayjs from "dayjs"
import Calendar from "./Calendar"

const AddPayrollPeriod = ({ payrollPeriod, onSave, onDelete, onClose }) => {
  const [formData, setFormData] = useState({
    payroll_period_start: "",
    payroll_period_end: "",
  })

  // Initialize form data when a payroll period is selected
  useEffect(() => {
    if (payrollPeriod) {
      setFormData({
        payroll_period_start: payrollPeriod.payroll_period_start || "",
        payroll_period_end: payrollPeriod.payroll_period_end || "",
      })
    } else {
      // Default to empty form
      setFormData({
        payroll_period_start: "",
        payroll_period_end: "",
      })
    }
  }, [payrollPeriod])

  // Handle date change for start date
  const handleStartDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      payroll_period_start: date,
    }))
  }

  // Handle date change for end date
  const handleEndDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      payroll_period_end: date,
    }))
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate dates
    if (!formData.payroll_period_start || !formData.payroll_period_end) {
      alert("Both start and end dates are required.")
      return
    }

    // Validate that end date is after start date
    if (dayjs(formData.payroll_period_end).isBefore(dayjs(formData.payroll_period_start))) {
      alert("End date must be after start date.")
      return
    }

    onSave(formData)
  }

  // Handle payroll period deletion
  const handleDelete = () => {
    if (payrollPeriod && payrollPeriod.id) {
      onDelete(payrollPeriod.id)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-[#5C7346]">
          {payrollPeriod ? "Edit Payroll Period" : "Add Payroll Period"}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="payroll_period_start" className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <div className="relative">
            <Calendar
              value={formData.payroll_period_start}
              onChange={handleStartDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346] cursor-pointer"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="payroll_period_end" className="block text-sm font-medium text-gray-700 mb-2">
            End Date *
          </label>
          <div className="relative">
            <Calendar
              value={formData.payroll_period_end}
              onChange={handleEndDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346] cursor-pointer"
              required
            />
          </div>
        </div>

        {formData.payroll_period_start && formData.payroll_period_end && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Duration: {dayjs(formData.payroll_period_end).diff(dayjs(formData.payroll_period_start), "day") + 1} days
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200 mt-6">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
            {payrollPeriod && payrollPeriod.id ? (
              <button
                type="button"
                onClick={handleDelete}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transition-colors text-sm"
              >
                Delete Payroll Period
              </button>
            ) : (
              <div></div> // Empty div to maintain layout when no delete button
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 bg-gray-200 rounded-lg shadow-sm hover:bg-gray-300 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-[#5C7346] text-white rounded-lg shadow-sm hover:bg-[#4a5c38] transition-colors text-sm"
              >
                {payrollPeriod ? "Update Payroll Period" : "Save Payroll Period"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default AddPayrollPeriod
