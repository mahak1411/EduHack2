import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface ErrorMessageProps {
  message: string;
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
}

export default function ErrorMessage({ 
  message, 
  className, 
  dismissible = false, 
  onDismiss,
  autoHide = false,
  duration = 5000 
}: ErrorMessageProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (autoHide && duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration]);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "error-message",
        isAnimatingOut && "fade-out",
        className
      )}
      data-testid="error-message"
    >
      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
      <span className="flex-1 modern-body">{message}</span>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="text-red-400 hover:text-red-600 transition-colors duration-200 ml-2"
          data-testid="error-dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}