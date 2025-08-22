"use client"

import { useState } from "react"
import Calendar from "./Calendar"
import { API_BASE_URL } from "../config/api"
import dayjs from "dayjs"

function AddEmployee({ isOpen, onClose, onAdd }) {
  // Initial form state - flattened structure to match API
  const FormState = {
    employee_number: "",
    first_name: "",
    last_name: "",
    position: "",
    address: "",
    hire_date: "",
    birth_date: "",
    marital_status: "",
    other_info: "",
    profile_picture: null,
    active: true, // Always set to true for new employees
    role: "",
    email: "",
    password: "",
  }

  const [formData, setFormData] = useState(FormState)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)

  // Function to reset the form to its initial state
  const resetForm = () => {
    setFormData(FormState)
    setError("")
    setPreviewImage(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // Validate dates
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Set to beginning of day for comparison

      // Birthday validation - cannot be today or future
      const birthDate = new Date(formData.birth_date)
      if (birthDate >= today) {
        throw new Error("Birth date cannot be today or a future date")
      }

      // Hire date validation - cannot be future
      const hireDate = new Date(formData.hire_date)
      if (hireDate > today) {
        throw new Error("Hire date cannot be a future date")
      }

      // Continue with the existing code...
      const accessToken = localStorage.getItem("access_token")

      // Create FormData object for file upload
      const formDataToSend = new FormData()

      // Add all form fields to FormData
      Object.keys(formData).forEach((key) => {
        if (key === "profile_picture" && formData[key]) {
          // Handle file upload
          formDataToSend.append(key, formData[key])
        } else if (key === "employee_number") {
          // Convert employee_number to number
          formDataToSend.append(key, Number.parseInt(formData[key]))
        } else if (key === "active") {
          // Convert active to string 'true' or 'false'
          formDataToSend.append(key, String(formData[key]))
        } else if (formData[key] !== null && formData[key] !== "") {
          // Add other fields
          formDataToSend.append(key, formData[key])
        }
      })

      console.log("Submitting employee data...")

      const response = await fetch(`${API_BASE_URL}/employment-info/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          // Don't set Content-Type when using FormData, the browser will set it with the boundary
        },
        body: formDataToSend,
      })

      const responseText = await response.text()
      console.log("Response Status:", response.status)
      console.log("Raw API Response:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("Failed to parse JSON response:", e)
        throw new Error(`Server response: ${responseText}`)
      }

      if (!response.ok) {
        if (typeof data === "object") {
          const errorMessages = Object.entries(data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
            .join("\n")
          throw new Error(errorMessages)
        } else if (data.detail) {
          throw new Error(data.detail)
        } else {
          throw new Error("Failed to create employee. Please check the form and try again.")
        }
      }

      // If successful, add the employee and reset the form
      onAdd(data)
      resetForm() // Reset the form after successful submission
      onClose()
    } catch (error) {
      console.error("Error adding employee:", error)
      setError(error.message || "Failed to add employee. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, files } = e.target

    if (type === "file") {
      // Handle file upload for profile picture
      if (files && files[0]) {
        // Create a preview URL for the image
        const previewUrl = URL.createObjectURL(files[0])
        setPreviewImage(previewUrl)

        // Update form data with the file
        setFormData((prev) => ({
          ...prev,
          [name]: files[0],
        }))
      }
    } else {
      // Handle other form fields
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  // Handle date changes
  const handleDateChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Reset form when modal is closed
  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Get today's date for max date validation
  const today = dayjs().format("YYYY-MM-DD")

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Add New Employee</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded whitespace-pre-line">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">User Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-sm text-gray-700">Role*</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="employee">Employee</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700">Email*</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700">Password*</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Basic Employment Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Basic Employment Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-sm text-gray-700">Employee Number*</label>
                <input
                  type="number"
                  name="employee_number"
                  value={formData.employee_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700">First Name*</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700">Last Name*</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700">Position*</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700">Address*</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700">Hire Date*</label>
                <Calendar
                  label="Hire Date"
                  value={formData.hire_date}
                  onChange={(value) => handleDateChange("hire_date", value)}
                  disabled={false}
                  maxDate={today}
                />
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Additional Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-sm text-gray-700">Birth Date</label>
                <Calendar
                  label="Birth Date"
                  value={formData.birth_date}
                  onChange={(value) => handleDateChange("birth_date", value)}
                  disabled={false}
                  maxDate={today}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700">Marital Status</label>
                <select
                  name="marital_status"
                  value={formData.marital_status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                >
                  <option value="">Select Status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>

              {/* Removed the active toggle as requested */}

              <div className="space-y-1">
                <label className="block text-sm text-gray-700">Other Information</label>
                <textarea
                  name="other_info"
                  value={formData.other_info}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346] h-16 resize-none"
                  placeholder="Add any additional information here"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="block text-sm text-gray-700 mb-2">Profile Picture</label>
                <div className="flex flex-col items-center space-y-4">
                  {previewImage && (
                    <div className="h-24 w-24 rounded-full overflow-hidden border border-gray-300 shadow-md">
                      <img
                        src={previewImage || "/placeholder.svg"}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    name="profile_picture"
                    accept="image/*"
                    onChange={handleChange}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#5C7346] file:text-white hover:file:bg-[#4a5c38]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-[#5C7346] rounded-md hover:bg-[#4a5c38] focus:outline-none focus:ring-2 focus:ring-[#5C7346] disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddEmployee
