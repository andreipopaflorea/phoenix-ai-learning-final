import { motion } from "framer-motion";
import { Volume2, MessageCircle, Lightbulb } from "lucide-react";

interface Props {
  content: any;
  tier: number;
}

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
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Listen & Learn</h3>
            </div>
            <div className="p-4 bg-secondary/50 rounded-xl">
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {content.script}
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-2 italic">
              Tip: Read this aloud or use text-to-speech for best results
            </p>
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
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Extended Explanation</h3>
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
