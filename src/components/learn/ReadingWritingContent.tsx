import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  content: any;
  tier: number;
}

export const ReadingWritingContent = ({ content, tier }: Props) => {
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const toggleCard = (index: number) => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(index)) {
      newFlipped.delete(index);
    } else {
      newFlipped.add(index);
    }
    setFlippedCards(newFlipped);
  };

  const selectAnswer = (questionIndex: number, answerIndex: number) => {
    if (showResults) return;
    setSelectedAnswers({ ...selectedAnswers, [questionIndex]: answerIndex });
  };

  if (tier === 1) {
    return (
      <div className="space-y-8">
        {/* Introduction */}
        {content.introduction && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-primary/10 rounded-xl border border-primary/20"
          >
            <p className="text-lg font-medium text-primary">{content.introduction}</p>
          </motion.div>
        )}

        {/* Core Content */}
        {content.coreContent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="prose prose-sm dark:prose-invert max-w-none"
          >
            <h3 className="font-semibold mb-3">Understanding the Concepts</h3>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{content.coreContent}</p>
          </motion.div>
        )}

        {/* Key Takeaways */}
        {content.keyTakeaways && content.keyTakeaways.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-4 bg-secondary/50 rounded-xl"
          >
            <h3 className="font-semibold mb-3">Key Takeaways</h3>
            <ul className="space-y-2">
              {content.keyTakeaways.map((takeaway: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span className="text-muted-foreground">{takeaway}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Summary */}
        {content.summary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 bg-secondary/30 rounded-xl"
          >
            <h3 className="font-semibold mb-2">Summary</h3>
            <p className="text-muted-foreground">{content.summary}</p>
          </motion.div>
        )}

        {/* Flashcards */}
        {content.flashcards && content.flashcards.length > 0 && (
          <div>
            <h3 className="font-semibold mb-4">Flashcards</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {content.flashcards.map((card: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="cursor-pointer"
                  onClick={() => toggleCard(index)}
                >
                  <div className={cn(
                    "p-4 rounded-xl border transition-all min-h-[120px] flex flex-col justify-center",
                    flippedCards.has(index) 
                      ? "bg-primary/10 border-primary/30" 
                      : "bg-secondary/50 border-border hover:border-primary/30"
                  )}>
                    <p className="text-center">
                      {flippedCards.has(index) ? card.answer : card.question}
                    </p>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      {flippedCards.has(index) ? "Click to see question" : "Click to reveal answer"}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Quiz */}
        {content.quiz && content.quiz.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Quick Quiz</h3>
              {Object.keys(selectedAnswers).length === content.quiz.length && !showResults && (
                <Button size="sm" onClick={() => setShowResults(true)}>
                  Check Answers
                </Button>
              )}
            </div>
            <div className="space-y-6">
              {content.quiz.map((q: any, qIndex: number) => (
                <motion.div
                  key={qIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: qIndex * 0.1 }}
                  className="p-4 rounded-xl bg-secondary/30"
                >
                  <p className="font-medium mb-3">{qIndex + 1}. {q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((option: string, oIndex: number) => {
                      const isSelected = selectedAnswers[qIndex] === oIndex;
                      const isCorrect = oIndex === q.correctIndex;
                      const showAsCorrect = showResults && isCorrect;
                      const showAsWrong = showResults && isSelected && !isCorrect;
                      
                      return (
                        <button
                          key={oIndex}
                          onClick={() => selectAnswer(qIndex, oIndex)}
                          disabled={showResults}
                          className={cn(
                            "w-full p-3 rounded-lg text-left transition-all flex items-center gap-2 border",
                            !showResults && isSelected && "bg-primary/20 border-primary",
                            !showResults && !isSelected && "bg-background hover:bg-secondary/50 border-border",
                            showAsCorrect && "bg-green-500/20 border-green-500",
                            showAsWrong && "bg-red-500/20 border-red-500",
                            showResults && !isCorrect && !isSelected && "bg-background border-border opacity-50",
                            showResults && "cursor-default"
                          )}
                        >
                          <span className="flex-1">{option}</span>
                          {showAsCorrect && (
                            <Check className="w-4 h-4 text-green-500" />
                          )}
                          {showAsWrong && (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (tier === 2) {
    return (
      <div className="space-y-8">
        {content.deepDive && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="font-semibold mb-3">Deep Dive</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{content.deepDive}</p>
          </motion.div>
        )}

        {content.keyTerminology && content.keyTerminology.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 className="font-semibold mb-3">Key Terminology</h3>
            <div className="space-y-3">
              {content.keyTerminology.map((item: any, index: number) => (
                <div key={index} className="p-3 rounded-lg bg-secondary/50">
                  <span className="font-medium text-primary">{item.term}:</span>{" "}
                  <span className="text-muted-foreground">{item.definition}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {content.connections && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 className="font-semibold mb-3">Connections</h3>
            <p className="text-muted-foreground">{content.connections}</p>
          </motion.div>
        )}
      </div>
    );
  }

  // Tier 3
  return (
    <div className="space-y-8">
      {content.exercises && content.exercises.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4">Practice Exercises</h3>
          {content.exercises.map((ex: any, index: number) => (
            <ExerciseCard key={index} exercise={ex} index={index} />
          ))}
        </div>
      )}

      {content.realWorldExamples && content.realWorldExamples.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="font-semibold mb-3">Real-World Examples</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            {content.realWorldExamples.map((example: string, index: number) => (
              <li key={index}>{example}</li>
            ))}
          </ul>
        </motion.div>
      )}

      {content.selfAssessment && content.selfAssessment.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="font-semibold mb-3">Self-Assessment</h3>
          <div className="space-y-4">
            {content.selfAssessment.map((item: any, index: number) => (
              <div key={index} className="p-4 rounded-xl bg-secondary/30">
                <p className="font-medium mb-2">{item.question}</p>
                <p className="text-sm text-muted-foreground">{item.guideline}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

const ExerciseCard = ({ exercise, index }: { exercise: any; index: number }) => {
  const [showSolution, setShowSolution] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-4 rounded-xl bg-secondary/30 mb-4"
    >
      <p className="font-medium mb-3">Exercise {index + 1}: {exercise.problem}</p>
      
      {exercise.hints && exercise.hints.length > 0 && (
        <div className="mb-3">
          <p className="text-sm text-muted-foreground">Hints:</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            {exercise.hints.map((hint: string, i: number) => (
              <li key={i}>{hint}</li>
            ))}
          </ul>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowSolution(!showSolution)}
        className="gap-1"
      >
        {showSolution ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {showSolution ? "Hide Solution" : "Show Solution"}
      </Button>

      {showSolution && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 p-3 rounded-lg bg-primary/10"
        >
          <p className="text-muted-foreground">{exercise.solution}</p>
        </motion.div>
      )}
    </motion.div>
  );
};
