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
import { Wand2, Download, Save, Edit, Eye } from "lucide-react";

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
    setSelectedFiles(files);
    files.forEach(file => {
      uploadMutation.mutate(file);
    });
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
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex h-screen pt-16">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">AI Flashcard Generator</h2>
                <p className="text-slate-600">Upload your study materials and let AI create personalized flashcards for you.</p>
              </div>

              <Tabs defaultValue="generate" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="generate" data-testid="tab-generate">Generate New</TabsTrigger>
                  <TabsTrigger value="library" data-testid="tab-library">My Flashcards</TabsTrigger>
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
                        data-testid="file-upload-flashcards"
                      />
                      
                      <div className="mt-6">
                        <Label htmlFor="text-content">Or paste your content here:</Label>
                        <Textarea
                          id="text-content"
                          placeholder="Paste your study content here..."
                          value={textContent}
                          onChange={(e) => setTextContent(e.target.value)}
                          className="mt-2 min-h-[120px]"
                          data-testid="textarea-content"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Generation Options */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Generation Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="title">Flashcard Set Title</Label>
                          <Input
                            id="title"
                            placeholder="Enter title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            data-testid="input-title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="card-count">Number of Cards</Label>
                          <Select value={cardCount} onValueChange={setCardCount}>
                            <SelectTrigger data-testid="select-card-count">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 cards</SelectItem>
                              <SelectItem value="10">10 cards</SelectItem>
                              <SelectItem value="20">20 cards</SelectItem>
                              <SelectItem value="30">30 cards</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="card-type">Card Type</Label>
                          <Select value={cardType} onValueChange={setCardType}>
                            <SelectTrigger data-testid="select-card-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Question & Answer">Question & Answer</SelectItem>
                              <SelectItem value="Term & Definition">Term & Definition</SelectItem>
                              <SelectItem value="Concept & Explanation">Concept & Explanation</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="difficulty">Difficulty Level</Label>
                          <Select value={difficulty} onValueChange={setDifficulty}>
                            <SelectTrigger data-testid="select-difficulty">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Beginner">Beginner</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button 
                        onClick={handleGenerate}
                        disabled={isGenerating || !textContent.trim()}
                        className="mt-6 bg-primary text-white hover:bg-blue-700"
                        data-testid="button-generate"
                      >
                        <Wand2 className="mr-2 h-4 w-4" />
                        {isGenerating ? "Generating..." : "Generate Flashcards"}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Generated Flashcards Preview */}
                  {generatedFlashcards.length > 0 && (
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle>Generated Flashcards</CardTitle>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={exportToPDF}
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

                <TabsContent value="library">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Flashcard Sets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {setsLoading ? (
                        <div className="text-center py-8">
                          <p className="text-slate-600">Loading flashcard sets...</p>
                        </div>
                      ) : flashcardSets.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-slate-600">No flashcard sets yet. Generate your first set!</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {flashcardSets.map((set: FlashcardSet) => (
                            <Card key={set.id} className="border border-slate-200 hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <h3 className="font-semibold text-slate-900 mb-2">{set.title}</h3>
                                <p className="text-sm text-slate-600 mb-3">{set.description}</p>
                                <p className="text-xs text-slate-500 mb-3">
                                  Created {new Date(set.createdAt).toLocaleDateString()}
                                </p>
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm" data-testid={`button-view-set-${set.id}`}>
                                    <Eye className="mr-1 h-3 w-3" />
                                    View
                                  </Button>
                                  <Button variant="outline" size="sm" data-testid={`button-edit-set-${set.id}`}>
                                    <Edit className="mr-1 h-3 w-3" />
                                    Edit
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
