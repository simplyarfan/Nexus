

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type DateTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
};

export default function DateTimePicker({ value, onChange, label, required }: DateTimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState({
    hour: value ? new Date(value).getHours() % 12 || 12 : 10,
    minute: value ? new Date(value).getMinutes() : 0,
    period: value ? (new Date(value).getHours() >= 12 ? 'PM' : 'AM') : 'AM',
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
  };

  const handleTimeChange = (type: 'hour' | 'minute' | 'period', value: number | string) => {
    setSelectedTime(prev => ({ ...prev, [type]: value }));
  };

  const handleApply = () => {
    if (selectedDate) {
      const finalDate = new Date(selectedDate);
      // Convert 12-hour format to 24-hour format
      let hour24 = selectedTime.hour;
      if (selectedTime.period === 'AM') {
        hour24 = selectedTime.hour === 12 ? 0 : selectedTime.hour;
      } else {
        hour24 = selectedTime.hour === 12 ? 12 : selectedTime.hour + 12;
      }
      finalDate.setHours(hour24, selectedTime.minute, 0, 0);

      // Format as YYYY-MM-DDTHH:mm for datetime-local input
      const year = finalDate.getFullYear();
      const month = String(finalDate.getMonth() + 1).padStart(2, '0');
      const day = String(finalDate.getDate()).padStart(2, '0');
      const hours = String(finalDate.getHours()).padStart(2, '0');
      const minutes = String(finalDate.getMinutes()).padStart(2, '0');

      onChange(`${year}-${month}-${day}T${hours}:${minutes}`);
      setShowPicker(false);
    }
  };

  const formatDisplayValue = () => {
    if (!value) return 'Select date & time';

    const date = new Date(value);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return `${dateStr} at ${timeStr}`;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
           currentMonth.getMonth() === today.getMonth() &&
           currentMonth.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() &&
           currentMonth.getMonth() === selectedDate.getMonth() &&
           currentMonth.getFullYear() === selectedDate.getFullYear();
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="w-full px-4 py-2.5 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-left flex items-center justify-between hover:bg-accent transition-colors"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {formatDisplayValue()}
        </span>
        <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      <AnimatePresence>
        {showPicker && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowPicker(false)}
            />

            {/* Picker Modal */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 mt-2 bg-card border border-border rounded-2xl shadow-2xl p-6 w-[700px]"
            >
              <div className="flex gap-6">
                {/* Calendar */}
                <div className="flex-1">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={goToPreviousMonth}
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-foreground">
                        {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={goToNextMonth}
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {daysOfWeek.map(day => (
                      <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-2">
                    {getDaysInMonth(currentMonth).map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => day && handleDateSelect(day)}
                        disabled={!day}
                        className={`
                          aspect-square rounded-lg text-sm font-medium transition-all
                          ${!day ? 'invisible' : ''}
                          ${isSelected(day!) ? 'bg-primary text-primary-foreground shadow-md' : ''}
                          ${isToday(day!) && !isSelected(day!) ? 'bg-accent text-foreground ring-2 ring-primary' : ''}
                          ${!isSelected(day!) && !isToday(day!) ? 'text-foreground hover:bg-accent' : ''}
                        `}
                      >
                        {day}
                      </button>
                    ))}
                  </div>

                  {/* Today Button */}
                  <button
                    type="button"
                    onClick={goToToday}
                    className="w-full mt-4 px-4 py-2 text-sm text-primary hover:bg-accent rounded-lg transition-colors"
                  >
                    Today
                  </button>
                </div>

                {/* Time Picker */}
                <div className="w-64 border-l border-border pl-6">
                  <h4 className="text-sm font-medium text-foreground mb-4">Select Time</h4>
                  <div className="flex items-center gap-3 mb-6">
                    {/* Hour */}
                    <div className="flex-1">
                      <label className="block text-xs text-muted-foreground mb-2">Hour</label>
                      <select
                        value={selectedTime.hour}
                        onChange={(e) => handleTimeChange('hour', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {Array.from({ length: 12 }, (_, i) => {
                          const hour = i + 1;
                          return (
                            <option key={hour} value={hour}>
                              {hour}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="text-2xl font-bold text-muted-foreground mt-6">:</div>

                    {/* Minute */}
                    <div className="flex-1">
                      <label className="block text-xs text-muted-foreground mb-2">Minute</label>
                      <select
                        value={selectedTime.minute}
                        onChange={(e) => handleTimeChange('minute', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {[0, 15, 30, 45].map((minute) => (
                          <option key={minute} value={minute}>
                            {minute.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* AM/PM Selector */}
                    <div className="flex-1">
                      <label className="block text-xs text-muted-foreground mb-2">Period</label>
                      <select
                        value={selectedTime.period}
                        onChange={(e) => handleTimeChange('period', e.target.value)}
                        className="w-full px-3 py-2 bg-secondary text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>

                  {/* Quick Time Presets */}
                  <div className="space-y-2">
                    <label className="block text-xs text-muted-foreground mb-2">Quick Select</label>
                    {[
                      { label: '9:00 AM', hour: 9, minute: 0, period: 'AM' },
                      { label: '12:00 PM', hour: 12, minute: 0, period: 'PM' },
                      { label: '2:00 PM', hour: 2, minute: 0, period: 'PM' },
                      { label: '5:00 PM', hour: 5, minute: 0, period: 'PM' },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setSelectedTime({ hour: preset.hour, minute: preset.minute, period: preset.period })}
                        className="w-full px-3 py-2 text-sm text-foreground hover:bg-accent border border-border rounded-lg transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowPicker(false)}
                  className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!selectedDate}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
