import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  BookOpen, 
  HelpCircle, 
  StickyNote, 
  Calendar, 
  Eye, 
  Trash2, 
  MoreVertical, 
  AlertTriangle,
  Library,
  Sparkles
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import ModernFlashcardViewer from "@/components/modern-flashcard-viewer";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function LibraryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [viewingFlashcards, setViewingFlashcards] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data with proper error handling
  const { data: flashcardSets = [] } = useQuery({
    queryKey: ['/api/flashcards/sets'],
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ['/api/quizzes'],
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['/api/notes'],
  });

  // Delete mutations
  const deleteFlashcardSetMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/flashcards/sets/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flashcards/sets'] });
      toast({
        title: "Success",
        description: "Flashcard set deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete flashcard set",
        variant: "destructive",
      });
    }
  });

  const deleteQuizMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/quizzes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
      toast({
        title: "Success",
        description: "Quiz deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      });
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/notes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  });

  // Transform data for library items
  const allItems = [
    ...(flashcardSets?.map((set: any) => ({
      ...set,
      type: 'flashcard',
      icon: BookOpen,
      color: 'bg-gradient-to-br from-purple-500 to-indigo-600',
      description: `${set.flashcards?.length || 0} cards`
    })) || []),
    ...(quizzes?.map((quiz: any) => ({
      ...quiz,
      type: 'quiz',
      icon: HelpCircle,
      color: 'bg-gradient-to-br from-emerald-500 to-green-600',
      description: `${quiz.questions?.length || 0} questions`
    })) || []),
    ...(notes?.map((note: any) => ({
      ...note,
      type: 'note',
      icon: StickyNote,
      color: 'bg-gradient-to-br from-orange-500 to-pink-600',
      description: note.summary || 'Study notes'
    })) || [])
  ];

  // Filter items based on search and active tab
  const filteredItems = allItems.filter((item) => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || item.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleViewItem = async (item: any) => {
    if (item.type === 'flashcard') {
      try {
        const response = await fetch(`/api/flashcards/sets/${item.id}/cards`);
        if (response.ok) {
          const flashcards = await response.json();
          setViewingFlashcards(flashcards);
          setViewingItem(item);
        } else {
          toast({
            title: "Error",
            description: "Failed to load flashcards",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error", 
          description: "Failed to load flashcards",
          variant: "destructive",
        });
      }
    } else if (item.type === 'quiz') {
      window.location.href = '/quizzes';
    } else if (item.type === 'note') {
      window.location.href = '/notes';
    }
  };

  return (
    <>
      {/* Modern Flashcard Viewer */}
      {viewingItem && viewingItem.type === 'flashcard' && (
        <ModernFlashcardViewer 
          flashcards={viewingFlashcards}
          title={viewingItem.title}
          onClose={() => {
            setViewingItem(null);
            setViewingFlashcards([]);
          }}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Modern Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center float-animation">
                <Library className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              🚀 Study Library
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Your collection of AI-powered study materials, beautifully organized and ready to explore
            </p>
          </div>
          
          {/* Modern Search */}
          <div className="flex justify-center">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 h-5 w-5" />
              <Input
                placeholder="🔍 Search your study materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 text-lg rounded-2xl border-2 border-purple-200 focus:border-purple-500 bg-white/80 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Modern Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Items</p>
                    <p className="text-3xl font-bold">{allItems.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0 hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">💳 Flashcard Sets</p>
                    <p className="text-3xl font-bold">{flashcardSets?.length || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-emerald-500 to-green-500 text-white border-0 hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">🧠 Quizzes</p>
                    <p className="text-3xl font-bold">{quizzes?.length || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <HelpCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-500 to-pink-500 text-white border-0 hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">📝 Notes</p>
                    <p className="text-3xl font-bold">{notes?.length || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <StickyNote className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Modern Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-center">
              <TabsList className="grid grid-cols-4 bg-white/60 backdrop-blur-sm rounded-2xl p-2 border-2 border-purple-200">
                <TabsTrigger value="all" className="rounded-xl text-sm font-medium">
                  ✨ All ({allItems.length})
                </TabsTrigger>
                <TabsTrigger value="flashcard" className="rounded-xl text-sm font-medium">
                  💳 Cards ({flashcardSets?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="quiz" className="rounded-xl text-sm font-medium">
                  🧠 Quizzes ({quizzes?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="note" className="rounded-xl text-sm font-medium">
                  📝 Notes ({notes?.length || 0})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-8">
              {filteredItems.length === 0 ? (
                <Card className="py-16 bg-white/60 backdrop-blur-sm border-2 border-purple-200">
                  <CardContent className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-6">
                      {activeTab === 'all' && <Sparkles className="h-10 w-10 text-white" />}
                      {activeTab === 'flashcard' && <BookOpen className="h-10 w-10 text-white" />}
                      {activeTab === 'quiz' && <HelpCircle className="h-10 w-10 text-white" />}
                      {activeTab === 'note' && <StickyNote className="h-10 w-10 text-white" />}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">
                      {searchTerm ? '🔍 No matching items found' : `✨ No ${activeTab === 'all' ? 'study materials' : activeTab + 's'} yet`}
                    </h3>
                    <p className="text-slate-600 mb-6 text-lg">
                      {searchTerm 
                        ? 'Try adjusting your search terms or browse all items'
                        : `Start creating your first ${activeTab === 'all' ? 'study material' : activeTab} to see it here`
                      }
                    </p>
                    {!searchTerm && (
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button onClick={() => window.location.href = '/flashcards'} className="btn-gradient">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Create Flashcards
                        </Button>
                        <Button onClick={() => window.location.href = '/quizzes'} className="btn-gradient">
                          <HelpCircle className="h-4 w-4 mr-2" />
                          Create Quiz
                        </Button>
                        <Button onClick={() => window.location.href = '/notes'} className="btn-gradient">
                          <StickyNote className="h-4 w-4 mr-2" />
                          Create Notes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                      <Card 
                        key={`${item.type}-${item.id}`} 
                        className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer bg-white/80 backdrop-blur-sm border-2 border-purple-100 hover:border-purple-300"
                        onClick={() => handleViewItem(item)}
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg", item.color)}>
                                <IconComponent className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors text-lg truncate">
                                  {item.title}
                                </h3>
                                <Badge variant="secondary" className="mt-1 text-xs bg-purple-100 text-purple-700">
                                  {item.type === 'flashcard' ? 'Flashcard Set' : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Actions Dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-10 w-10 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-purple-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm">
                                <DropdownMenuItem onClick={() => handleViewItem(item)} className="cursor-pointer">
                                  <Eye className="h-4 w-4 mr-2 text-blue-600" />
                                  <span className="text-blue-600 font-medium">View Study Material</span>
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                                      <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                                      <span className="text-red-500 font-medium">Delete</span>
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-white/95 backdrop-blur-sm">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="flex items-center gap-2 text-xl">
                                        <AlertTriangle className="h-6 w-6 text-red-500" />
                                        Delete {item.type}?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-base">
                                        Are you sure you want to delete "<strong>{item.title}</strong>"? 
                                        This action cannot be undone and will permanently remove this {item.type} 
                                        from your library.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200">
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => {
                                          if (item.type === 'note') {
                                            deleteNoteMutation.mutate(item.id);
                                          } else if (item.type === 'quiz') {
                                            deleteQuizMutation.mutate(item.id);
                                          } else if (item.type === 'flashcard') {
                                            deleteFlashcardSetMutation.mutate(item.id);
                                          }
                                        }}
                                        className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Forever
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          {item.description && (
                            <p className="text-slate-600 mt-3 text-sm leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="sm" 
                              className="btn-gradient w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewItem(item);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Study Now
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}