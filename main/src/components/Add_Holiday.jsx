"use client"

import { useState, useEffect } from "react"
import dayjs from "dayjs"

const AddHoliday = ({ selectedDate, holiday, onSave, onDelete, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    holiday_type: "regular",
    description: "",
  })

  // Initialize form data when a holiday is selected or date changes
  useEffect(() => {
    if (holiday) {
      setFormData({
        name: holiday.name || "",
        date: holiday.date || "",
        holiday_type: holiday.holiday_type || "regular",
        description: holiday.description || "",
      })
    } else if (selectedDate) {
      setFormData({
        ...formData,
        date: dayjs(selectedDate).format("YYYY-MM-DD"),
      })
    }
  }, [holiday, selectedDate])

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  // Handle holiday deletion
  const handleDelete = () => {
    if (holiday && holiday.id) {
      onDelete(holiday.id)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-[#5C7346]">{holiday ? "Edit Holiday" : "Add Holiday"}</h2>
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
        <div className="bg-gray-50 p-4 rounded-lg mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Selected Date</label>
          <div className="text-lg font-medium">{dayjs(formData.date).format("MMMM D, YYYY")}</div>
          <input type="hidden" name="date" value={formData.date} />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Holiday Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#5C7346] focus:border-[#5C7346] transition-colors"
            placeholder="Enter holiday name"
          />
        </div>

        <div>
          <label htmlFor="holiday_type" className="block text-sm font-medium text-gray-700 mb-2">
            Holiday Type *
          </label>
          <select
            id="holiday_type"
            name="holiday_type"
            required
            value={formData.holiday_type}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#5C7346] focus:border-[#5C7346] transition-colors"
          >
            <option value="regular">Regular Holiday</option>
            <option value="special">Special Holiday</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[#5C7346] focus:border-[#5C7346] transition-colors"
            placeholder="Enter holiday description (optional)"
          ></textarea>
        </div>

        <div className="pt-4 border-t border-gray-200 mt-6">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
            {holiday && holiday.id ? (
              <button
                type="button"
                onClick={handleDelete}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transition-colors text-sm"
              >
                Delete Holiday
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
                {holiday ? "Update Holiday" : "Save Holiday"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default AddHoliday

