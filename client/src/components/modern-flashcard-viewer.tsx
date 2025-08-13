import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Shuffle,
  BookOpen,
  Brain,
  CheckCircle,
  XCircle,
  Sparkles,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  type?: string;
}

interface ModernFlashcardViewerProps {
  flashcards: Flashcard[];
  title: string;
  onClose: () => void;
}

const getCardStyle = (type: string) => {
  switch (type) {
    case 'term-definition':
      return {
        front: 'bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 text-white',
        back: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white',
        icon: BookOpen
      };
    case 'question-answer':
      return {
        front: 'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 text-white',
        back: 'bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 text-white',
        icon: Brain
      };
    case 'true-false':
      return {
        front: 'bg-gradient-to-br from-emerald-500 via-green-500 to-lime-500 text-white',
        back: 'bg-gradient-to-br from-lime-500 via-green-500 to-emerald-500 text-white',
        icon: CheckCircle
      };
    case 'fill-in-blank':
      return {
        front: 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-white',
        back: 'bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 text-white',
        icon: Zap
      };
    default:
      return {
        front: 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 text-white',
        back: 'bg-gradient-to-br from-fuchsia-500 via-purple-500 to-violet-500 text-white',
        icon: Sparkles
      };
  }
};

export default function ModernFlashcardViewer({ flashcards, title, onClose }: ModernFlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledCards, setShuffledCards] = useState(flashcards);
  const [studyMode, setStudyMode] = useState<'sequential' | 'random'>('sequential');

  const currentCard = shuffledCards[currentIndex];
  const cardStyle = getCardStyle(currentCard?.type || 'default');
  const IconComponent = cardStyle.icon;

  const shuffleCards = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudyMode('random');
  };

  const resetCards = () => {
    setShuffledCards(flashcards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudyMode('sequential');
  };

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % shuffledCards.length);
    setIsFlipped(false);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + shuffledCards.length) % shuffledCards.length);
    setIsFlipped(false);
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') prevCard();
      if (e.key === 'ArrowRight' || e.key === 'd') nextCard();
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        flipCard();
      }
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!currentCard) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/90 via-indigo-900/90 to-blue-900/90 backdrop-blur-lg z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Sparkles className="h-10 w-10 text-yellow-400 animate-pulse" />
            {title}
            <Sparkles className="h-10 w-10 text-yellow-400 animate-pulse" />
          </h1>
          <div className="flex items-center justify-center gap-4 text-white/80">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {currentIndex + 1} of {shuffledCards.length}
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 capitalize">
              {studyMode} mode
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 capitalize">
              {currentCard.type?.replace('-', ' ') || 'flashcard'}
            </Badge>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-8">
          <Button 
            onClick={resetCards}
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Order
          </Button>
          <Button 
            onClick={shuffleCards}
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
          >
            <Shuffle className="h-4 w-4 mr-2" />
            Shuffle
          </Button>
          <Button 
            onClick={onClose}
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
          >
            ✕ Close
          </Button>
        </div>

        {/* Flashcard */}
        <div className="relative mx-auto mb-8" style={{ maxWidth: '600px', height: '400px' }}>
          <div 
            className={cn(
              "flip-card w-full h-full cursor-pointer",
              isFlipped && "flipped"
            )}
            onClick={flipCard}
          >
            <div className="flip-card-inner">
              {/* Front of card */}
              <div className={cn(
                "flip-card-front",
                cardStyle.front,
                "relative overflow-hidden"
              )}>
                {/* Decorative elements */}
                <div className="absolute top-4 right-4">
                  <IconComponent className="h-8 w-8 text-white/30" />
                </div>
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
                  <div className="text-center">
                    <div className="text-sm font-medium text-white/70 mb-3 uppercase tracking-wide">
                      {currentCard.type?.replace('-', ' ') || 'Flashcard'}
                    </div>
                    <div className="text-2xl font-bold leading-relaxed">
                      {currentCard.front}
                    </div>
                    <div className="mt-6 text-white/60 text-sm">
                      Click to reveal answer
                    </div>
                  </div>
                </div>
              </div>

              {/* Back of card */}
              <div className={cn(
                "flip-card-back",
                cardStyle.back,
                "relative overflow-hidden"
              )}>
                {/* Decorative elements */}
                <div className="absolute top-4 left-4">
                  <CheckCircle className="h-8 w-8 text-white/30" />
                </div>
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -right-20 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
                  <div className="text-center">
                    <div className="text-sm font-medium text-white/70 mb-3 uppercase tracking-wide">
                      Answer
                    </div>
                    <div className="text-2xl font-bold leading-relaxed">
                      {currentCard.back}
                    </div>
                    <div className="mt-6 text-white/60 text-sm">
                      Click to flip back
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-6">
          <Button
            onClick={prevCard}
            size="lg"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm rounded-full w-14 h-14"
            disabled={shuffledCards.length <= 1}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div className="text-center">
            <div className="text-white/80 text-sm mb-2">
              Navigation: ← → or A D | Flip: Space | Close: Esc
            </div>
            <div className="w-48 bg-white/20 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / shuffledCards.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <Button
            onClick={nextCard}
            size="lg"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm rounded-full w-14 h-14"
            disabled={shuffledCards.length <= 1}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-center mt-8 text-white/60 text-sm">
          🚀 <strong>Pro tip:</strong> Use keyboard shortcuts for faster studying!
        </div>
      </div>
    </div>
  );
}