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
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Modern Welcome Section */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center float-animation pulse-glow shadow-2xl">
                  <Brain className="h-10 w-10 text-white" />
                </div>
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-6 modern-heading tracking-tight">
                Welcome back, {user?.firstName || user?.email?.split('@')[0] || "Amazing Learner"}!
              </h1>
              <p className="text-xl lg:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed modern-body font-medium">
                Continue your AI-powered learning journey. Create, study, and master knowledge like never before with our advanced educational tools.
              </p>
            </div>

            {/* Modern Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-xl glow-on-hover rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-semibold mb-2 modern-body">Flashcard Sets</p>
                      <p className="text-3xl font-bold modern-heading" data-testid="stat-flashcard-sets">
                        {statsLoading ? (
                          <div className="loading-shimmer w-12 h-8 rounded" />
                        ) : (
                          stats?.flashcardSets || 0
                        )}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <BookOpen className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-xl glow-on-hover rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-semibold mb-2 modern-body">Quizzes Taken</p>
                      <p className="text-3xl font-bold modern-heading" data-testid="stat-quizzes-taken">
                        {statsLoading ? (
                          <div className="loading-shimmer w-12 h-8 rounded" />
                        ) : (
                          stats?.quizzesTaken || 0
                        )}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <HelpCircle className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-xl glow-on-hover rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-semibold mb-2 modern-body">Study Notes</p>
                      <p className="text-3xl font-bold modern-heading" data-testid="stat-study-notes">
                        {statsLoading ? (
                          <div className="loading-shimmer w-12 h-8 rounded" />
                        ) : (
                          stats?.studyNotes || 0
                        )}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <StickyNote className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-pink-600 text-white border-0 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 shadow-xl glow-on-hover rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-semibold mb-2 modern-body">Avg Quiz Score</p>
                      <p className="text-3xl font-bold modern-heading" data-testid="stat-avg-score">
                        {statsLoading ? (
                          <div className="loading-shimmer w-16 h-8 rounded" />
                        ) : (
                          `${Math.round(stats?.avgQuizScore || 0)}%`
                        )}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Trophy className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Study Generator */}
            <div className="mb-8">
              <ComprehensiveGenerator />
            </div>

            {/* Modern AI Tools Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {/* Flashcard Generator Card */}
              <Card className="tool-card rounded-3xl p-8 text-center group border-2 border-purple-100">
                <CardContent className="p-0">
                  <div className="tool-card-icon gradient-flashcard">
                    <BookOpen className="text-white h-10 w-10" />
                  </div>
                  <h3 className="tool-card-title modern-heading">
                    AI Flashcard Generator
                  </h3>
                  <p className="tool-card-description modern-body">
                    Upload your study materials and generate interactive flashcards instantly with advanced AI technology.
                  </p>
                  <Button 
                    onClick={() => navigate("/flashcards")}
                    className="tool-card-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 glow-on-hover"
                    data-testid="button-generate-flashcards"
                  >
                    Generate Flashcards
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Quiz Generator Card */}
              <Card className="tool-card rounded-3xl p-8 text-center group border-2 border-blue-100">
                <CardContent className="p-0">
                  <div className="tool-card-icon gradient-quiz">
                    <HelpCircle className="text-white h-10 w-10" />
                  </div>
                  <h3 className="tool-card-title modern-heading">
                    AI Quiz Generator
                  </h3>
                  <p className="tool-card-description modern-body">
                    Create comprehensive quizzes from your study content automatically with intelligent question generation.
                  </p>
                  <Button 
                    onClick={() => navigate("/quizzes")}
                    className="tool-card-button bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 glow-on-hover"
                    data-testid="button-create-quiz"
                  >
                    Create Quiz
                    <Target className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Notes Summarizer Card */}
              <Card className="tool-card rounded-3xl p-8 text-center group border-2 border-green-100">
                <CardContent className="p-0">
                  <div className="tool-card-icon gradient-notes">
                    <StickyNote className="text-white h-10 w-10" />
                  </div>
                  <h3 className="tool-card-title modern-heading">
                    AI Notes Summarizer
                  </h3>
                  <p className="tool-card-description modern-body">
                    Transform lengthy documents into concise, organized study notes with smart summarization algorithms.
                  </p>
                  <Button 
                    onClick={() => navigate("/notes")}
                    className="tool-card-button bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 glow-on-hover"
                    data-testid="button-summarize-notes"
                  >
                    Summarize Notes
                    <Zap className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Study Progress & Getting Started */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl glow-on-hover">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6 modern-heading flex items-center">
                    <TrendingUp className="mr-3 h-6 w-6 text-purple-600" />
                    Quick Stats
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-3">
                        <span className="text-slate-600 font-medium modern-body">Total Study Materials</span>
                        <span className="font-bold text-slate-900 text-lg modern-heading">
                          {((stats?.flashcardSets || 0) + (stats?.studyNotes || 0))}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out" 
                          style={{ width: "70%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-3">
                        <span className="text-slate-600 font-medium modern-body">Quiz Performance</span>
                        <span className="font-bold text-slate-900 text-lg modern-heading">
                          {Math.round(stats?.avgQuizScore || 0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500 ease-out" 
                          style={{ width: `${Math.round(stats?.avgQuizScore || 0)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl glow-on-hover">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6 modern-heading flex items-center">
                    <Sparkles className="mr-3 h-6 w-6 text-blue-600" />
                    Getting Started
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-all duration-200">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm modern-heading">1</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold text-slate-900 modern-heading">Upload study materials</p>
                        <p className="text-xs text-slate-500 modern-body">PDF, images, or text files</p>
                      </div>
                    </div>
                    <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl hover:shadow-md transition-all duration-200">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm modern-heading">2</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold text-slate-900 modern-heading">Generate study tools</p>
                        <p className="text-xs text-slate-500 modern-body">Flashcards, quizzes, or notes</p>
                      </div>
                    </div>
                    <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition-all duration-200">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm modern-heading">3</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold text-slate-900 modern-heading">Study and track progress</p>
                        <p className="text-xs text-slate-500 modern-body">Review and improve</p>
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
