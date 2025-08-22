"use client"

import { useState, useEffect } from "react"
import NavBar from "../components/Nav_Bar"
import { API_BASE_URL } from "../config/api"

function ActivityLogPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [moduleFilter, setModuleFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteResult, setDeleteResult] = useState(null)
  const [selectedObject, setSelectedObject] = useState(null)
  const [objectModalOpen, setObjectModalOpen] = useState(false)
  // Pagination state
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Filter options state - separate from current data
  const [allModules, setAllModules] = useState([])
  const [allActionTypes, setAllActionTypes] = useState([])
  const [allDates, setAllDates] = useState([])

  // Fetch all available filter options
  // Replace the fetchFilterOptions function with this:

const fetchFilterOptions = async () => {
  try {
    const accessToken = localStorage.getItem("access_token")

    // Try to fetch all logs with a large page size to get all possible filter values
    const response = await fetch(`${API_BASE_URL}/activity-log/?page=1&page_size=1000`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      const data = await response.json()
      const allLogItems = data.results || data

      // Extract unique values for each filter
      const uniqueModules = [...new Set(allLogItems.map(log => log.module))].filter(Boolean).sort()
      setAllModules(uniqueModules)

      const uniqueTypes = [...new Set(allLogItems.map(log => log.type))].filter(Boolean).sort()
      setAllActionTypes(uniqueTypes)

      const uniqueDates = [...new Set(allLogItems.map(log => {
        if (!log.datetime) return null
        const date = new Date(log.datetime)
        return date.toISOString().split('T')[0]
      }))].filter(Boolean).sort((a, b) => new Date(b) - new Date(a)) // Sort newest first

      setAllDates(uniqueDates)
    }
  } catch (error) {
    console.error("Error fetching filter options:", error)
    // If the large request fails, just use the current page data for filters
    // This is a fallback to ensure something shows in the dropdowns
    const uniqueModules = [...new Set(logs.map(log => log.module))].filter(Boolean).sort()
    setAllModules(uniqueModules)

    const uniqueTypes = [...new Set(logs.map(log => log.type))].filter(Boolean).sort()
    setAllActionTypes(uniqueTypes)

    const uniqueDates = [...new Set(logs.map(log => {
      if (!log.datetime) return null
      const date = new Date(log.datetime)
      return date.toISOString().split('T')[0]
    }))].filter(Boolean).sort((a, b) => new Date(b) - new Date(a))

    setAllDates(uniqueDates)
  }
}

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)

    try {
      const accessToken = localStorage.getItem("access_token")

      // Include pagination parameters
      let url = `${API_BASE_URL}/activity-log/?page=${currentPage}&page_size=${pageSize}`

      // Add filters if selected
      if (moduleFilter !== "all") {
        url += `&model_name=${moduleFilter}`
      }

      if (typeFilter !== "all") {
        url += `&event_type=${typeFilter === "CREATE" ? 1 : typeFilter === "UPDATE" ? 2 : typeFilter === "DELETE" ? 3 : ""}`
      }

      // Date filtering would need to be implemented in the backend filter
      if (dateFilter !== "all") {
        // Format date for API if needed
        url += `&date=${dateFilter}`
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      console.log("Fetched activity logs:", data)

      if (response.ok) {
        // Handle paginated response format
        if (data.results && Array.isArray(data.results)) {
          setLogs(data.results)
          setTotalItems(data.count || 0)
          setTotalPages(Math.ceil((data.count || 0) / pageSize))
        } else if (Array.isArray(data)) {
          // Fallback for non-paginated response
          setLogs(data)
          setTotalItems(data.length)
          setTotalPages(Math.ceil(data.length / pageSize))
        } else {
          console.error("Unexpected data format", data)
          setError("Unexpected data format received from the server.")
        }
      } else {
        setError(data.message || "Failed to fetch activity logs. Please try again.")
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error)
      setError("An error occurred while fetching activity logs. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const deleteLogsByDate = async (date) => {
    if (!date || date === "all") {
      return
    }

    setIsDeleting(true)
    setDeleteResult({
      success: true,
      message: "Deleting..."
    })

    try {
      const accessToken = localStorage.getItem("access_token")
      await fetch(`${API_BASE_URL}/activity-log/delete_by_date/?date=${date}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      // Close the confirmation modal
      setDeleteConfirmOpen(false)

      // Reset filters back to "all" when logs are deleted
      setDateFilter("all")
      setCurrentPage(1)

      // Refresh logs after deletion
      await fetchLogs()
      // Also refresh filter options as some may no longer exist
      await fetchFilterOptions()
    } catch (error) {
      console.error("Error deleting logs:", error)
    } finally {
      setIsDeleting(false)
      setDeleteConfirmOpen(false)
      // Clear notification after deletion completes
      setDeleteResult(null)
    }
  }

  useEffect(() => {
    // Fetch filter options on component mount
    fetchFilterOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, moduleFilter, typeFilter, dateFilter])

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Filter logs based on search term (local filtering for search only)
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;

    // Search in user email, module, and type
    const userEmail = log.user?.email?.toLowerCase() || ""
    const module = log.module?.toLowerCase() || ""
    const type = log.type?.toLowerCase() || ""
    return userEmail.includes(searchTerm.toLowerCase()) ||
           module.includes(searchTerm.toLowerCase()) ||
           type.includes(searchTerm.toLowerCase()) ||
           String(log.id).includes(searchTerm)
  })

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  // Function to format changes for display
  const formatChanges = (changes) => {
    if (!changes) return "No changes recorded"

    return Object.entries(changes).map(([key, [oldValue, newValue]]) => {
      return `${key}: ${oldValue || "None"} → ${newValue || "None"}`
    }).join(", ")
  }

  // Function to handle refresh button click
  const handleRefresh = () => {
    fetchLogs()
    fetchFilterOptions() // Also refresh filter options
  }

  // Function to handle search (debounced)
  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    // Reset to first page when searching
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }

  // Function to open object modal
  const openObjectModal = (object) => {
    setSelectedObject(object)
    setObjectModalOpen(true)
  }

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value)
    setPageSize(newSize)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  if (loading && logs.length === 0) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container mx-auto px-4 pt-16">
        <div className="bg-[#A7BC8F] rounded-lg p-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <h2 className="text-2xl font-semibold text-white mr-4">Activity Log</h2>
              <button
                onClick={handleRefresh}
                className="bg-[#5C7346] text-white px-3 py-2 rounded-md hover:bg-[#4a5c38] transition-colors"
              >
                Refresh
              </button>
            </div>

            {/* Search Input */}
            <div>
              <input
                type="search"
                placeholder="Search by email, module, action..."
                value={searchTerm}
                onChange={handleSearch}
                className="px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346] w-64"
              />
            </div>
          </div>

          {/* Notification for delete operations */}
          {deleteResult && (
            <div className={`mb-4 p-3 rounded-md ${deleteResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {deleteResult.message}
            </div>
          )}

          {/* Filters */}
          <div className="flex space-x-2 mb-6">
            <select
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value)
                setCurrentPage(1) // Reset to first page when changing filter
              }}
              className="px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346] bg-white"
            >
              <option value="all">All Modules</option>
              {allModules.map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setCurrentPage(1) // Reset to first page when changing filter
              }}
              className="px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346] bg-white"
            >
              <option value="all">All Actions</option>
              {allActionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value)
                setCurrentPage(1) // Reset to first page when changing filter
              }}
              className="px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346] bg-white"
            >
              <option value="all">All Dates</option>
              {allDates.map(date => (
                <option key={date} value={date}>
                  {formatDate(date)}
                </option>
              ))}
            </select>

            <button
              onClick={() => dateFilter !== "all" ? setDeleteConfirmOpen(true) : null}
              disabled={dateFilter === "all" || isDeleting}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete
            </button>
          </div>

          {/* Loading indicator for filter changes */}
          {loading && logs.length > 0 && (
            <div className="mb-4 p-2 text-center text-white bg-[#5C7346] bg-opacity-50 rounded-md">
              Loading...
            </div>
          )}

          {/* Activity Log Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-white border-b border-white/20">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">MODULE</th>
                  <th className="py-3 px-4">ACTION</th>
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4">TIME</th>
                  <th className="py-3 px-4">USER</th>
                  <th className="py-3 px-4">CHANGES</th>
                  <th className="py-3 px-4">DETAILS</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-white/10">
                    <td className="py-3 px-4">
                      {log.id}
                    </td>
                    <td className="py-3 px-4">
                      {log.module}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full font-medium ${
                        log.type === 'CREATE' ? 'bg-green-100 text-green-800' :
                        log.type === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                        log.type === 'DELETE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {formatDate(log.datetime)}
                    </td>
                    <td className="py-3 px-4">
                      {formatTime(log.datetime)}
                    </td>
                    <td className="py-3 px-4">
                      {log.user?.email || "System"}
                    </td>
                    <td className="py-3 px-4 italic">
                      {log.changes ? formatChanges(log.changes) : "No changes recorded"}
                    </td>
                    <td className="py-3 px-4">
                      {log.object && (
                        <button
                          onClick={() => openObjectModal(log.object)}
                          className="bg-[#5C7346] hover:bg-[#4a5c38] text-white px-3 py-1 rounded-md transition-colors"
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {/* Empty rows for consistent height */}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan="8" className="py-3 px-4 text-center">No logs found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Section with Pagination */}
          <div className="flex justify-between items-center mt-6">
            <div className="text-white flex items-center">
              <span className="mr-4">
                Showing {filteredLogs.length} of {totalItems} logs
              </span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="bg-white text-[#5C7346] px-2 py-1 rounded-md"
              >
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1 || loading}
                className="bg-[#5C7346] text-white px-4 py-2 rounded-md hover:bg-[#4a5c38] transition-colors disabled:opacity-50"
              >
                Previous
              </button>
              <div className="bg-white text-[#5C7346] px-4 py-2 rounded-md w-32 text-center">
                {currentPage} of {totalPages || 1}
              </div>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages || loading}
                className="bg-[#5C7346] text-white px-4 py-2 rounded-md hover:bg-[#4a5c38] transition-colors disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
              <p className="mb-6">
                Are you sure you want to delete all activity logs for <span className="font-semibold">{formatDate(dateFilter)}</span>?
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteLogsByDate(dateFilter)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Object Details Modal */}
        {objectModalOpen && selectedObject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Object Details</h3>
                <button
                  onClick={() => setObjectModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                {selectedObject.map((item, index) => (
                  <div key={index} className="mb-4">
                    <h4 className="font-semibold mb-2">Model: {item.model}</h4>
                    <p className="mb-2">Primary Key: {item.pk}</p>
                    <div className="mb-2">
                      <h5 className="font-semibold mb-1">Fields:</h5>
                      <div className="bg-white p-3 rounded border">
                        <pre className="whitespace-pre-wrap font-mono text-sm">
                          {JSON.stringify(item.fields, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setObjectModalOpen(false)}
                  className="px-4 py-2 bg-[#5C7346] text-white rounded-md hover:bg-[#4a5c38] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityLogPage