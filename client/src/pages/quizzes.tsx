import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import FileUpload from "@/components/ui/file-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Wand2, Play, Edit, Clock, CheckCircle } from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  createdAt: string;
}

interface QuizQuestion {
  type: string;
  question: string;
  options?: string[];
  correctAnswer: number | boolean | string;
  explanation: string;
}

interface QuizAttempt {
  id: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
}

export default function Quizzes() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [textContent, setTextContent] = useState("");
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [quizResult, setQuizResult] = useState<QuizAttempt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [questionCount, setQuestionCount] = useState("10");
  const [questionTypes, setQuestionTypes] = useState<string[]>(["Multiple Choice"]);
  const [difficulty, setDifficulty] = useState("Intermediate");

  // Redirect if not authenticated
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

  // Fetch quizzes
  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery<any[]>({
    queryKey: ["/api/quizzes"],
    retry: false,
    enabled: isAuthenticated,
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiRequest("POST", "/api/files/upload", formData);
      return response.json();
    },
    onSuccess: (data) => {
      setTextContent(prev => prev + "\n\n" + (data.extractedText || ""));
      toast({
        title: "File uploaded",
        description: "Text extracted successfully",
      });
    },
    onError: (error) => {
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
      toast({
        title: "Upload failed",
        description: "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  // Generate quiz mutation
  const generateMutation = useMutation({
    mutationFn: async (options: any) => {
      const response = await apiRequest("POST", "/api/quizzes/generate", {
        content: textContent,
        options,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedQuiz(data);
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Quiz generated",
        description: `Created quiz with ${data.questions?.length || 0} questions`,
      });
      setIsGenerating(false);
    },
    onError: (error) => {
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
      toast({
        title: "Generation failed",
        description: "Failed to generate quiz",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  // Submit quiz attempt mutation
  const submitMutation = useMutation({
    mutationFn: async ({ quizId, answers }: { quizId: string; answers: any[] }) => {
      const response = await apiRequest("POST", `/api/quizzes/${quizId}/attempts`, {
        answers,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setQuizResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Quiz completed",
        description: `Score: ${data.score}/${data.totalQuestions} (${Math.round((data.score / data.totalQuestions) * 100)}%)`,
      });
      setIsSubmitting(false);
    },
    onError: (error) => {
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
      toast({
        title: "Submission failed",
        description: "Failed to submit quiz",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
    files.forEach(file => {
      uploadMutation.mutate(file);
    });
  };

  const handleQuestionTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setQuestionTypes(prev => [...prev, type]);
    } else {
      setQuestionTypes(prev => prev.filter(t => t !== type));
    }
  };

  const handleGenerate = async () => {
    if (!textContent.trim()) {
      toast({
        title: "No content",
        description: "Please upload a file or enter text content",
        variant: "destructive",
      });
      return;
    }

    if (questionTypes.length === 0) {
      toast({
        title: "No question types",
        description: "Please select at least one question type",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    generateMutation.mutate({
      title: title || "AI Generated Quiz",
      questionCount: parseInt(questionCount),
      questionTypes,
      difficulty,
    });
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setUserAnswers(new Array(quiz.questions.length).fill(null));
    setQuizResult(null);
  };

  const handleAnswerChange = (questionIndex: number, answer: any) => {
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[questionIndex] = answer;
      return newAnswers;
    });
  };

  const handleSubmitQuiz = () => {
    if (!currentQuiz) return;

    const hasUnanswered = userAnswers.some(answer => answer === null || answer === undefined);
    if (hasUnanswered) {
      toast({
        title: "Incomplete quiz",
        description: "Please answer all questions before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    submitMutation.mutate({
      quizId: currentQuiz.id,
      answers: userAnswers,
    });
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

  // Quiz taking view
  if (currentQuiz && !quizResult) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex h-screen pt-16">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{currentQuiz.title}</h2>
                    <p className="text-slate-600">{currentQuiz.description}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentQuiz(null)}
                    data-testid="button-back-to-quizzes"
                  >
                    Back to Quizzes
                  </Button>
                </div>

                <Card className="mb-6">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {currentQuiz.questions.map((question, index) => (
                        <div key={index} className="border border-slate-200 rounded-lg p-4" data-testid={`question-${index}`}>
                          <div className="flex items-start mb-3">
                            <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                              <span className="text-secondary font-medium text-sm">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900 mb-3">{question.question}</h4>
                              
                              {question.type === "Multiple Choice" && question.options && (
                                <RadioGroup 
                                  value={userAnswers[index]?.toString() || ""}
                                  onValueChange={(value) => handleAnswerChange(index, parseInt(value))}
                                >
                                  <div className="space-y-2">
                                    {question.options.map((option, optionIndex) => (
                                      <div key={optionIndex} className="flex items-center space-x-2">
                                        <RadioGroupItem 
                                          value={optionIndex.toString()} 
                                          id={`q${index}-option${optionIndex}`}
                                          data-testid={`radio-q${index}-option${optionIndex}`}
                                        />
                                        <Label 
                                          htmlFor={`q${index}-option${optionIndex}`}
                                          className="text-slate-700 cursor-pointer"
                                        >
                                          {option}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </RadioGroup>
                              )}

                              {question.type === "True/False" && (
                                <RadioGroup 
                                  value={userAnswers[index]?.toString() || ""}
                                  onValueChange={(value) => handleAnswerChange(index, value === "true")}
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="true" id={`q${index}-true`} />
                                      <Label htmlFor={`q${index}-true`} className="text-slate-700 cursor-pointer">
                                        True
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value="false" id={`q${index}-false`} />
                                      <Label htmlFor={`q${index}-false`} className="text-slate-700 cursor-pointer">
                                        False
                                      </Label>
                                    </div>
                                  </div>
                                </RadioGroup>
                              )}

                              {question.type === "Short Answer" && (
                                <Input
                                  placeholder="Enter your answer..."
                                  value={userAnswers[index] || ""}
                                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                                  data-testid={`input-q${index}-answer`}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button 
                        onClick={handleSubmitQuiz}
                        disabled={isSubmitting}
                        className="bg-secondary text-white hover:bg-violet-700"
                        data-testid="button-submit-quiz"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {isSubmitting ? "Submitting..." : "Submit Quiz"}
                      </Button>
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

  // Quiz results view
  if (quizResult && currentQuiz) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex h-screen pt-16">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                <Card>
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Quiz Results</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-6">
                      <div className="text-4xl font-bold text-slate-900 mb-2">
                        {Math.round((quizResult.score / quizResult.totalQuestions) * 100)}%
                      </div>
                      <p className="text-slate-600">
                        You scored {quizResult.score} out of {quizResult.totalQuestions} questions correctly
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Button 
                        onClick={() => {
                          setCurrentQuiz(null);
                          setQuizResult(null);
                          setUserAnswers([]);
                        }}
                        className="bg-primary text-white hover:bg-blue-700"
                        data-testid="button-back-to-quizzes-results"
                      >
                        Back to Quizzes
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setQuizResult(null);
                          setUserAnswers(new Array(currentQuiz.questions.length).fill(null));
                        }}
                        data-testid="button-retake-quiz"
                      >
                        Retake Quiz
                      </Button>
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex h-screen pt-16">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">AI Quiz Generator</h2>
                <p className="text-slate-600">Create comprehensive quizzes from your study materials with various question types.</p>
              </div>

              <Tabs defaultValue="generate" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="generate" data-testid="tab-generate-quiz">Generate New</TabsTrigger>
                  <TabsTrigger value="library" data-testid="tab-library-quiz">My Quizzes</TabsTrigger>
                </TabsList>

                <TabsContent value="generate" className="space-y-6">
                  {/* File Upload Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Upload Study Material</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FileUpload
                        onFileSelect={handleFileSelect}
                        multiple
                        data-testid="file-upload-quizzes"
                      />
                      
                      <div className="mt-6">
                        <Label htmlFor="text-content-quiz">Or paste your content here:</Label>
                        <Textarea
                          id="text-content-quiz"
                          placeholder="Paste your study content here..."
                          value={textContent}
                          onChange={(e) => setTextContent(e.target.value)}
                          className="mt-2 min-h-[120px]"
                          data-testid="textarea-content-quiz"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quiz Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quiz Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="quiz-title">Quiz Title</Label>
                          <Input
                            id="quiz-title"
                            placeholder="Enter quiz title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            data-testid="input-quiz-title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="question-count">Number of Questions</Label>
                          <Select value={questionCount} onValueChange={setQuestionCount}>
                            <SelectTrigger data-testid="select-question-count">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 questions</SelectItem>
                              <SelectItem value="10">10 questions</SelectItem>
                              <SelectItem value="15">15 questions</SelectItem>
                              <SelectItem value="20">20 questions</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Label className="text-sm font-medium text-slate-700 mb-2 block">Question Types</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="flex items-center space-x-2 p-3 border border-slate-200 rounded-lg">
                            <Checkbox
                              id="multiple-choice"
                              checked={questionTypes.includes("Multiple Choice")}
                              onCheckedChange={(checked) => handleQuestionTypeChange("Multiple Choice", !!checked)}
                              data-testid="checkbox-multiple-choice"
                            />
                            <div className="flex-1">
                              <Label htmlFor="multiple-choice" className="font-medium text-slate-900">Multiple Choice</Label>
                              <p className="text-xs text-slate-600">4 options per question</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 p-3 border border-slate-200 rounded-lg">
                            <Checkbox
                              id="true-false"
                              checked={questionTypes.includes("True/False")}
                              onCheckedChange={(checked) => handleQuestionTypeChange("True/False", !!checked)}
                              data-testid="checkbox-true-false"
                            />
                            <div className="flex-1">
                              <Label htmlFor="true-false" className="font-medium text-slate-900">True/False</Label>
                              <p className="text-xs text-slate-600">Binary choice questions</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 p-3 border border-slate-200 rounded-lg">
                            <Checkbox
                              id="short-answer"
                              checked={questionTypes.includes("Short Answer")}
                              onCheckedChange={(checked) => handleQuestionTypeChange("Short Answer", !!checked)}
                              data-testid="checkbox-short-answer"
                            />
                            <div className="flex-1">
                              <Label htmlFor="short-answer" className="font-medium text-slate-900">Short Answer</Label>
                              <p className="text-xs text-slate-600">Written responses</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Label htmlFor="difficulty-quiz">Difficulty Level</Label>
                        <Select value={difficulty} onValueChange={setDifficulty}>
                          <SelectTrigger data-testid="select-difficulty-quiz">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button 
                        onClick={handleGenerate}
                        disabled={isGenerating || !textContent.trim()}
                        className="mt-6 bg-secondary text-white hover:bg-violet-700"
                        data-testid="button-generate-quiz"
                      >
                        <Wand2 className="mr-2 h-4 w-4" />
                        {isGenerating ? "Generating..." : "Generate Quiz"}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Generated Quiz Preview */}
                  {generatedQuiz && (
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle>Quiz Preview</CardTitle>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid="button-edit-quiz"
                            >
                              <Edit className="mr-1 h-4 w-4" />
                              Edit Questions
                            </Button>
                            <Button 
                              onClick={() => handleStartQuiz(generatedQuiz)}
                              className="bg-secondary text-white hover:bg-violet-700"
                              data-testid="button-start-quiz"
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Start Quiz
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {generatedQuiz.questions.slice(0, 3).map((question, index) => (
                            <div key={index} className="border border-slate-200 rounded-lg p-4" data-testid={`preview-question-${index}`}>
                              <div className="flex items-start mb-3">
                                <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                  <span className="text-secondary font-medium text-sm">{index + 1}</span>
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-slate-900 mb-3">{question.question}</h4>
                                  {question.type === "Multiple Choice" && question.options && (
                                    <div className="space-y-2">
                                      {question.options.map((option, optionIndex) => (
                                        <div key={optionIndex} className="flex items-center p-2 rounded-lg hover:bg-slate-50">
                                          <div className="w-4 h-4 border border-slate-300 rounded-full mr-3"></div>
                                          <span className="text-slate-700">{option}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {generatedQuiz.questions.length > 3 && (
                            <p className="text-center text-slate-600 text-sm">
                              And {generatedQuiz.questions.length - 3} more questions...
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="library">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Quizzes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {quizzesLoading ? (
                        <div className="text-center py-8">
                          <p className="text-slate-600">Loading quizzes...</p>
                        </div>
                      ) : quizzes.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-slate-600">No quizzes yet. Generate your first quiz!</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {quizzes.map((quiz: Quiz) => (
                            <Card key={quiz.id} className="border border-slate-200 hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <h3 className="font-semibold text-slate-900 mb-2">{quiz.title}</h3>
                                <p className="text-sm text-slate-600 mb-3">{quiz.description}</p>
                                <p className="text-xs text-slate-500 mb-3">
                                  {quiz.questions.length} questions • Created {new Date(quiz.createdAt).toLocaleDateString()}
                                </p>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleStartQuiz(quiz)}
                                    data-testid={`button-start-quiz-${quiz.id}`}
                                  >
                                    <Play className="mr-1 h-3 w-3" />
                                    Start
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    data-testid={`button-view-quiz-${quiz.id}`}
                                  >
                                    <Clock className="mr-1 h-3 w-3" />
                                    History
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
