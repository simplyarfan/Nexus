import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Download } from 'lucide-react';

const AddToCalendarDropdown = ({ interview }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateForCalendar = (dateString) => {
    // Convert to UTC format for calendar URLs (YYYYMMDDTHHMMSSZ)
    const date = new Date(dateString);
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const getEndTime = (startTime, duration) => {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + (duration || 60) * 60000);
    return end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const getCalendarLinks = () => {
    const startTime = formatDateForCalendar(interview.scheduled_time);
    const endTime = getEndTime(interview.scheduled_time, interview.duration);
    const title = encodeURIComponent(
      `Interview - ${interview.candidate_name} - ${interview.job_title}`,
    );
    const description = encodeURIComponent(
      `Interview Details:\n\n` +
        `Position: ${interview.job_title}\n` +
        `Type: ${interview.interview_type || 'General'}\n` +
        `Duration: ${interview.duration || 60} minutes\n` +
        `Platform: ${interview.platform || 'Video Call'}\n\n` +
        (interview.meeting_link ? `Meeting Link: ${interview.meeting_link}\n\n` : '') +
        (interview.notes ? `Notes: ${interview.notes}\n\n` : '') +
        `If you need to reschedule, please contact the interviewer.`,
    );
    const location = encodeURIComponent(interview.meeting_link || interview.platform || 'Online');

    return {
      google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${description}&location=${location}`,

      outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startTime}&enddt=${endTime}&body=${description}&location=${location}&path=/calendar/action/compose&rru=addevent`,

      office365: `https://outlook.office.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startTime}&enddt=${endTime}&body=${description}&location=${location}&path=/calendar/action/compose&rru=addevent`,

      yahoo: `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${title}&st=${startTime}&et=${endTime}&desc=${description}&in_loc=${location}`,

      // ICS download link (handled separately via API)
      ics: `/api/interview-coordinator/interview/${interview.id}/calendar`,
    };
  };

  const handleCalendarClick = (type) => {
    const links = getCalendarLinks();

    if (type === 'ics') {
      // Download ICS file
      downloadICS();
    } else {
      // Open calendar service in new tab
      window.open(links[type], '_blank', 'noopener,noreferrer');
    }

    setIsOpen(false);
  };

  const downloadICS = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';
      const response = await fetch(
        `${API_URL}/interview-coordinator/interview/${interview.id}/calendar`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        },
      );

      if (!response.ok) throw new Error('Failed to download calendar file');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview-${interview.candidate_name.replace(/\s+/g, '-')}.ics`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download ICS:', error);
    }
  };

  const calendarOptions = [
    {
      id: 'apple',
      name: 'Apple',
      icon: '🍎',
      action: () => downloadICS(), // Apple Calendar uses ICS files
    },
    {
      id: 'google',
      name: 'Google',
      icon: '📅',
      action: () => handleCalendarClick('google'),
    },
    {
      id: 'ics',
      name: 'iCal File',
      icon: '📆',
      action: () => handleCalendarClick('ics'),
    },
    {
      id: 'office365',
      name: 'Microsoft 365',
      icon: '📧',
      action: () => handleCalendarClick('office365'),
    },
    {
      id: 'outlook',
      name: 'Outlook.com',
      icon: '📨',
      action: () => handleCalendarClick('outlook'),
    },
    {
      id: 'yahoo',
      name: 'Yahoo',
      icon: '🟣',
      action: () => handleCalendarClick('yahoo'),
    },
  ];

  return (
    
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 text-gray-700 rounded-lg transition-all flex items-center justify-between font-medium group"
      >
        
          
          Add to Calendar
        
        
      

      {isOpen && (
        
          {calendarOptions.map((option) => (
            <button
              key={option.id}
              onClick={option.action}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
            >
              {option.icon}
              {option.name}
            
          ))}
        
      )}
    
  );
};

export default AddToCalendarDropdown;
