import { motion } from "framer-motion";
import { Volume2, MessageCircle, Lightbulb, Play, Pause, Square } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  content: any;
  tier: number;
}

const TextToSpeech = ({ text }: { text: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlay = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  return (
    <div className="flex items-center gap-2">
      {!isPlaying ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handlePlay}
          className="gap-2"
        >
          <Play className="w-4 h-4" />
          {isPaused ? "Resume" : "Play"}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handlePause}
          className="gap-2"
        >
          <Pause className="w-4 h-4" />
          Pause
        </Button>
      )}
      {(isPlaying || isPaused) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStop}
          className="gap-2"
        >
          <Square className="w-4 h-4" />
          Stop
        </Button>
      )}
    </div>
  );
};

export const AuditoryContent = ({ content, tier }: Props) => {
  if (tier === 1) {
    return (
      <div className="space-y-8">
        {/* Script */}
        {content.script && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Listen & Learn</h3>
              </div>
              <TextToSpeech text={content.script} />
            </div>
            <div className="p-4 bg-secondary/50 rounded-xl">
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {content.script}
              </p>
            </div>
          </motion.div>
        )}

        {/* Mnemonics */}
        {content.mnemonics && content.mnemonics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Memory Aids</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {content.mnemonics.map((mnemonic: string, index: number) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-primary/10 border border-primary/20"
                >
                  <p className="text-center font-medium">{mnemonic}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Key Points */}
        {content.keyPoints && content.keyPoints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="font-semibold mb-3">Key Points to Remember</h3>
            <ul className="space-y-2">
              {content.keyPoints.map((point: string, index: number) => (
                <li
                  key={index}
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-secondary/30"
                >
                  <span className="text-primary font-bold">{index + 1}.</span>
                  <span className="text-muted-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    );
  }

  if (tier === 2) {
    return (
      <div className="space-y-8">
        {content.extendedScript && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Extended Explanation</h3>
              </div>
              <TextToSpeech text={content.extendedScript} />
            </div>
            <div className="p-4 bg-secondary/50 rounded-xl">
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {content.extendedScript}
              </p>
            </div>
          </motion.div>
        )}

        {content.discussionQuestions && content.discussionQuestions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Questions to Ponder</h3>
            </div>
            <div className="space-y-3">
              {content.discussionQuestions.map((question: string, index: number) => (
                <div key={index} className="p-4 rounded-xl bg-secondary/30">
                  <p className="italic">{question}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {content.rhymes && content.rhymes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 className="font-semibold mb-3">Rhymes & Jingles</h3>
            <div className="space-y-3">
              {content.rhymes.map((rhyme: string, index: number) => (
                <div key={index} className="p-4 rounded-xl bg-primary/10 text-center">
                  <p className="font-medium">{rhyme}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // Tier 3
  return (
    <div className="space-y-8">
      {content.verbalExercises && content.verbalExercises.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="font-semibold mb-4">Verbal Exercises</h3>
          <div className="space-y-4">
            {content.verbalExercises.map((exercise: any, index: number) => (
              <div key={index} className="p-4 rounded-xl bg-secondary/30">
                <p className="font-medium mb-2">{exercise.task}</p>
                <p className="text-sm text-muted-foreground">
                  Success criteria: {exercise.criteria}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {content.debateTopics && content.debateTopics.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="font-semibold mb-3">Debate Topics</h3>
          <div className="space-y-3">
            {content.debateTopics.map((topic: string, index: number) => (
              <div key={index} className="p-4 rounded-xl bg-secondary/30">
                <p>{topic}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try arguing both sides of this topic out loud
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {content.teachBackPrompts && content.teachBackPrompts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="font-semibold mb-3">Teach It Back</h3>
          <p className="text-muted-foreground mb-4">
            The best way to learn is to teach! Try explaining these concepts to someone else:
          </p>
          <ul className="space-y-2">
            {content.teachBackPrompts.map((prompt: string, index: number) => (
              <li key={index} className="p-3 rounded-lg bg-primary/10">
                {prompt}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
};
