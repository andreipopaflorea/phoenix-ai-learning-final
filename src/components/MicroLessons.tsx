import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Lightbulb, Sparkles } from "lucide-react";

interface Lesson {
  title: string;
  content: string;
  activity?: string;
}

interface MicroLessonsProps {
  summary: string;
  lessons: Lesson[];
}

export const MicroLessons = ({ summary, lessons }: MicroLessonsProps) => {
  const [expandedLesson, setExpandedLesson] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-sm mb-1">Summary</h4>
            <p className="text-sm text-muted-foreground">{summary}</p>
          </div>
        </div>
      </div>

      {/* Lesson Accordion */}
      <div className="space-y-2">
        {lessons.map((lesson, index) => {
          const isExpanded = expandedLesson === index;
          
          return (
            <div
              key={index}
              className="rounded-xl border border-border overflow-hidden"
            >
              <button
                onClick={() => setExpandedLesson(isExpanded ? null : index)}
                className="w-full p-4 flex items-center justify-between bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-primary bg-primary/20 px-2 py-1 rounded">
                    {index + 1}
                  </span>
                  <span className="font-medium text-sm">{lesson.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-background border-t border-border space-y-4">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {lesson.content}
                      </p>
                      
                      {lesson.activity && (
                        <div className="p-3 rounded-lg bg-accent/50 border border-accent">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                                Activity
                              </span>
                              <p className="text-sm text-muted-foreground mt-1">
                                {lesson.activity}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
