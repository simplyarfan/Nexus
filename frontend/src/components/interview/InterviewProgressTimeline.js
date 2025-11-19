import { motion } from 'framer-motion';

/**
 * InterviewProgressTimeline Component
 * Visual timeline showing interview progress stages
 */
export default function InterviewProgressTimeline({ interview }) {
  // Define interview stages
  const stages = [
    {
      id: 'email_sent',
      label: 'Initial Email Sent',
      description: 'Initial availability request sent',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      completed: true,
      timestamp: interview.createdAt || interview.created_at,
    },
    {
      id: 'awaiting_response',
      label: 'Awaiting Response',
      description: 'Waiting for candidate response',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      completed: interview.status !== 'pending',
      timestamp: interview.createdAt || interview.created_at,
    },
    {
      id: 'interview_scheduled',
      label: 'Interview Scheduled',
      description: interview.meetingLink
        ? 'Interview scheduled via Microsoft Teams'
        : 'Interview scheduled',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      completed: interview.status === 'scheduled' || interview.status === 'completed',
      timestamp: interview.scheduledAt || interview.scheduled_at,
    },
    {
      id: 'interview_completed',
      label: 'Interview Completed',
      description: 'Interview completed successfully',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      completed: interview.status === 'completed',
      timestamp: interview.outcome ? new Date().toISOString() : null,
    },
  ];

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="space-y-4">
      {stages.map((stage, index) => {
        const isLast = index === stages.length - 1;
        const isActive =
          stage.completed && (index === stages.length - 1 || !stages[index + 1]?.completed);

        return (
          <div key={stage.id} className="relative">
            <div className="flex items-start gap-4">
              {/* Icon Circle */}
              <div className="relative flex-shrink-0">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center relative z-10
                    ${
                      stage.completed
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground border-2 border-border'
                    }
                  `}
                >
                  {stage.icon}
                </motion.div>

                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className={`
                      absolute left-1/2 top-12 w-0.5 h-16 -translate-x-1/2
                      ${stage.completed && stages[index + 1]?.completed ? 'bg-primary' : 'bg-border'}
                    `}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.1 }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4
                        className={`font-semibold ${
                          stage.completed ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {stage.label}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{stage.description}</p>
                    </div>
                    {stage.timestamp && (
                      <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                        {formatTimestamp(stage.timestamp)}
                      </span>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
