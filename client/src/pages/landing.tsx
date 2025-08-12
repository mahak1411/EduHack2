import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, BookOpen, Zap, Users, CheckCircle } from "lucide-react";
import Logo from "@/components/ui/logo";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Logo size="md" />
            </div>
            <Button 
              onClick={handleLogin}
              className="bg-primary text-white hover:bg-blue-700"
              data-testid="button-login"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            AI-Powered Learning
            <span className="block text-primary">Made Simple</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Transform your study materials into interactive flashcards, comprehensive quizzes, 
            and organized notes with the power of artificial intelligence.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-primary text-white hover:bg-blue-700 text-lg px-8 py-3"
            data-testid="button-hero-start"
          >
            Start Learning for Free
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Everything You Need to Study Smarter
            </h2>
            <p className="text-xl text-slate-600">
              Powerful AI tools to enhance your learning experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border border-slate-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="text-primary text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">AI Flashcard Generator</h3>
                <p className="text-slate-600">
                  Upload your study materials and instantly generate personalized flashcards 
                  tailored to your learning needs.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="text-secondary text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Smart Quiz Creator</h3>
                <p className="text-slate-600">
                  Create comprehensive quizzes with multiple question types to test 
                  your knowledge and track progress.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Users className="text-accent text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Intelligent Notes</h3>
                <p className="text-slate-600">
                  Transform lengthy documents into concise, well-organized study notes 
                  that capture key concepts.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Why Choose StudyAI?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="text-accent mr-3 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-semibold text-slate-900">Save Time</h4>
                    <p className="text-slate-600">Instantly generate study materials instead of creating them manually</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="text-accent mr-3 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-semibold text-slate-900">Learn Better</h4>
                    <p className="text-slate-600">AI-powered content helps you focus on what matters most</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="text-accent mr-3 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-semibold text-slate-900">Track Progress</h4>
                    <p className="text-slate-600">Monitor your learning journey with detailed analytics</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="text-accent mr-3 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-semibold text-slate-900">Export Anywhere</h4>
                    <p className="text-slate-600">Download your materials in various formats for offline use</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Study Progress</span>
                  <span className="text-sm font-bold text-primary">85%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: "85%" }}></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900">124</div>
                    <div className="text-sm text-slate-600">Flashcards</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900">18</div>
                    <div className="text-sm text-slate-600">Quizzes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Study Routine?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of students already learning smarter with StudyAI
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            variant="secondary"
            className="bg-white text-primary hover:bg-slate-100 text-lg px-8 py-3"
            data-testid="button-cta-start"
          >
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center mr-2">
              <Brain className="text-white text-xs" />
            </div>
            <span className="font-bold text-slate-900">StudyAI</span>
          </div>
          <p className="text-slate-600 text-sm">
            © 2024 StudyAI. Empowering learners with artificial intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
}
