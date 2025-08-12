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
import { Wand2, Download, Save, Edit, Eye, FileText, Trash2 } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  originalContent: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function Notes() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [textContent, setTextContent] = useState("");
  const [generatedNote, setGeneratedNote] = useState<Note | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [summaryLength, setSummaryLength] = useState("Medium");
  const [outputFormat, setOutputFormat] = useState("Bullet Points");
  const [focusAreas, setFocusAreas] = useState<string[]>(["Key Concepts"]);

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

  // Fetch notes
  const { data: notes = [], isLoading: notesLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
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

  // Generate notes mutation
  const generateMutation = useMutation({
    mutationFn: async (options: any) => {
      const response = await apiRequest("POST", "/api/notes/generate", {
        content: textContent,
        options,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedNote(data);
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Notes generated",
        description: "Summary created successfully",
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
        description: "Failed to generate notes",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  // Delete note mutation
  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await apiRequest("DELETE", `/api/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Note deleted",
        description: "Note removed successfully",
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
        title: "Delete failed",
        description: "Failed to delete note",
        variant: "destructive",
      });
    },
  });

  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleEdit = (note: Note) => {
    setEditingNote(note.id);
    setEditContent(note.content);
  };

  const saveEdit = useMutation({
    mutationFn: async ({ noteId, content }: { noteId: string; content: string }) => {
      return await apiRequest("PATCH", `/api/notes/${noteId}`, { summary: content });
    },
    onSuccess: () => {
      setEditingNote(null);
      setEditContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Note updated",
        description: "Your changes have been saved",
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
        title: "Save failed",
        description: "Failed to save changes",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
    files.forEach(file => {
      uploadMutation.mutate(file);
    });
  };

  const handleFocusAreaChange = (area: string, checked: boolean) => {
    if (checked) {
      setFocusAreas(prev => [...prev, area]);
    } else {
      setFocusAreas(prev => prev.filter(a => a !== area));
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

    setIsGenerating(true);
    generateMutation.mutate({
      title: title || "AI Generated Notes",
      length: summaryLength,
      format: outputFormat,
      focusAreas,
    });
  };

  const exportNote = (note: Note) => {
    // Create a simple text export
    const exportContent = `${note.title}\n\n${note.content}`;
    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
                <h2 className="text-2xl font-bold text-slate-900 mb-2">AI Notes Summarizer</h2>
                <p className="text-slate-600">Transform lengthy documents into concise, well-organized study notes automatically.</p>
              </div>

              <Tabs defaultValue="generate" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="generate" data-testid="tab-generate-notes">Generate New</TabsTrigger>
                  <TabsTrigger value="library" data-testid="tab-library-notes">My Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="generate" className="space-y-6">
                  {/* Input Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Text Input */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Input Content</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FileUpload
                          onFileSelect={handleFileSelect}
                          multiple
                          data-testid="file-upload-notes"
                        />
                        <div className="text-center text-slate-500 text-sm">OR</div>
                        <div>
                          <Label htmlFor="text-content-notes">Paste your content here:</Label>
                          <Textarea
                            id="text-content-notes"
                            placeholder="Paste your study content here..."
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                            className="mt-2 min-h-[200px] resize-none"
                            data-testid="textarea-content-notes"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Summary Options */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Summary Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="note-title">Note Title</Label>
                          <Input
                            id="note-title"
                            placeholder="Enter note title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            data-testid="input-note-title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="summary-length">Summary Length</Label>
                          <Select value={summaryLength} onValueChange={setSummaryLength}>
                            <SelectTrigger data-testid="select-summary-length">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Brief">Brief (1-2 paragraphs)</SelectItem>
                              <SelectItem value="Medium">Medium (3-5 paragraphs)</SelectItem>
                              <SelectItem value="Detailed">Detailed (6+ paragraphs)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-700 mb-2 block">Focus Areas</Label>
                          <div className="space-y-2">
                            {["Key Concepts", "Important Dates", "Formulas & Equations", "Examples & Cases"].map((area) => (
                              <div key={area} className="flex items-center">
                                <Checkbox
                                  id={`focus-${area.replace(/\s/g, '-').toLowerCase()}`}
                                  checked={focusAreas.includes(area)}
                                  onCheckedChange={(checked) => handleFocusAreaChange(area, !!checked)}
                                  data-testid={`checkbox-focus-${area.replace(/\s/g, '-').toLowerCase()}`}
                                />
                                <Label 
                                  htmlFor={`focus-${area.replace(/\s/g, '-').toLowerCase()}`}
                                  className="ml-2 text-sm text-slate-700"
                                >
                                  {area}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-700 mb-2 block">Output Format</Label>
                          <RadioGroup value={outputFormat} onValueChange={setOutputFormat}>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center space-x-2 p-2 border border-slate-200 rounded cursor-pointer hover:bg-slate-50">
                                <RadioGroupItem value="Bullet Points" id="bullet-points" />
                                <Label htmlFor="bullet-points" className="text-sm">Bullet Points</Label>
                              </div>
                              <div className="flex items-center space-x-2 p-2 border border-slate-200 rounded cursor-pointer hover:bg-slate-50">
                                <RadioGroupItem value="Paragraphs" id="paragraphs" />
                                <Label htmlFor="paragraphs" className="text-sm">Paragraphs</Label>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>
                        <Button 
                          onClick={handleGenerate}
                          disabled={isGenerating || !textContent.trim()}
                          className="w-full bg-accent text-white hover:bg-emerald-700"
                          data-testid="button-generate-summary"
                        >
                          <Wand2 className="mr-2 h-4 w-4" />
                          {isGenerating ? "Generating..." : "Generate Summary"}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Generated Summary */}
                  {generatedNote && (
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle>Generated Summary</CardTitle>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid="button-edit-note"
                            >
                              <Edit className="mr-1 h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => exportNote(generatedNote)}
                              data-testid="button-export-note"
                            >
                              <Download className="mr-1 h-4 w-4" />
                              Export
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="prose max-w-none">
                          <h4 className="text-lg font-semibold text-slate-900 mb-3">{generatedNote.title}</h4>
                          <div className="text-slate-700 whitespace-pre-wrap" data-testid="generated-note-content">
                            {generatedNote.content}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="library">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {notesLoading ? (
                        <div className="text-center py-8">
                          <p className="text-slate-600">Loading notes...</p>
                        </div>
                      ) : notes.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-slate-600">No notes yet. Generate your first summary!</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {notes.map((note: Note) => (
                            editingNote === note.id ? (
                              <Card key={note.id} className="border border-slate-200 shadow-lg">
                                <CardHeader className="pb-3">
                                  <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg">Editing Note</CardTitle>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingNote(null)}
                                      data-testid="button-close-edit"
                                    >
                                      ×
                                    </Button>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="edit-title">Title</Label>
                                      <Input
                                        id="edit-title"
                                        value={note.title}
                                        disabled
                                        className="bg-gray-50"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-content">Content</Label>
                                      <Textarea
                                        id="edit-content"
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="min-h-[200px] resize-none"
                                        placeholder="Edit your note content..."
                                        data-testid="textarea-edit-note"
                                      />
                                    </div>
                                    <div className="flex space-x-2 justify-end">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingNote(null)}
                                        data-testid="button-cancel-edit"
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => saveEdit.mutate({ noteId: note.id, content: editContent })}
                                        disabled={saveEdit.isPending}
                                        className="bg-accent text-white hover:bg-emerald-700"
                                        data-testid="button-save-edit"
                                      >
                                        {saveEdit.isPending ? "Saving..." : "Save Changes"}
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ) : (
                              <Card key={note.id} className="border border-slate-200 hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-slate-900 truncate flex-1">{note.title}</h3>
                                    <FileText className="text-slate-400 h-4 w-4 ml-2 flex-shrink-0" />
                                  </div>
                                  <p className="text-sm text-slate-600 mb-3 line-clamp-3">
                                    {note.content.substring(0, 150)}...
                                  </p>
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {note.tags.slice(0, 3).map((tag, index) => (
                                      <span 
                                        key={index}
                                        className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                    {note.tags.length > 3 && (
                                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                                        +{note.tags.length - 3}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 mb-3">
                                    Updated {new Date(note.updatedAt).toLocaleDateString()}
                                  </p>
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleEdit(note)}
                                      data-testid={`button-edit-note-${note.id}`}
                                    >
                                      <Edit className="mr-1 h-3 w-3" />
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => exportNote(note)}
                                      data-testid={`button-export-note-${note.id}`}
                                    >
                                      <Download className="mr-1 h-3 w-3" />
                                      Export
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => deleteMutation.mutate(note.id)}
                                      disabled={deleteMutation.isPending}
                                      data-testid={`button-delete-note-${note.id}`}
                                    >
                                      <Trash2 className="mr-1 h-3 w-3" />
                                      Delete
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            )
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
