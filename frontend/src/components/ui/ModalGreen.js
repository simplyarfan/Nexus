import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { modalVariants, backdropVariants } from '../../lib/motion';

/**
 * Green-themed Modal Component
 * Based on Nexus Design Prototypes
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when modal closes
 * @param {string} props.title - Modal title
 * @param {string} props.description - Modal description
 * @param {React.ReactNode} props.children - Modal content
 * @param {'sm' | 'md' | 'lg' | 'xl'} props.size - Modal size
 * @param {boolean} props.showClose - Whether to show close button
 */
export default function ModalGreen({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
}) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    
      {isOpen && (
        
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="modal-backdrop"
          />

          {/* Modal */}
          
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'relative bg-white rounded-lg shadow-xl w-full pointer-events-auto',
                sizes[size],
              )}
            >
              {/* Header */}
              {(title || description || showClose) && (
                
                  
                    
                      {title && {title}}
                      {description && {description}}
                    
                    {showClose && (
                      <button
                        onClick={onClose}
                        className="ml-4 text-gray-400 hover:text-gray-500 transition-colors"
                      >
                        Close
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        
                      
                    )}
                  
                
              )}

              {/* Content */}
              {children}
            
          
        
      )}
    
  );
}

/**
 * Modal Footer Component
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Footer content
 * @param {string} props.className - Additional classes
 */
export function ModalFooter({ children, className }) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-3',
        className,
      )}
    >
      {children}
    
  );
}
