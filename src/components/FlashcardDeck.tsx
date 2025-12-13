import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ChevronLeft, ChevronRight, Lightbulb, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  hint?: string;
}

interface FlashcardDeckProps {
  flashcards: Flashcard[];
  onComplete?: () => void;
}

export const FlashcardDeck = ({ flashcards, onComplete }: FlashcardDeckProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else if (onComplete) {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handleMastered = () => {
    setMasteredCards(prev => new Set([...prev, currentCard.id]));
    handleNext();
  };

  if (!currentCard) return null;

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Card {currentIndex + 1} of {flashcards.length}</span>
          <span>{masteredCards.size} mastered</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        className="relative h-64 cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentCard.id}-${isFlipped}`}
            initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`absolute inset-0 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-elegant ${
              isFlipped 
                ? "bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30" 
                : "bg-secondary/50 border-border"
            } border`}
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
              {isFlipped ? "Answer" : "Question"}
            </p>
            <p className={`text-lg font-medium ${isFlipped ? "text-primary" : ""}`}>
              {isFlipped ? currentCard.answer : currentCard.question}
            </p>
            {!isFlipped && (
              <p className="text-sm text-muted-foreground mt-4">
                Tap to reveal answer
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hint */}
      {currentCard.hint && !isFlipped && (
        <div className="mt-4 text-center">
          {showHint ? (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-muted-foreground italic"
            >
              💡 {currentCard.hint}
            </motion.p>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowHint(true);
              }}
              className="gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              Show Hint
            </Button>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsFlipped(false);
              setShowHint(false);
            }}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          
          {isFlipped && (
            <Button
              variant="default"
              size="sm"
              onClick={handleMastered}
              className="gap-2"
            >
              <Check className="w-4 h-4" />
              Got it!
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1 && !onComplete}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
