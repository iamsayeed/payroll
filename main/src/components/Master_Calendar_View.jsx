"use client"

import { useState } from "react"
import dayjs from "dayjs"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import isToday from "dayjs/plugin/isToday"

// Initialize dayjs plugins
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.extend(isToday)

const MasterCalendarView = ({ holidays, payrollPeriods, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [visibleMonths, setVisibleMonths] = useState(3) // Number of months to display at once
  const [viewMode, setViewMode] = useState("year") // "year" or "month"

  // Generate an array of months to display
  const months = Array.from({ length: viewMode === "year" ? 12 : visibleMonths }, (_, i) => {
    return viewMode === "year"
      ? dayjs(currentDate).month(i).startOf("month")
      : dayjs(currentDate).add(i, "month").startOf("month")
  })

  // Function to get days for a specific month
  const getDaysInMonth = (month) => {
    const daysInMonth = month.daysInMonth()
    return Array.from({ length: daysInMonth }, (_, i) => {
      return dayjs(month).date(i + 1)
    })
  }

  // Function to check if a date has a holiday
  const getHolidayForDate = (date) => {
    return holidays.find((holiday) => {
      const holidayDate = dayjs(holiday.date)
      return holidayDate.isValid() && holidayDate.isSame(date, "day")
    })
  }

  // Function to check if a date is within a payroll period
  const isInPayrollPeriod = (date) => {
    return payrollPeriods.some((period) => {
      const startDate = dayjs(period.payroll_period_start)
      const endDate = dayjs(period.payroll_period_end)
      return (
        startDate.isValid() &&
        endDate.isValid() &&
        date.isSameOrAfter(startDate, "day") &&
        date.isSameOrBefore(endDate, "day")
      )
    })
  }

  // Function to get the payroll period for a date
  const getPayrollPeriodForDate = (date) => {
    return payrollPeriods.find((period) => {
      const startDate = dayjs(period.payroll_period_start)
      const endDate = dayjs(period.payroll_period_end)
      return (
        startDate.isValid() &&
        endDate.isValid() &&
        date.isSameOrAfter(startDate, "day") &&
        date.isSameOrBefore(endDate, "day")
      )
    })
  }

  // Function to check if a date is a weekend
  const isWeekend = (date) => {
    const day = date.day()
    return day === 0 || day === 6 // 0 is Sunday, 6 is Saturday
  }

  // Function to navigate to previous months/year
  const goToPrevious = () => {
    if (viewMode === "year") {
      setCurrentDate(currentDate.subtract(1, "year"))
    } else {
      setCurrentDate(currentDate.subtract(visibleMonths, "month"))
    }
  }

  // Function to navigate to next months/year
  const goToNext = () => {
    if (viewMode === "year") {
      setCurrentDate(currentDate.add(1, "year"))
    } else {
      setCurrentDate(currentDate.add(visibleMonths, "month"))
    }
  }

  // Function to go to current month/year
  const goToCurrent = () => {
    setCurrentDate(dayjs())
  }

  // Function to toggle view mode
  const toggleViewMode = () => {
    setViewMode(viewMode === "year" ? "month" : "year")
  }

  // Function to handle date click
  const handleDateClick = (date) => {
    onDateSelect(date.toDate())
  }

  // Function to render a single day cell
  const renderDayCell = (day) => {
    const holiday = getHolidayForDate(day)
    const payrollPeriod = getPayrollPeriodForDate(day)
    const isPayrollPeriodDay = !!payrollPeriod
    const isWeekendDay = isWeekend(day)
    const isTodayDate = day.isToday()

    let cellClasses = "relative h-14 border border-gray-200 p-1 cursor-pointer transition-colors rounded-md"

    // Apply styling based on day type
    if (holiday) {
      cellClasses +=
        holiday.holiday_type === "regular" ? " bg-red-100 hover:bg-red-200" : " bg-blue-100 hover:bg-blue-200"
    } else if (isPayrollPeriodDay) {
      cellClasses += " bg-green-200 hover:bg-green-100"
    } else if (isWeekendDay) {
      cellClasses += " bg-gray-100 hover:bg-gray-200"
    } else {
      cellClasses += " hover:bg-gray-100"
    }

    // Add today indicator
    if (isTodayDate) {
      cellClasses += " ring-2 ring-[#5C7346]"
    }

    return (
      <div key={day.format("YYYY-MM-DD")} className={cellClasses} onClick={() => handleDateClick(day)}>
        <div className="flex flex-col h-full">
          <span className="text-sm font-medium">{day.format("D")}</span>
          {holiday && (
            <div className="mt-auto">
              <span
                className={`text-xs truncate block ${
                  holiday.holiday_type === "regular" ? "text-red-700" : "text-blue-700"
                }`}
                title={holiday.name}
              >
                {holiday.name}
              </span>
            </div>
          )}
          {isPayrollPeriodDay && !holiday && (
            <div className="mt-auto">
              <span className="text-xs truncate block text-green-500" title="Payroll Period" />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Function to render a month
  const renderMonth = (month) => {
    const days = getDaysInMonth(month)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    // Calculate the day of the week for the first day of the month (0-6)
    const firstDayOfMonth = month.startOf("month").day()

    // Create empty cells for days before the first day of the month
    const emptyCells = Array.from({ length: firstDayOfMonth }, (_, i) => (
      <div key={`empty-${i}`} className="h-14 border border-gray-200 bg-gray-50 rounded-md"></div>
    ))

    return (
      <div key={month.format("YYYY-MM")} className="mb-8">
        <h3 className="text-xl font-semibold mb-2 text-[#5C7346]">{month.format("MMMM YYYY")}</h3>
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {dayNames.map((day) => (
            <div key={day} className="h-8 flex items-center justify-center font-medium bg-gray-100 rounded-md">
              {day}
            </div>
          ))}

          {/* Empty cells for days before the first day of the month */}
          {emptyCells}

          {/* Calendar days */}
          {days.map((day) => renderDayCell(day))}
        </div>
      </div>
    )
  }

  // Function to change the number of visible months
  const handleVisibleMonthsChange = (e) => {
    setVisibleMonths(Number.parseInt(e.target.value))
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex space-x-2">
          <button
            onClick={goToPrevious}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors shadow-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            {viewMode === "year" ? "Previous Year" : "Previous"}
          </button>
          <button
            onClick={goToCurrent}
            className="px-4 py-2 bg-[#5C7346] text-white rounded-md hover:bg-[#4a5c38] transition-colors shadow-sm"
          >
            Today
          </button>
          <button
            onClick={goToNext}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors shadow-sm flex items-center"
          >
            {viewMode === "year" ? "Next Year" : "Next"}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleViewMode}
            className="px-4 py-2 bg-[#5C7346] text-white rounded-md hover:bg-[#4a5c38] transition-colors shadow-sm"
          >
            {viewMode === "year" ? "Switch to Month View" : "Switch to Year View"}
          </button>

          {viewMode === "month" && (
            <div className="flex items-center space-x-2">
              <label htmlFor="visibleMonths" className="text-sm">
                Months to display:
              </label>
              <select
                id="visibleMonths"
                value={visibleMonths}
                onChange={handleVisibleMonthsChange}
                className="border rounded-md p-1 shadow-sm"
              >
                <option value="1">1</option>
                <option value="3">3</option>
                <option value="6">6</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
        <h4 className="font-medium mb-2 text-gray-700">Legend</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-5 h-5 bg-red-100 border border-red-300 mr-2 rounded-md"></div>
            <span className="text-sm">Regular Holiday</span>
          </div>
          <div className="flex items-center">
            <div className="w-5 h-5 bg-blue-100 border border-blue-300 mr-2 rounded-md"></div>
            <span className="text-sm">Special Holiday</span>
          </div>
          <div className="flex items-center">
            <div className="w-5 h-5 bg-green-50 border border-green-300 mr-2 rounded-md"></div>
            <span className="text-sm">Payroll Period</span>
          </div>
          <div className="flex items-center">
            <div className="w-5 h-5 bg-gray-100 border border-gray-300 mr-2 rounded-md"></div>
            <span className="text-sm">Weekend</span>
          </div>
          <div className="flex items-center">
            <div className="w-5 h-5 border border-gray-300 mr-2 ring-2 ring-[#5C7346] rounded-md"></div>
            <span className="text-sm">Today</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {months.map((month) => renderMonth(month))}
      </div>
    </div>
  )
}

export default MasterCalendarView
