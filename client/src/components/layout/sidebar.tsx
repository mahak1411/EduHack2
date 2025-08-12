import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  BookOpen, 
  HelpCircle, 
  StickyNote, 
  Library 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "AI Flashcards", href: "/flashcards", icon: BookOpen },
  { name: "AI Quizzes", href: "/quizzes", icon: HelpCircle },
  { name: "AI Notes", href: "/notes", icon: StickyNote },
  { name: "Study Library", href: "/library", icon: Library },
];

function RecentActivity() {
  const { data: recentItems, isLoading } = useQuery({
    queryKey: ['/api/recent-activity'],
    staleTime: 30000, // Cache for 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center px-3 py-2 text-sm">
          <div className="w-2 h-2 bg-gray-300 rounded-full mr-3 animate-pulse"></div>
          <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
        </div>
        <div className="flex items-center px-3 py-2 text-sm">
          <div className="w-2 h-2 bg-gray-300 rounded-full mr-3 animate-pulse"></div>
          <div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!recentItems || recentItems.length === 0) {
    return (
      <div className="px-3 py-4 text-xs text-slate-500">
        Start creating flashcards, quizzes, or notes to see your recent activity here.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentItems.slice(0, 3).map((item: any, index: number) => (
        <div key={index} className="flex items-center px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md cursor-pointer">
          <div className={cn(
            "w-2 h-2 rounded-full mr-3",
            item.type === 'flashcard' && "bg-blue-500",
            item.type === 'quiz' && "bg-green-500", 
            item.type === 'note' && "bg-yellow-500",
            !item.type && "bg-slate-400"
          )}></div>
          <span className="truncate">{item.title || item.name || 'Study Item'}</span>
        </div>
      ))}
    </div>
  );
}

export default function Sidebar() {
  const [location, navigate] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-slate-200 flex-shrink-0">
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.href)}
                className={cn(
                  "w-full group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(" ", "-")}`}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.name}
              </button>
            );
          })}
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Recent Activity
          </div>
          <RecentActivity />
        </div>
      </nav>
    </aside>
  );
}
