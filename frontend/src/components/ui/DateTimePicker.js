import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ImprovedDateTimePicker Component
 * Beautiful date and time picker matching the design samples
 */
export default function ImprovedDateTimePicker({
  value,
  onChange,
  userTimezone = 'UTC',
  label = 'Scheduled Date & Time',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState({ hour: 10, minute: 0, period: 'AM' });
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      try {
        const date = new Date(value);
        setSelectedDate(date);
        const hours = date.getHours();
        setSelectedTime({
          hour: hours === 0 || hours === 12 ? 12 : hours > 12 ? hours - 12 : hours,
          minute: date.getMinutes(),
          period: hours >= 12 ? 'PM' : 'AM',
        });
        setCurrentMonth(date);
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    }
  }, [value]);

  // Calendar data
  const { monthName, year, daysInMonth, firstDayOfMonth, today } = useMemo(() => {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthName = monthNames[month];

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return { monthName, year, daysInMonth, firstDayOfMonth, today };
  }, [currentMonth]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      dateObj.setHours(0, 0, 0, 0);

      days.push({
        day,
        date: dateObj,
        isToday: dateObj.getTime() === today.getTime(),
        isPast: dateObj < today,
        isSelected:
          selectedDate && dateObj.getTime() === new Date(selectedDate).setHours(0, 0, 0, 0),
      });
    }

    return days;
  }, [currentMonth, daysInMonth, firstDayOfMonth, today, selectedDate]);

  // Quick select times
  const quickTimes = [
    { label: '9:00 AM', hour: 9, minute: 0, period: 'AM' },
    { label: '12:00 PM', hour: 12, minute: 0, period: 'PM' },
    { label: '2:00 PM', hour: 2, minute: 0, period: 'PM' },
    { label: '5:00 PM', hour: 5, minute: 0, period: 'PM' },
  ];

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDate(now);
  };

  // Handle date selection
  const handleDateClick = (dayData) => {
    if (dayData.isPast && !dayData.isToday) return;

    setSelectedDate(dayData.date);
  };

  // Handle time change
  const handleTimeChange = (type, value) => {
    setSelectedTime((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  // Confirm selection
  const handleConfirm = () => {
    if (!selectedDate) return;

    const finalDate = new Date(selectedDate);
    let hours = selectedTime.hour;

    if (selectedTime.period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (selectedTime.period === 'AM' && hours === 12) {
      hours = 0;
    }

    finalDate.setHours(hours, selectedTime.minute, 0, 0);

    onChange(finalDate.toISOString());
    setIsOpen(false);
  };

  // Format display value
  const displayValue = useMemo(() => {
    if (!value) return 'Select date & time';

    try {
      const date = new Date(value);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return 'Select date & time';
    }
  }, [value]);

  return (
    <div className="relative">
      {/* Label */}
      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>

      {/* Input Field */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-secondary text-foreground rounded-lg border border-border hover:border-primary transition-colors flex items-center justify-between"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>{displayValue}</span>
        <svg
          className="w-5 h-5 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {/* Picker Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Picker Content - Dropdown style */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 top-full mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 w-full min-w-[900px]"
            >
              <div className="grid grid-cols-3 max-h-[600px] overflow-y-auto">
                {/* Calendar Section */}
                <div className="col-span-2 p-6 border-r border-border">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-foreground">
                      {monthName} {year}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={goToToday}
                        className="px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        Today
                      </button>
                      <button
                        onClick={goToPreviousMonth}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={goToNextMonth}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-semibold text-muted-foreground py-2"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((dayData, index) => {
                      if (!dayData) {
                        return <div key={`empty-${index}`} className="aspect-square" />;
                      }

                      return (
                        <motion.button
                          key={dayData.day}
                          type="button"
                          onClick={() => handleDateClick(dayData)}
                          disabled={dayData.isPast && !dayData.isToday}
                          whileHover={{ scale: dayData.isPast && !dayData.isToday ? 1 : 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`
                            aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all
                            ${dayData.isPast && !dayData.isToday ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                            ${
                              dayData.isSelected
                                ? 'bg-primary text-primary-foreground shadow-lg'
                                : dayData.isToday
                                  ? 'bg-primary/10 text-primary border-2 border-primary'
                                  : 'hover:bg-secondary text-foreground'
                            }
                          `}
                        >
                          {dayData.day}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Selection Section */}
                <div className="p-6 flex flex-col">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Select Time</h3>

                  {/* Time Inputs */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">Hour</label>
                        <select
                          value={selectedTime.hour}
                          onChange={(e) => handleTimeChange('hour', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-secondary text-foreground rounded-lg border border-border focus:border-primary focus:outline-none"
                        >
                          {[...Array(12)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {String(i + 1).padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>

                      <span className="text-2xl font-bold text-muted-foreground mt-5">:</span>

                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">Minute</label>
                        <select
                          value={selectedTime.minute}
                          onChange={(e) => handleTimeChange('minute', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-secondary text-foreground rounded-lg border border-border focus:border-primary focus:outline-none"
                        >
                          {[0, 15, 30, 45].map((minute) => (
                            <option key={minute} value={minute}>
                              {String(minute).padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">Period</label>
                        <select
                          value={selectedTime.period}
                          onChange={(e) => handleTimeChange('period', e.target.value)}
                          className="w-full px-3 py-2 bg-secondary text-foreground rounded-lg border border-border focus:border-primary focus:outline-none"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Quick Select */}
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-muted-foreground mb-3">Quick Select</p>
                    <div className="space-y-2">
                      {quickTimes.map((time) => (
                        <button
                          key={time.label}
                          type="button"
                          onClick={() =>
                            setSelectedTime({
                              hour: time.hour,
                              minute: time.minute,
                              period: time.period,
                            })
                          }
                          className="w-full px-4 py-2 text-sm text-left text-foreground hover:bg-secondary rounded-lg transition-colors"
                        >
                          {time.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timezone Info */}
                  <div className="mt-auto">
                    <div className="text-xs text-muted-foreground mb-4 p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Timezone: {userTimezone}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!selectedDate}
                        className="flex-1 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
