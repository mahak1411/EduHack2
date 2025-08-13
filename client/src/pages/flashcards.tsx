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
import { Wand2, Download, Save, Edit, Eye, Upload, Sparkles, BookOpen, Plus } from "lucide-react";
import ErrorMessage from "@/components/ui/error-message";

interface FlashcardSet {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export default function Flashcards() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [textContent, setTextContent] = useState("");
  const [generatedFlashcards, setGeneratedFlashcards] = useState<Flashcard[]>([]);
  const [currentSet, setCurrentSet] = useState<FlashcardSet | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [cardCount, setCardCount] = useState("10");
  const [cardType, setCardType] = useState("Question & Answer");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [error, setError] = useState<string>("");

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

  // Fetch flashcard sets
  const { data: flashcardSets = [], isLoading: setsLoading } = useQuery<FlashcardSet[]>({
    queryKey: ["/api/flashcards/sets"],
    retry: false,
    enabled: isAuthenticated,
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiRequest("POST", "/api/files/upload", formData, true);
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

  // Generate flashcards mutation
  const generateMutation = useMutation({
    mutationFn: async (options: any) => {
      const response = await apiRequest("POST", "/api/flashcards/generate", {
        content: textContent,
        options,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedFlashcards(data.flashcards || []);
      setCurrentSet(data.set);
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards/sets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Flashcards generated",
        description: `Created ${data.flashcards?.length || 0} flashcards`,
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
        description: "Failed to generate flashcards",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  const handleFileSelect = (files: File[]) => {
    console.log("Files selected in flashcards:", files);
    setSelectedFiles(files);
    // Process files immediately
    files.forEach(file => uploadMutation.mutate(file));
  };

  const handleGenerate = async () => {
    setError("");
    
    if (!textContent.trim()) {
      setError("Please upload a file or enter text content to generate flashcards");
      return;
    }

    if (textContent.trim().length < 50) {
      setError("Content is too short. Please provide at least 50 characters of study material");
      return;
    }

    setIsGenerating(true);
    generateMutation.mutate({
      title: title || "AI Generated Flashcards",
      count: parseInt(cardCount),
      cardType,
      difficulty,
    });
  };



  const exportToPDF = () => {
    toast({
      title: "Export feature",
      description: "PDF export will be implemented soon",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header />
      <div className="flex h-screen pt-16">
        <Sidebar />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
              {/* Modern Header Section */}
              <div className="mb-8 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl float-animation">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4 modern-heading">
                  AI Flashcard Generator
                </h1>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto modern-body">
                  Upload your study materials and let AI create personalized flashcards for you.
                </p>
              </div>

              <Tabs defaultValue="generate" className="space-y-8">
                <TabsList className="bg-white/80 backdrop-blur-md shadow-lg border border-slate-200/60 rounded-2xl p-2">
                  <TabsTrigger 
                    value="generate" 
                    className="rounded-xl px-6 py-3 font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                    data-testid="tab-generate"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Generate New
                  </TabsTrigger>
                  <TabsTrigger 
                    value="library" 
                    className="rounded-xl px-6 py-3 font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                    data-testid="tab-library"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    My Flashcards
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="generate" className="space-y-8">
                  {/* File Upload Section */}
                  <Card className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-2xl modern-heading flex items-center">
                        <Upload className="mr-3 h-6 w-6 text-purple-600" />
                        Upload Study Material
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FileUpload
                        onFileSelect={handleFileSelect}
                        multiple
                        data-testid="file-upload-flashcards"
                      />
                      
                      <div className="mt-8">
                        <Label htmlFor="text-content" className="text-lg font-semibold modern-heading mb-4 block">
                          Or paste your content here:
                        </Label>
                        <Textarea
                          id="text-content"
                          placeholder="Paste your study content here... (minimum 50 characters)"
                          value={textContent}
                          onChange={(e) => {
                            setTextContent(e.target.value);
                            if (error) setError("");
                          }}
                          className="form-input min-h-[140px] resize-none"
                          data-testid="textarea-content"
                        />
                        {error && (
                          <ErrorMessage 
                            message={error} 
                            dismissible 
                            onDismiss={() => setError("")}
                            className="mt-0"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Generation Options */}
                  <Card className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-2xl modern-heading flex items-center">
                        <Sparkles className="mr-3 h-6 w-6 text-purple-600" />
                        Generation Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="title" className="text-sm font-semibold modern-heading mb-2 block">
                            Flashcard Set Title
                          </Label>
                          <Input
                            id="title"
                            placeholder="Enter a descriptive title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="form-input"
                            data-testid="input-title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="card-count" className="text-sm font-semibold modern-heading mb-2 block">
                            Number of Cards
                          </Label>
                          <Select value={cardCount} onValueChange={setCardCount}>
                            <SelectTrigger className="form-input" data-testid="select-card-count">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white shadow-2xl border border-slate-200 rounded-xl">
                              <SelectItem value="5">5 cards</SelectItem>
                              <SelectItem value="10">10 cards</SelectItem>
                              <SelectItem value="20">20 cards</SelectItem>
                              <SelectItem value="30">30 cards</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="card-type" className="text-sm font-semibold modern-heading mb-2 block">
                            Card Type
                          </Label>
                          <Select value={cardType} onValueChange={setCardType}>
                            <SelectTrigger className="form-input" data-testid="select-card-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white shadow-2xl border border-slate-200 rounded-xl">
                              <SelectItem value="Question & Answer">Question & Answer</SelectItem>
                              <SelectItem value="Term & Definition">Term & Definition</SelectItem>
                              <SelectItem value="Concept & Explanation">Concept & Explanation</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="difficulty" className="text-sm font-semibold modern-heading mb-2 block">
                            Difficulty Level
                          </Label>
                          <Select value={difficulty} onValueChange={setDifficulty}>
                            <SelectTrigger className="form-input" data-testid="select-difficulty">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white shadow-2xl border border-slate-200 rounded-xl">
                              <SelectItem value="Beginner">Beginner</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-center mt-8">
                        <Button 
                          onClick={handleGenerate}
                          disabled={isGenerating || !textContent.trim()}
                          className="btn-primary px-8 py-4 text-lg"
                          data-testid="button-generate"
                        >
                          <Wand2 className="mr-3 h-5 w-5" />
                          {isGenerating ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                              Generating Flashcards...
                            </>
                          ) : (
                            "Generate Flashcards"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Generated Flashcards Preview */}
                  {generatedFlashcards.length > 0 && (
                    <Card className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
                      <CardHeader className="pb-6">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-2xl modern-heading flex items-center">
                            <Eye className="mr-3 h-6 w-6 text-green-600" />
                            Generated Flashcards ({generatedFlashcards.length})
                          </CardTitle>
                          <div className="flex space-x-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={exportToPDF}
                              className="border-slate-300 hover:bg-slate-50 rounded-xl"
                              data-testid="button-export-pdf"
                            >
                              <Download className="mr-1 h-4 w-4" />
                              Export PDF
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {generatedFlashcards.map((card, index) => (
                            <Card key={index} className="border border-slate-200" data-testid={`flashcard-${index}`}>
                              <CardContent className="p-4">
                                <div className="mb-3">
                                  <div className="text-xs text-slate-500 mb-1">FRONT</div>
                                  <div className="font-medium text-slate-900">{card.front}</div>
                                </div>
                                <div className="border-t pt-3">
                                  <div className="text-xs text-slate-500 mb-1">BACK</div>
                                  <div className="text-slate-700">{card.back}</div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="library" className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {flashcardSets.map((set) => (
                      <Card 
                        key={set.id} 
                        className="flashcard-container p-6 group"
                        data-testid={`flashcard-set-${set.id}`}
                      >
                        <CardContent className="p-0">
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                              {new Date(set.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <h3 className="font-bold text-xl mb-3 modern-heading text-slate-900" data-testid={`set-title-${set.id}`}>
                            {set.title}
                          </h3>
                          
                          <p className="text-slate-600 text-sm mb-6 modern-body line-clamp-2">
                            {set.description || "AI-generated flashcards ready for study"}
                          </p>
                          
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="btn-secondary flex-1"
                              data-testid={`button-view-${set.id}`}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Study
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-slate-300 hover:bg-slate-50 rounded-xl px-3"
                              data-testid={`button-edit-${set.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {setsLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(3)].map((_, i) => (
                        <Card key={i} className="flashcard-container p-6">
                          <CardContent className="p-0">
                            <div className="loading-shimmer w-full h-40 rounded-xl"></div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  {flashcardSets.length === 0 && !setsLoading && (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="h-12 w-12 text-purple-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-4 modern-heading">No flashcard sets yet</h3>
                      <p className="text-lg text-slate-600 mb-8 modern-body max-w-md mx-auto">
                        Create your first set of AI-generated flashcards to get started on your learning journey.
                      </p>
                      <Button 
                        onClick={() => {
                          const generateTab = document.querySelector('[data-testid="tab-generate"]') as HTMLButtonElement;
                          generateTab?.click();
                        }}
                        className="btn-primary"
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        Create Your First Set
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
