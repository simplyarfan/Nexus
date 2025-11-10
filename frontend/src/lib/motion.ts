import { Variants } from 'framer-motion';

/**
 * Fade in animation
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

/**
 * Slide in from right
 */
export const slideInRight: Variants = {
  hidden: { x: 100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    x: 100,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

/**
 * Slide in from left
 */
export const slideInLeft: Variants = {
  hidden: { x: -100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    x: -100,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

/**
 * Slide in from top
 */
export const slideInDown: Variants = {
  hidden: { y: -50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    y: -50,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

/**
 * Slide in from bottom
 */
export const slideInUp: Variants = {
  hidden: { y: 50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    y: 50,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

/**
 * Scale in animation
 */
export const scaleIn: Variants = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

/**
 * Stagger children animation
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/**
 * Stagger item (used with staggerContainer)
 */
export const staggerItem: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

/**
 * Modal/Dialog animation
 */
export const modalVariants: Variants = {
  hidden: {
    scale: 0.95,
    opacity: 0,
    y: 20,
  },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1], // Custom easing
    },
  },
  exit: {
    scale: 0.95,
    opacity: 0,
    y: 20,
    transition: { duration: 0.15 },
  },
};

/**
 * Modal backdrop animation
 */
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

/**
 * Page transition
 */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 },
  },
};

/**
 * Card hover animation
 */
export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  tap: { scale: 0.98 },
};

/**
 * Button tap animation
 */
export const buttonTap = {
  scale: 0.95,
  transition: { duration: 0.1 },
};

/**
 * Ripple effect animation
 */
export const ripple: Variants = {
  initial: { scale: 0, opacity: 0.5 },
  animate: {
    scale: 2,
    opacity: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

/**
 * Toast notification animation
 */
export const toastVariants: Variants = {
  hidden: {
    x: 400,
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    x: 400,
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2 },
  },
};

/**
 * Skeleton loading pulse
 */
export const skeletonPulse: Variants = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Bounce animation
 */
export const bounce: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Rotate animation
 */
export const rotate: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * Spring animation config
 */
export const springConfig = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};
