import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  Brain, 
  BookOpen, 
  HelpCircle, 
  StickyNote,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Eye,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface GenerationResult {
  success: boolean;
  materials: {
    summary: {
      id: string;
      title: string;
      content: string;
    };
    quiz: {
      id: string;
      title: string;
      questionCount: number;
      questions: any[];
    };
    flashcards: {
      id: string;
      title: string;
      cardCount: number;
      cards: any[];
    };
  };
}

export default function ComprehensiveGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState("");
  const [title, setTitle] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [requiresManualInput, setRequiresManualInput] = useState(false);
  const [extractionMessage, setExtractionMessage] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/generate-all-materials', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Generation failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.requiresManualInput) {
        setRequiresManualInput(true);
        setExtractionMessage(data.extractionResult || data.message);
        toast({
          title: "Manual Input Required",
          description: "Please copy and paste the text content manually.",
        });
      } else {
        setGenerationResult(data);
        setRequiresManualInput(false);
        
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
        queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
        queryClient.invalidateQueries({ queryKey: ['/api/flashcards/sets'] });
        queryClient.invalidateQueries({ queryKey: ['/api/recent-activity'] });
        
        toast({
          title: "Success!",
          description: "All study materials generated successfully.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate study materials",
        variant: "destructive",
      });
    }
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: "Unsupported File Type",
        description: "Please upload a PDF, text file, or image (JPG, PNG).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setRequiresManualInput(false);
    setExtractionMessage("");
    
    // Auto-set title from filename
    if (!title) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExt);
    }
  };

  const handleGenerate = () => {
    const formData = new FormData();
    
    if (file) {
      formData.append('file', file);
    }
    
    if (manualText.trim()) {
      formData.append('content', manualText.trim());
    }
    
    if (title.trim()) {
      formData.append('title', title.trim());
    }

    generateMutation.mutate(formData);
  };

  const hasContent = file || manualText.trim().length > 0;
  const isGenerating = generateMutation.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">AI Study Materials Generator</CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Upload a PDF or paste text to automatically generate summary, quiz, and flashcards
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">Study Material Title (Optional)</Label>
            <Input
              id="title"
              placeholder="e.g., Biology Chapter 3, Physics Laws, History Notes..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* File Upload Area */}
          <div className="space-y-4">
            <Label>Upload Study Material</Label>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-slate-300 hover:border-slate-400",
                file && "border-green-500 bg-green-50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-2">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                  <p className="font-medium text-green-700">{file.name}</p>
                  <p className="text-sm text-slate-600">
                    {(file.size / 1024 / 1024).toFixed(1)}MB • Ready for processing
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setRequiresManualInput(false);
                      setExtractionMessage("");
                    }}
                  >
                    Remove File
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 text-slate-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-slate-700">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Supports PDF, TXT, JPG, PNG • Max 10MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                  <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    accept=".pdf,.txt,.jpg,.jpeg,.png"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Manual Text Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="manual-text">Or Paste Text Content</Label>
              {manualText.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {manualText.length} characters
                </Badge>
              )}
            </div>
            <Textarea
              id="manual-text"
              placeholder="Paste your study content here..."
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              rows={8}
              className="min-h-[200px]"
            />
          </div>

          {/* Extraction Message for Failed PDFs */}
          {requiresManualInput && extractionMessage && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-amber-800">Manual Input Required</p>
                    <pre className="whitespace-pre-wrap text-amber-700 text-xs">
                      {extractionMessage}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generate Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleGenerate}
              disabled={!hasContent || isGenerating}
              size="lg"
              className="px-8"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating All Materials...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate All Study Materials
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generation Progress */}
      {isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium text-slate-900">Creating Your Study Materials</h3>
                <p className="text-sm text-slate-600 mt-1">
                  AI is analyzing your content and generating comprehensive study resources...
                </p>
              </div>
              <Progress value={65} className="w-full" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <StickyNote className="h-6 w-6 text-yellow-600" />
                  <span className="text-xs text-slate-600">Summary</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <HelpCircle className="h-6 w-6 text-green-600" />
                  <span className="text-xs text-slate-600">Quiz</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                  <span className="text-xs text-slate-600">Flashcards</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {generationResult && (
        <div className="space-y-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">All Study Materials Generated!</h3>
                  <p className="text-sm text-green-700">
                    Your comprehensive study package is ready to use.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg border">
                  <StickyNote className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <h4 className="font-medium text-slate-900">Study Summary</h4>
                  <p className="text-sm text-slate-600">Concise overview</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <HelpCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-slate-900">Mixed Quiz</h4>
                  <p className="text-sm text-slate-600">{generationResult.materials.quiz.questionCount} questions</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border">
                  <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium text-slate-900">Flashcard Set</h4>
                  <p className="text-sm text-slate-600">{generationResult.materials.flashcards.cardCount} cards</p>
                </div>
              </div>

              <div className="flex justify-center gap-4 mt-6">
                <Button onClick={() => window.location.href = '/library'}>
                  <Eye className="h-4 w-4 mr-2" />
                  View in Library
                </Button>
                <Button variant="outline" onClick={() => {
                  setGenerationResult(null);
                  setFile(null);
                  setManualText("");
                  setTitle("");
                }}>
                  Generate More
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Preview */}
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">📝 Summary</TabsTrigger>
              <TabsTrigger value="quiz">🧠 Quiz</TabsTrigger>
              <TabsTrigger value="flashcards">💡 Flashcards</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{generationResult.materials.summary.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap">
                      {generationResult.materials.summary.content}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="quiz" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{generationResult.materials.quiz.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {generationResult.materials.quiz.questions.slice(0, 3).map((question, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <p className="font-medium mb-2">Q{index + 1}: {question.question}</p>
                        {question.type === 'multiple-choice' && question.options && (
                          <div className="space-y-1 text-sm text-slate-600">
                            {question.options.map((option: string, optIndex: number) => (
                              <div key={optIndex}>• {option}</div>
                            ))}
                          </div>
                        )}
                        <Badge variant="outline" className="mt-2 text-xs">
                          {question.type.replace('-', ' ')}
                        </Badge>
                      </div>
                    ))}
                    {generationResult.materials.quiz.questions.length > 3 && (
                      <p className="text-sm text-slate-500 text-center">
                        +{generationResult.materials.quiz.questions.length - 3} more questions
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="flashcards" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{generationResult.materials.flashcards.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generationResult.materials.flashcards.cards.slice(0, 4).map((card, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="mb-2">
                          <Badge variant="secondary" className="text-xs">Front</Badge>
                          <p className="text-sm mt-1">{card.front}</p>
                        </div>
                        <div>
                          <Badge variant="secondary" className="text-xs">Back</Badge>
                          <p className="text-sm mt-1 text-slate-600">{card.back}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {generationResult.materials.flashcards.cards.length > 4 && (
                    <p className="text-sm text-slate-500 text-center mt-4">
                      +{generationResult.materials.flashcards.cards.length - 4} more flashcards
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}