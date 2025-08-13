import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  BookOpen, 
  HelpCircle, 
  StickyNote, 
  Trophy,
  Sparkles,
  Brain,
  Zap,
  Target,
  TrendingUp
} from "lucide-react";
import ComprehensiveGenerator from "@/components/comprehensive-generator";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();

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

  const { data: stats, isLoading: statsLoading } = useQuery<{
    flashcardSets: number;
    quizzesTaken: number;
    studyNotes: number;
    avgQuizScore: number;
  }>({
    queryKey: ["/api/user/stats"],
    retry: false,
    enabled: isAuthenticated,
  });

  const handleError = (error: Error) => {
    if (isUnauthorizedError(error)) {
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
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <i className="fas fa-brain text-white text-sm"></i>
          </div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header />
      <div className="flex h-screen pt-16">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {/* Modern Welcome Section */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center float-animation pulse-glow">
                  <Brain className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-6xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
                Welcome back, {user?.firstName || user?.email?.split('@')[0] || "Amazing Learner"}! ✨
              </h1>
              <p className="text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Continue your AI-powered learning journey. Create, study, and master knowledge like never before! 🚀
              </p>
            </div>

            {/* Modern Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 hover:scale-105 transition-transform duration-300 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium mb-2">💳 Flashcard Sets</p>
                      <p className="text-4xl font-bold" data-testid="stat-flashcard-sets">
                        {statsLoading ? "..." : stats?.flashcardSets || 0}
                      </p>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 hover:scale-105 transition-transform duration-300 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium mb-2">🧠 Quizzes Taken</p>
                      <p className="text-4xl font-bold" data-testid="stat-quizzes-taken">
                        {statsLoading ? "..." : stats?.quizzesTaken || 0}
                      </p>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center">
                      <HelpCircle className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0 hover:scale-105 transition-transform duration-300 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium mb-2">📝 Study Notes</p>
                      <p className="text-4xl font-bold" data-testid="stat-study-notes">
                        {statsLoading ? "..." : stats?.studyNotes || 0}
                      </p>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center">
                      <StickyNote className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-pink-600 text-white border-0 hover:scale-105 transition-transform duration-300 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium mb-2">🏆 Avg Quiz Score</p>
                      <p className="text-4xl font-bold" data-testid="stat-avg-score">
                        {statsLoading ? "..." : `${Math.round(stats?.avgQuizScore || 0)}%`}
                      </p>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center">
                      <Trophy className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Study Generator */}
            <div className="mb-8">
              <ComprehensiveGenerator />
            </div>

            {/* Modern Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <Card className="bg-white/80 backdrop-blur-sm border-2 border-purple-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 group">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform">
                    <BookOpen className="text-white h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">🎯 AI Flashcard Generator</h3>
                  <p className="text-slate-600 text-base mb-6 leading-relaxed">
                    Upload your study materials and generate interactive flashcards instantly with advanced AI.
                  </p>
                  <Button 
                    onClick={() => navigate("/flashcards")}
                    className="w-full bg-primary text-white hover:bg-blue-700"
                    data-testid="button-generate-flashcards"
                  >
                    Generate Flashcards
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <HelpCircle className="text-secondary h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">AI Quiz Generator</h3>
                  <p className="text-slate-600 text-sm mb-4">
                    Create comprehensive quizzes from your study content automatically.
                  </p>
                  <Button 
                    onClick={() => navigate("/quizzes")}
                    className="w-full bg-secondary text-white hover:bg-violet-700"
                    data-testid="button-create-quiz"
                  >
                    Create Quiz
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <StickyNote className="text-accent h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">AI Notes Summarizer</h3>
                  <p className="text-slate-600 text-sm mb-4">
                    Transform lengthy documents into concise, organized study notes.
                  </p>
                  <Button 
                    onClick={() => navigate("/notes")}
                    className="w-full bg-accent text-white hover:bg-emerald-700"
                    data-testid="button-summarize-notes"
                  >
                    Summarize Notes
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Study Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-slate-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">Total Study Materials</span>
                        <span className="font-medium text-slate-900">
                          {((stats?.flashcardSets || 0) + (stats?.studyNotes || 0))}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: "70%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">Quiz Performance</span>
                        <span className="font-medium text-slate-900">
                          {Math.round(stats?.avgQuizScore || 0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-accent h-2 rounded-full" 
                          style={{ width: `${Math.round(stats?.avgQuizScore || 0)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Getting Started</h3>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-medium text-sm">1</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-slate-900">Upload study materials</p>
                        <p className="text-xs text-slate-500">PDF, images, or text files</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                        <span className="text-secondary font-medium text-sm">2</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-slate-900">Generate study tools</p>
                        <p className="text-xs text-slate-500">Flashcards, quizzes, or notes</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                        <span className="text-accent font-medium text-sm">3</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-slate-900">Study and track progress</p>
                        <p className="text-xs text-slate-500">Review and improve</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
