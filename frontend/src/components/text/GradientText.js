/**
 * REACT BITS - GRADIENT TEXT
 * Animated gradient text effect
 * Source: reactbits.dev/text-animations/gradient-text
 */

'use client';

export default function GradientText({
  children,
  className = '',
  colors = ['#006239', '#33a077', '#66cfa5'],
  animationSpeed = 8, // seconds
}) {
  return (
    <span
      className={`inline-block font-bold ${className}`}
      style={{
        background: `linear-gradient(to right, ${colors.join(', ')}, ${colors[0]})`,
        backgroundSize: '200%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: `gradient ${animationSpeed}s ease infinite`,
      }}
    >
      {children}
      <style jsx>{`
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </span>
  );
}
