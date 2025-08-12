import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  BookOpen, 
  HelpCircle, 
  StickyNote, 
  Library 
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "AI Flashcards", href: "/flashcards", icon: BookOpen },
  { name: "AI Quizzes", href: "/quizzes", icon: HelpCircle },
  { name: "AI Notes", href: "/notes", icon: StickyNote },
  { name: "Study Library", href: "/library", icon: Library },
];

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
          <div className="space-y-2">
            <div className="flex items-center px-3 py-2 text-sm text-slate-600">
              <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
              <span>Biology Flashcards</span>
            </div>
            <div className="flex items-center px-3 py-2 text-sm text-slate-600">
              <div className="w-2 h-2 bg-secondary rounded-full mr-3"></div>
              <span>Math Quiz Completed</span>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}
