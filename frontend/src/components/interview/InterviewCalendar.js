import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * InterviewCalendar Component
 * A beautiful calendar view for interview coordinator with interview indicators
 */
export default function InterviewCalendar({ interviews = [], onDateClick, onInterviewClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get calendar data
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

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = monthNames[month];

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return { monthName, year, daysInMonth, firstDayOfMonth, today };
  }, [currentDate]);

  // Group interviews by date
  const interviewsByDate = useMemo(() => {
    const grouped = {};

    interviews.forEach((interview) => {
      const scheduledTime = interview.scheduledTime || interview.scheduled_time;
      if (!scheduledTime) return;

      try {
        const date = new Date(scheduledTime);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(interview);
      } catch (error) {
        console.error('Error parsing interview date:', error);
      }
    });

    return grouped;
  }, [interviews]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayInterviews = interviewsByDate[dateKey] || [];

      days.push({
        day,
        date: dateObj,
        dateKey,
        interviews: dayInterviews,
        isToday: dateObj.getTime() === today.getTime(),
        isPast: dateObj < today,
      });
    }

    return days;
  }, [currentDate, daysInMonth, firstDayOfMonth, interviewsByDate, today]);

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-200 border-yellow-600 bg-yellow-900/20',
      scheduled: 'text-blue-200 border-blue-600 bg-blue-900/20',
      completed: 'text-green-200 border-green-600 bg-green-900/20',
      cancelled: 'text-red-200 border-red-600 bg-red-900/20',
      awaiting_response: 'text-orange-200 border-orange-600 bg-orange-900/20',
    };
    return colors[status] || 'text-gray-200 border-gray-600 bg-gray-900/20';
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {monthName} {year}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {Object.keys(interviewsByDate).length} day(s) with interviews
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="p-2 text-foreground hover:bg-secondary rounded-lg transition-colors"
            aria-label="Next month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
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

          const hasInterviews = dayData.interviews.length > 0;

          return (
            <motion.div
              key={dayData.dateKey}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              onClick={() => {
                if (hasInterviews && onDateClick) {
                  onDateClick(dayData.date, dayData.interviews);
                }
              }}
              className={`
                aspect-square relative p-2 rounded-lg border transition-all
                ${hasInterviews ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''}
                ${
                  dayData.isToday
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-border/60'
                }
                ${dayData.isPast && !dayData.isToday ? 'opacity-50' : ''}
                ${hasInterviews ? 'bg-accent/5' : 'bg-card'}
              `}
            >
              {/* Day number */}
              <div
                className={`text-sm font-medium mb-1 ${dayData.isToday ? 'text-primary' : 'text-foreground'}`}
              >
                {dayData.day}
              </div>

              {/* Interview indicators */}
              {hasInterviews && (
                <div className="space-y-1">
                  {dayData.interviews.slice(0, 2).map((interview, idx) => (
                    <div
                      key={interview.id || idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onInterviewClick) {
                          onInterviewClick(interview);
                        }
                      }}
                      className={`
                        px-1 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer
                        ${getStatusColor(interview.status)} border-l-2
                        hover:shadow-sm transition-all
                      `}
                      title={`${interview.candidateName || interview.candidate_name} - ${interview.status}`}
                    >
                      {interview.candidateName || interview.candidate_name || 'Unknown'}
                    </div>
                  ))}
                  {dayData.interviews.length > 2 && (
                    <div className="text-[10px] text-muted-foreground text-center font-medium">
                      +{dayData.interviews.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-xs font-semibold text-muted-foreground mb-3">Status Legend:</p>
        <div className="flex flex-wrap gap-3">
          {[
            { status: 'scheduled', label: 'Scheduled', color: 'bg-blue-500' },
            { status: 'completed', label: 'Completed', color: 'bg-green-500' },
            { status: 'pending', label: 'Pending', color: 'bg-yellow-500' },
            { status: 'awaiting_response', label: 'Awaiting Response', color: 'bg-orange-500' },
            { status: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
          ].map(({ status, label, color }) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
