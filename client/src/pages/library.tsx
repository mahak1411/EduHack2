import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  BookOpen, 
  HelpCircle, 
  StickyNote,
  Clock,
  Star,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import type { FlashcardSet, Quiz, Note } from "@shared/schema";

export default function Library() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  // Fetch all study materials
  const { data: flashcardSets, isLoading: loadingFlashcards } = useQuery({
    queryKey: ['/api/flashcards/sets'],
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
    }
  });

  const { data: quizzes, isLoading: loadingQuizzes } = useQuery({
    queryKey: ['/api/quizzes'],
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
    }
  });

  const { data: notes, isLoading: loadingNotes } = useQuery({
    queryKey: ['/api/notes'],
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
    }
  });

  const isLoading = loadingFlashcards || loadingQuizzes || loadingNotes;

  // Combine and filter all study materials
  const allItems = [
    ...(flashcardSets || []).map((set: FlashcardSet) => ({
      ...set,
      type: 'flashcard',
      icon: BookOpen,
      color: 'bg-blue-500'
    })),
    ...(quizzes || []).map((quiz: Quiz) => ({
      ...quiz,
      type: 'quiz',
      icon: HelpCircle,
      color: 'bg-green-500'
    })),
    ...(notes || []).map((note: Note) => ({
      ...note,
      type: 'note',
      icon: StickyNote,
      color: 'bg-yellow-500'
    }))
  ];

  const filteredItems = allItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTab = activeTab === 'all' || item.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleItemClick = (item: any) => {
    // Navigate to the appropriate page based on item type
    if (item.type === 'flashcard') {
      window.location.href = '/flashcards';
    } else if (item.type === 'quiz') {
      window.location.href = '/quizzes';
    } else if (item.type === 'note') {
      window.location.href = '/notes';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-900">Study Library</h1>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-slate-200 rounded w-full"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3 mt-2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Study Library</h1>
          <p className="text-slate-600 mt-1">
            All your flashcards, quizzes, and notes in one place
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search your study materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Items</p>
                <p className="text-2xl font-bold text-slate-900">{allItems.length}</p>
              </div>
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Flashcard Sets</p>
                <p className="text-2xl font-bold text-blue-600">{flashcardSets?.length || 0}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Quizzes</p>
                <p className="text-2xl font-bold text-green-600">{quizzes?.length || 0}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <HelpCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Notes</p>
                <p className="text-2xl font-bold text-yellow-600">{notes?.length || 0}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <StickyNote className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-96 grid-cols-4">
          <TabsTrigger value="all">All ({allItems.length})</TabsTrigger>
          <TabsTrigger value="flashcard">Flashcards ({flashcardSets?.length || 0})</TabsTrigger>
          <TabsTrigger value="quiz">Quizzes ({quizzes?.length || 0})</TabsTrigger>
          <TabsTrigger value="note">Notes ({notes?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredItems.length === 0 ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {activeTab === 'all' && <BookOpen className="h-8 w-8 text-slate-400" />}
                  {activeTab === 'flashcard' && <BookOpen className="h-8 w-8 text-slate-400" />}
                  {activeTab === 'quiz' && <HelpCircle className="h-8 w-8 text-slate-400" />}
                  {activeTab === 'note' && <StickyNote className="h-8 w-8 text-slate-400" />}
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {searchTerm ? 'No matching items found' : `No ${activeTab === 'all' ? 'study materials' : activeTab + 's'} yet`}
                </h3>
                <p className="text-slate-600 mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search terms or browse all items'
                    : `Start by creating your first ${activeTab === 'all' ? 'study material' : activeTab}`
                  }
                </p>
                {!searchTerm && (
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button onClick={() => window.location.href = '/flashcards'}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Create Flashcards
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = '/quizzes'}>
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Create Quiz
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = '/notes'}>
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
                    className="hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => handleItemClick(item)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.color)}>
                            <IconComponent className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                              {item.title}
                            </h3>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {item.type === 'flashcard' ? 'Flashcard Set' : item.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {item.description && (
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                          {item.updatedAt && item.updatedAt !== item.createdAt && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Updated {new Date(item.updatedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {item.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                            <Badge key={tagIndex} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
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
  );
}