"use client"
import dayjs from "dayjs"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"

export default function Calendar({
  value,
  onChange,
  maxDate = null,
  minDate = null,
  disabled = false,
  required = false,
  className = "",
}) {
  const dateValue = value ? dayjs(value) : null
  const currentYear = dayjs().year()

  const handleDateChange = (newDate) => {
    if (newDate && onChange) {
      onChange(newDate.format("YYYY-MM-DD"))
    } else if (onChange) {
      onChange("")
    }
  }

  const setToToday = () => {
    if (onChange) {
      const today = dayjs()
      onChange(today.format("YYYY-MM-DD"))
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="relative">
        <DatePicker
          value={dateValue}
          onChange={handleDateChange}
          maxDate={maxDate ? dayjs(maxDate) : dayjs().add(10, "year")}
          minDate={minDate ? dayjs(minDate) : dayjs().subtract(100, "year")}
          openTo="day"
          views={["year", "month", "day"]}
          yearsPerRow={3}
          defaultCalendarMonth={dayjs(`${currentYear}-01-01`)}
          disabled={disabled}
          slotProps={{
            textField: {
              required: required,
              fullWidth: true,
              size: "medium",
              className: className,
              sx: {
                "& .MuiOutlinedInput-root": {
                  height: "42px",
                  padding: "0px",
                },
                "& .MuiInputLabel-root": {
                  transform: "translate(14px, 12px) scale(1)",
                },
                "& .MuiInputLabel-shrink": {
                  transform: "translate(14px, -9px) scale(0.75)",
                },
                "& .MuiInputAdornment-root": {
                  marginRight: "14px",
                  position: "absolute",
                  right: "0",
                },
                "& .MuiSvgIcon-root": {
                  fontSize: "20px",
                },
                "& .Mui-disabled .MuiInputAdornment-root": {
                  display: "none",
                },
              },
            },
            desktopPaper: {
              sx: {
                "& .MuiPickersYear-yearButton": {
                  fontSize: "1.25rem", // Font size for the year selection
                },
                "& .MuiPickersCalendarHeader-label": {
                  fontSize: "1.2rem", // Font size for month label (e.g., March 2025)
                },
                "& .MuiPickersDay-root": {
                  fontSize: "1.2rem", // Font size for day numbers
                },
                "& .MuiDayCalendar-weekDayLabel": {
                  fontSize: "1rem", // Font size for weekdays (Sun, Mon, etc.)
                },
                "& .MuiPickersMonth-monthButton": {
                  fontSize: "1.25rem", // Font size for month picker items (Jan, Feb, etc.)
                },
              },
            },
            actionBar: {
              actions: ["today", "accept", "cancel"],
              sx: {
                "& .MuiButton-root": {
                  color: "#5C7346",
                  "&:hover": {
                    backgroundColor: "rgba(92, 115, 70, 0.1)",
                  },
                },
              },
            },
          }}
          sx={{
            width: "100%",
            "& .MuiOutlinedInput-root": {
              height: "42px",
              "&:hover fieldset": {
                borderColor: "#5C7346",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#5C7346",
                borderWidth: "2px",
              },
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: "#5C7346",
            },
            "& .MuiPickersDay-root.Mui-selected": {
              backgroundColor: "#5C7346",
              "&:hover": {
                backgroundColor: "#4a5c38",
              },
            },
            "& .MuiPickersDay-root:not(.Mui-selected):hover": {
              backgroundColor: "rgba(92, 115, 70, 0.1)",
            },
            "& .MuiPickersDay-today": {
              border: "1px solid #5C7346",
            },
          }}
          componentsProps={{
            actionBar: {
              actions: ["today", "accept", "cancel"],
            },
          }}
        />
      </div>
    </LocalizationProvider>
  )
}
