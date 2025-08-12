import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ className, size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10', 
    lg: 'w-12 h-12'
  };
  
  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={cn('flex items-center space-x-3', className)}>
      {/* Modern AI Brain/Book Hybrid Logo */}
      <svg 
        className={cn(sizeClasses[size], 'text-primary')} 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer book/brain shape */}
        <path
          d="M8 6C8 4.89543 8.89543 4 10 4H30C31.1046 4 32 4.89543 32 6V34C32 35.1046 31.1046 36 30 36H10C8.89543 36 8 35.1046 8 34V6Z"
          fill="currentColor"
          fillOpacity="0.1"
        />
        
        {/* Book spine */}
        <rect x="8" y="4" width="3" height="32" fill="currentColor" fillOpacity="0.3" />
        
        {/* Neural network/AI connections */}
        <g stroke="currentColor" strokeWidth="1.5" fill="none">
          {/* Main neural pathways */}
          <path d="M15 10 Q20 8 25 10" strokeOpacity="0.8" />
          <path d="M15 15 Q20 13 25 15" strokeOpacity="0.7" />
          <path d="M15 20 Q20 18 25 20" strokeOpacity="0.8" />
          <path d="M15 25 Q20 23 25 25" strokeOpacity="0.7" />
          <path d="M15 30 Q20 28 25 30" strokeOpacity="0.8" />
          
          {/* Connection nodes */}
          <circle cx="15" cy="10" r="1.5" fill="currentColor" />
          <circle cx="20" cy="8" r="1" fill="currentColor" fillOpacity="0.7" />
          <circle cx="25" cy="10" r="1.5" fill="currentColor" />
          
          <circle cx="15" cy="15" r="1" fill="currentColor" fillOpacity="0.7" />
          <circle cx="25" cy="15" r="1" fill="currentColor" fillOpacity="0.7" />
          
          <circle cx="15" cy="20" r="1.5" fill="currentColor" />
          <circle cx="20" cy="18" r="1.2" fill="currentColor" />
          <circle cx="25" cy="20" r="1.5" fill="currentColor" />
          
          <circle cx="15" cy="25" r="1" fill="currentColor" fillOpacity="0.7" />
          <circle cx="25" cy="25" r="1" fill="currentColor" fillOpacity="0.7" />
          
          <circle cx="15" cy="30" r="1.5" fill="currentColor" />
          <circle cx="20" cy="28" r="1" fill="currentColor" fillOpacity="0.7" />
          <circle cx="25" cy="30" r="1.5" fill="currentColor" />
        </g>
        
        {/* Central AI core */}
        <circle 
          cx="20" 
          cy="20" 
          r="3" 
          fill="currentColor" 
          fillOpacity="0.2" 
          stroke="currentColor" 
          strokeWidth="1"
        />
        <circle cx="20" cy="20" r="1" fill="currentColor" />
      </svg>
      
      {showText && (
        <div className="flex flex-col">
          <span className={cn('font-bold text-slate-900 dark:text-white leading-tight', textSizeClasses[size])}>
            StudyAI
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              Smart Learning
            </span>
          )}
        </div>
      )}
    </div>
  );
}