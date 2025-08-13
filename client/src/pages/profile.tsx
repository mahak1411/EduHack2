import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Calendar, 
  Settings, 
  Save, 
  Loader2,
  Camera,
  Check,
  X
} from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  preferences?: {
    theme?: string;
    notifications?: boolean;
    language?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function Profile() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    avatarUrl: ""
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: profile, isLoading: profileLoading, error } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    retry: false,
    enabled: isAuthenticated,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      return apiRequest('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setIsEditing(false);
      setValidationErrors({});
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  });

  // Handle errors
  useEffect(() => {
    if (error && isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        bio: profile.bio || "",
        avatarUrl: profile.avatarUrl || ""
      });
    }
  }, [profile]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (formData.firstName.trim().length < 1) {
      errors.firstName = "First name is required";
    }
    
    if (formData.firstName.trim().length > 50) {
      errors.firstName = "First name must be less than 50 characters";
    }
    
    if (formData.lastName.trim().length > 50) {
      errors.lastName = "Last name must be less than 50 characters";
    }
    
    if (formData.bio.length > 500) {
      errors.bio = "Bio must be less than 500 characters";
    }
    
    if (formData.avatarUrl && !isValidUrl(formData.avatarUrl)) {
      errors.avatarUrl = "Please enter a valid URL for profile picture";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSave = () => {
    if (validateForm()) {
      updateProfileMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        bio: profile.bio || "",
        avatarUrl: profile.avatarUrl || ""
      });
    }
    setValidationErrors({});
    setIsEditing(false);
  };

  const getInitials = () => {
    const firstName = profile?.firstName || user?.firstName || "";
    const lastName = profile?.lastName || user?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 
           profile?.email?.charAt(0).toUpperCase() || "U";
  };

  const getDisplayName = () => {
    const firstName = profile?.firstName || user?.firstName || "";
    const lastName = profile?.lastName || user?.lastName || "";
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return profile?.email?.split('@')[0] || "User";
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <User className="text-white text-sm" />
          </div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex h-screen pt-16">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Profile Settings</h1>
              <p className="text-slate-600">Manage your account information and preferences</p>
            </div>

            {profileLoading ? (
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2 text-slate-600">Loading profile...</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Profile Overview Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Information
                      </CardTitle>
                      {!isEditing && (
                        <Button 
                          onClick={() => setIsEditing(true)}
                          variant="outline"
                          size="sm"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage 
                          src={isEditing ? formData.avatarUrl : profile?.avatarUrl} 
                          alt="Profile picture" 
                        />
                        <AvatarFallback className="text-lg font-semibold">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-slate-900">
                          {getDisplayName()}
                        </h3>
                        <p className="text-slate-600 flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {profile?.email}
                        </p>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <Calendar className="h-4 w-4" />
                          Member since {new Date(profile?.createdAt || '').toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Editable Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        {isEditing ? (
                          <div>
                            <Input
                              id="firstName"
                              value={formData.firstName}
                              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                              placeholder="Enter your first name"
                              className={validationErrors.firstName ? "border-red-500" : ""}
                            />
                            {validationErrors.firstName && (
                              <p className="text-red-500 text-sm mt-1">{validationErrors.firstName}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-slate-900 py-2">
                            {profile?.firstName || "Not set"}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        {isEditing ? (
                          <div>
                            <Input
                              id="lastName"
                              value={formData.lastName}
                              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                              placeholder="Enter your last name"
                              className={validationErrors.lastName ? "border-red-500" : ""}
                            />
                            {validationErrors.lastName && (
                              <p className="text-red-500 text-sm mt-1">{validationErrors.lastName}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-slate-900 py-2">
                            {profile?.lastName || "Not set"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      {isEditing ? (
                        <div>
                          <Textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) => setFormData({...formData, bio: e.target.value})}
                            placeholder="Tell us about yourself..."
                            rows={3}
                            className={validationErrors.bio ? "border-red-500" : ""}
                          />
                          <div className="flex justify-between items-center mt-1">
                            {validationErrors.bio && (
                              <p className="text-red-500 text-sm">{validationErrors.bio}</p>
                            )}
                            <p className="text-sm text-slate-500 ml-auto">
                              {formData.bio.length}/500 characters
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-900 py-2 whitespace-pre-wrap">
                          {profile?.bio || "No bio added yet"}
                        </p>
                      )}
                    </div>

                    {/* Profile Picture URL */}
                    {isEditing && (
                      <div className="space-y-2">
                        <Label htmlFor="avatarUrl">
                          <Camera className="h-4 w-4 inline mr-1" />
                          Profile Picture URL
                        </Label>
                        <div>
                          <Input
                            id="avatarUrl"
                            value={formData.avatarUrl}
                            onChange={(e) => setFormData({...formData, avatarUrl: e.target.value})}
                            placeholder="https://example.com/your-photo.jpg"
                            className={validationErrors.avatarUrl ? "border-red-500" : ""}
                          />
                          {validationErrors.avatarUrl && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.avatarUrl}</p>
                          )}
                          <p className="text-sm text-slate-500 mt-1">
                            Enter a URL to your profile picture (optional)
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {isEditing && (
                      <div className="flex gap-3 pt-4">
                        <Button 
                          onClick={handleSave} 
                          disabled={updateProfileMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          {updateProfileMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Save Changes
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleCancel}
                          disabled={updateProfileMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Account Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">User ID</Label>
                        <p className="text-slate-600 font-mono text-sm">{profile?.id}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Account Status</Label>
                        <div className="mt-1">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <Check className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Last Updated</Label>
                        <p className="text-slate-600">
                          {new Date(profile?.updatedAt || '').toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}