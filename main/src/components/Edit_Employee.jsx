"use client"

import { useState, useEffect } from "react"
import Calendar from "./Calendar"
import dayjs from "dayjs"
import { API_BASE_URL } from "../config/api"

function EditEmployee({ isOpen, onClose, onUpdate, employeeData }) {
  // Initial form state with flattened structure
  const initialFormState = {
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
    active: true,
    resignation_date: "",
    role: "",
    email: "",
    password: "",
  }

  const [formData, setFormData] = useState(initialFormState)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [showResignationModal, setShowResignationModal] = useState(false)
  const [previousActiveState, setPreviousActiveState] = useState(true)

  // Populate form when employeeData changes
  useEffect(() => {
    if (employeeData) {
      setFormData({
        employee_number: employeeData.employee_number || "",
        first_name: employeeData.first_name || "",
        last_name: employeeData.last_name || "",
        position: employeeData.position || "",
        address: employeeData.address || "",
        hire_date: employeeData.hire_date || "",
        birth_date: employeeData.birth_date || "",
        marital_status: employeeData.marital_status || "",
        other_info: employeeData.other_info || "",
        profile_picture: null, // Will be set if user uploads a new one
        active: employeeData.active ?? true,
        resignation_date: employeeData.resignation_date || "",
        role: employeeData.user?.role || "",
        email: "", // Start empty for optional update
        password: "", // Start empty for optional update
      })

      setPreviousActiveState(employeeData.active ?? true)

      // Set profile picture preview if available
      if (employeeData.profile_picture) {
        setPreviewImage(employeeData.profile_picture)
      } else {
        setPreviewImage(null)
      }
    }
  }, [employeeData])

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // Validate dates
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Set to beginning of day for comparison

      // Birthday validation - cannot be today or future
      if (formData.birth_date) {
        const birthDate = new Date(formData.birth_date)
        if (birthDate >= today) {
          throw new Error("Birth date cannot be today or a future date")
        }
      }

      // Hire date validation - cannot be future
      if (formData.hire_date) {
        const hireDate = new Date(formData.hire_date)
        if (hireDate > today) {
          throw new Error("Hire date cannot be a future date")
        }
      }

      // For resignation, we use a different approach
      if (!formData.active && formData.resignation_date) {
        // If this is a resignation, use the dedicated function
        return submitResignationForm(formData)
      }

      // Create FormData object for file upload
      const formDataToSend = new FormData()

      // Add fields that should be updated
      if (formData.role) {
        formDataToSend.append("role", formData.role.toLowerCase())
      }
      if (formData.email.trim()) {
        formDataToSend.append("email", formData.email)
      }
      if (formData.password.trim()) {
        formDataToSend.append("password", formData.password)
      }

      // Add employment info data
      formDataToSend.append("first_name", formData.first_name)
      formDataToSend.append("last_name", formData.last_name)
      formDataToSend.append("position", formData.position)
      formDataToSend.append("address", formData.address)
      formDataToSend.append("active", String(formData.active))

      // Add resignation date if employee is inactive
      if (!formData.active && formData.resignation_date) {
        formDataToSend.append("resignation_date", formData.resignation_date)
      }

      // Add new fields
      if (formData.birth_date) {
        formDataToSend.append("birth_date", formData.birth_date)
      }
      if (formData.marital_status) {
        formDataToSend.append("marital_status", formData.marital_status)
      }
      if (formData.other_info) {
        formDataToSend.append("other_info", formData.other_info)
      }
      if (formData.profile_picture) {
        formDataToSend.append("profile_picture", formData.profile_picture)
      }

      console.log("Update Request Payload:", Object.fromEntries(formDataToSend))

      const accessToken = localStorage.getItem("access_token")

      const response = await fetch(`${API_BASE_URL}/employment-info/${employeeData.id}/`, {
        method: "PATCH",
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
          throw new Error("Failed to update employee. Please check the form and try again.")
        }
      }

      // If successful, update the employee data
      onUpdate(data)
      onClose()
    } catch (error) {
      console.error("Error updating employee:", error)
      setError(error.message || "Failed to update employee. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target

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
    } else if (type === "checkbox") {
      // Handle checkbox for active status
      if (name === "active" && previousActiveState && !checked) {
        // If changing from active to inactive, show resignation modal
        setShowResignationModal(true)
      } else {
        // For other checkboxes or when changing from inactive to active
        setFormData((prev) => ({
          ...prev,
          [name]: checked,
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

  // Handle resignation cancel
  const handleResignationCancel = () => {
    setShowResignationModal(false)
    setFormData((prev) => ({
      ...prev,
      active: true,
      resignation_date: "",
    }))
  }

  // Handle resignation confirm
  const handleResignationConfirm = () => {
    if (!formData.resignation_date) {
      setError("Resignation date is required")
      return
    }

    // Update form data with inactive status
    const updatedFormData = {
      ...formData,
      active: false,
    }

    setFormData(updatedFormData)
    setShowResignationModal(false)

    // Submit the form with the updated data
    submitResignationForm(updatedFormData)
  }

  // New function to handle resignation form submission
  const submitResignationForm = async (data) => {
    setIsSubmitting(true)
    setError("")

    try {
      const accessToken = localStorage.getItem("access_token")

      // Create a simple object with just the necessary fields for resignation
      const resignationData = {
        active: false,
        resignation_date: data.resignation_date,
      }

      console.log("Submitting resignation data:", resignationData)

      // Use a direct JSON request instead of FormData for this specific update
      const response = await fetch(`${API_BASE_URL}/employment-info/${employeeData.id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resignationData),
      })

      const responseData = await response.json()
      console.log("Resignation response:", responseData)

      if (!response.ok) {
        throw new Error(responseData.detail || "Failed to update resignation status")
      }

      // Update the employee data with the response
      onUpdate({
        ...employeeData,
        ...responseData,
      })

      onClose()
    } catch (error) {
      console.error("Error updating resignation status:", error)
      setError(error.message || "Failed to update resignation status")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get today's date for max date validation
  const today = dayjs().format("YYYY-MM-DD")

  if (!isOpen || !employeeData) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Edit Employee Information</h2>

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
                <label className="block text-sm text-gray-700">New Email (Optional)</label>
                <div className="space-y-1">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                    placeholder="Leave blank to keep current email"
                  />
                  <p className="text-sm text-gray-500">Current: {employeeData.user?.email}</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700">New Password (Optional)</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                  placeholder="Leave blank to keep current password"
                />
              </div>
            </div>
          </div>

          {/* Basic Employment Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Basic Employment Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-sm text-gray-700">Employee Number</label>
                <input
                  type="text"
                  value={formData.employee_number}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  disabled
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
                <label className="block text-sm text-gray-700">Hire Date</label>
                <Calendar
                  label="Hire Date"
                  value={formData.hire_date}
                  onChange={(value) => handleDateChange("hire_date", value)}
                  disabled={true}
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
                  maxDate={today}
                  disabled={true} // Make birth date non-editable
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

              <div className="space-y-1">
                <label className="block text-sm text-gray-700 mb-1">Employee Status</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#5C7346] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5C7346]"></div>
                  <span className="ms-3 text-sm font-medium text-gray-700">
                    {formData.active ? "Active" : "Inactive"}
                  </span>
                </label>
              </div>

              {!formData.active && (
                <div className="space-y-1">
                  <label className="block text-sm text-gray-700">Resignation Date</label>
                  <Calendar
                    label="Resignation Date"
                    value={formData.resignation_date}
                    onChange={(value) => handleDateChange("resignation_date", value)}
                    maxDate={today}
                  />
                </div>
              )}

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
                  <p className="text-xs text-gray-500 mt-1">Leave empty to keep current picture</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-[#5C7346] rounded-md hover:bg-[#4a5c38] focus:outline-none focus:ring-2 focus:ring-[#5C7346] disabled:opacity-50"
              disabled={isSubmitting || (showResignationModal && !formData.resignation_date)}
            >
              {isSubmitting ? "Updating..." : "Update Employee"}
            </button>
          </div>
        </form>
      </div>

      {/* Resignation Confirmation Modal */}
      {showResignationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Confirm Employee Resignation</h3>
            <p className="mb-4">You are about to mark this employee as inactive. Please enter the resignation date:</p>

            <div className="mb-6">
              <label className="block text-sm text-gray-700">Resignation Date</label>
              <Calendar
                label="Resignation Date"
                value={formData.resignation_date}
                onChange={(value) => handleDateChange("resignation_date", value)}
                maxDate={today}
                required
              />
              {!formData.resignation_date && <p className="text-red-500 text-sm mt-1">Resignation date is required</p>}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleResignationCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleResignationConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={!formData.resignation_date}
              >
                Confirm Resignation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditEmployee
