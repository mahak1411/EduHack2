import { Bell, ChevronDown, User, Settings, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/ui/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function Header() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-slate-200/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Logo size="md" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 rounded-xl transition-all duration-200 glow-on-hover"
              data-testid="button-notifications"
            >
              <div className="relative">
                <Bell className="mr-2 h-4 w-4" />
                <Badge className="absolute -top-2 -right-2 h-2 w-2 p-0 bg-gradient-to-r from-purple-500 to-pink-500 border-0" />
              </div>
              <span className="modern-body text-sm">Notifications</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-3 text-slate-700 hover:text-slate-900 hover:bg-slate-50/80 rounded-xl transition-all duration-200 px-3 py-2 glow-on-hover"
                  data-testid="button-user-menu"
                >
                  <Avatar className="w-10 h-10 ring-2 ring-purple-200 ring-offset-2 shadow-lg">
                    <AvatarImage 
                      src={user?.profileImageUrl || ""} 
                      alt="User profile"
                      className="object-cover rounded-full"
                    />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-lg">
                      {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold modern-heading" data-testid="text-username">
                      {user?.firstName || user?.email?.split('@')[0] || "User"}
                    </span>
                    <span className="text-xs text-slate-500">Learning Mode</span>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="profile-dropdown w-64" sideOffset={8}>
                <DropdownMenuItem 
                  className="profile-dropdown-item cursor-pointer"
                  onClick={handleProfileClick}
                  data-testid="link-profile"
                >
                  <User className="h-4 w-4 text-slate-600" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="profile-dropdown-item cursor-pointer"
                  data-testid="link-settings"
                >
                  <Settings className="h-4 w-4 text-slate-600" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="profile-dropdown-item cursor-pointer"
                  data-testid="link-upgrade"
                >
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <span>Upgrade Plan</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="profile-dropdown-item cursor-pointer text-red-600 hover:bg-red-50/80"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
