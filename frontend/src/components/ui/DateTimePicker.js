import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function DateTimePicker({
  value,
  onChange,
  label,
  required = false,
  minDate,
  className
}) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date.toISOString().split('T')[0]);
      setSelectedTime(date.toTimeString().slice(0, 5));
    }
  }, [value]);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    if (newDate && selectedTime) {
      onChange(newDate + 'T' + selectedTime + ':00');
    }
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setSelectedTime(newTime);
    if (selectedDate && newTime) {
      onChange(selectedDate + 'T' + newTime + ':00');
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      
      <div className="flex gap-2">
        <motion.input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          className="flex-1 px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        />
        
        <motion.input
          type="time"
          value={selectedTime}
          onChange={handleTimeChange}
          className="px-4 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
        />
      </div>
    </div>
  );
}