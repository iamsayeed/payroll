"use client"

export default function DeleteEmployee({ isOpen, onClose, onConfirm, employeeName }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">Confirm Delete</h2>
        <p className="text-gray-600 mb-4 text-center">Are you sure you want to delete</p>
        <p
          className="text-3xl font-bold text-red-600 text-center overflow-hidden text-ellipsis whitespace-nowrap max-w-full"
          title={employeeName}
        >
          {employeeName}?
        </p>
        <p className="text-gray-600 my-4 text-center">This action cannot be undone.</p>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

