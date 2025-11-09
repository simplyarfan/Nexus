import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DateTimePicker = ({ value, onChange, minDate = new Date(), label, required = false }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState({ hour: '09', minute: '00', period: 'AM' });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const calendarRef = useRef(null);
  const timePickerRef = useRef(null);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      setSelectedTime({
        hour: String(hours % 12 || 12).padStart(2, '0'),
        minute: String(minutes).padStart(2, '0'),
        period: hours >= 12 ? 'PM' : 'AM',
      });
    }
  }, [value]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
      if (timePickerRef.current && !timePickerRef.current.contains(event.target)) {
        setShowTimePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate calendar days
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
    updateDateTime(date, selectedTime);
  };

  const handleTimeChange = (field, value) => {
    const newTime = { ...selectedTime, [field]: value };
    setSelectedTime(newTime);
    if (selectedDate) {
      updateDateTime(selectedDate, newTime);
    }
  };

  const updateDateTime = (date, time) => {
    if (!date) return;

    let hours = parseInt(time.hour);
    if (time.period === 'PM' && hours !== 12) hours += 12;
    if (time.period === 'AM' && hours === 12) hours = 0;

    const newDate = new Date(date);
    newDate.setHours(hours, parseInt(time.minute), 0, 0);

    // Format as datetime-local string
    const isoString = newDate.toISOString().slice(0, 16);
    onChange({ target: { value: isoString } });
  };

  const formatDisplayDate = () => {
    if (!selectedDate) return 'Select date';
    return selectedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDisplayTime = () => {
    return `${selectedTime.hour}:${selectedTime.minute} ${selectedTime.period}`;
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Date Picker Button */}
        <div className="relative" ref={calendarRef}>
          <button
            type="button"
            onClick={() => {
              setShowCalendar(!showCalendar);
              setShowTimePicker(false);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-green-500 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
          >
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className={selectedDate ? 'text-gray-900' : 'text-gray-400'}>
                {formatDisplayDate()}
              </span>
            </div>
          </button>

          {/* Calendar Dropdown */}
          <AnimatePresence>
            {showCalendar && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80"
              >
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="text-base font-semibold text-gray-900">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  <button
                    type="button"
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(currentMonth).map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const disabled = isDateDisabled(date);
                    const today = isToday(date);
                    const selected = isSelected(date);

                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        onClick={() => !disabled && handleDateSelect(date)}
                        disabled={disabled}
                        className={`
                          aspect-square rounded-lg text-sm font-medium transition-all
                          ${disabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-green-50 text-gray-700'}
                          ${today && !selected ? 'bg-blue-50 text-blue-600' : ''}
                          ${selected ? 'bg-green-600 text-white hover:bg-green-700' : ''}
                        `}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                  <button
                    type="button"
                    onClick={() => handleDateSelect(new Date())}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Time Picker Button */}
        <div className="relative" ref={timePickerRef}>
          <button
            type="button"
            onClick={() => {
              setShowTimePicker(!showTimePicker);
              setShowCalendar(false);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-green-500 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
          >
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{formatDisplayTime()}</span>
            </div>
          </button>

          {/* Time Picker Dropdown */}
          <AnimatePresence>
            {showTimePicker && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-64"
              >
                <div className="flex items-center justify-between space-x-2">
                  {/* Hour */}
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Hour</label>
                    <select
                      value={selectedTime.hour}
                      onChange={(e) => handleTimeChange('hour', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    >
                      {hours.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="text-2xl font-bold text-gray-400 mt-5">:</div>

                  {/* Minute */}
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Minute</label>
                    <select
                      value={selectedTime.minute}
                      onChange={(e) => handleTimeChange('minute', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    >
                      {minutes
                        .filter((m) => parseInt(m) % 5 === 0)
                        .map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Period */}
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Period</label>
                    <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleTimeChange('period', 'AM')}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${
                          selectedTime.period === 'AM'
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTimeChange('period', 'PM')}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${
                          selectedTime.period === 'PM'
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        PM
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Time Options */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs font-medium text-gray-600 mb-2">Quick Select</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '9:00 AM', hour: '09', minute: '00', period: 'AM' },
                      { label: '12:00 PM', hour: '12', minute: '00', period: 'PM' },
                      { label: '3:00 PM', hour: '03', minute: '00', period: 'PM' },
                    ].map((time) => (
                      <button
                        key={time.label}
                        type="button"
                        onClick={() => {
                          setSelectedTime({
                            hour: time.hour,
                            minute: time.minute,
                            period: time.period,
                          });
                          if (selectedDate) {
                            updateDateTime(selectedDate, {
                              hour: time.hour,
                              minute: time.minute,
                              period: time.period,
                            });
                          }
                        }}
                        className="px-2 py-1.5 text-xs bg-gray-50 hover:bg-green-50 border border-gray-200 rounded-lg transition-colors"
                      >
                        {time.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowTimePicker(false)}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Selected DateTime Display */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-green-600 mb-1">Scheduled for</div>
              <div className="text-sm font-semibold text-gray-900">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                at {formatDisplayTime()}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedDate(null);
                onChange({ target: { value: '' } });
              }}
              className="text-green-600 hover:text-green-700 text-xs font-medium"
            >
              Clear
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DateTimePicker;
