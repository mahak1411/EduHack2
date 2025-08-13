import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Logo({ size = "md", className }: LogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10", 
    lg: "w-12 h-12"
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl", 
    lg: "text-2xl"
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(
        "bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center",
        sizeClasses[size]
      )}>
        <Brain className={cn("text-white", iconSizes[size])} />
      </div>
      <span className={cn(
        "font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent modern-heading",
        textSizes[size]
      )}>
        StudyAI
      </span>
    </div>
  );
}