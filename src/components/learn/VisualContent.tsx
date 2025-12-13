import { motion } from "framer-motion";
import { Eye, GitBranch, Palette, Lightbulb, RefreshCw, ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  content: any;
  tier: number;
  learningUnitId?: string;
  userId?: string;
  sessionContentId?: string;
}

interface DiagramImageProps {
  mindMapData: any;
  learningUnitId: string;
  userId: string;
  tier: number;
  sessionContentId?: string;
  cachedImageUrl?: string;
}

const DiagramImage = ({ mindMapData, learningUnitId, userId, tier, sessionContentId, cachedImageUrl }: DiagramImageProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(cachedImageUrl || null);
  const [loading, setLoading] = useState(!cachedImageUrl);
  const [error, setError] = useState<string | null>(null);

  const generateDiagram = async (forceRegenerate = false) => {
    if (!forceRegenerate && cachedImageUrl) {
      setImageUrl(cachedImageUrl);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-visual-diagram", {
        body: {
          learningUnitId,
          userId,
          mindMapData,
          tier,
          sessionContentId,
          forceRegenerate,
        },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setImageUrl(data.imageUrl);
    } catch (err: any) {
      console.error("Error generating diagram:", err);
      setError(err.message || "Failed to generate diagram");
      toast.error("Failed to generate diagram");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cachedImageUrl) {
      generateDiagram();
    }
  }, [learningUnitId, tier]);

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon className="w-5 h-5 text-primary animate-pulse" />
          <span className="text-sm text-muted-foreground">Generating visual diagram...</span>
        </div>
        <Skeleton className="w-full aspect-video rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
        <p className="text-sm text-destructive mb-2">Could not generate diagram: {error}</p>
        <Button variant="outline" size="sm" onClick={() => generateDiagram(true)} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!imageUrl) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">AI-Generated Diagram</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => generateDiagram(true)} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Regenerate
        </Button>
      </div>
      <div className="rounded-xl overflow-hidden border border-border bg-background">
        <img 
          src={imageUrl} 
          alt="AI-generated mind map diagram" 
          className="w-full h-auto"
        />
      </div>
    </div>
  );
};

export const VisualContent = ({ content, tier, learningUnitId, userId, sessionContentId }: Props) => {
  const canGenerateDiagram = learningUnitId && userId && content?.mindMap;

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

        {/* Core Explanation */}
        {content.coreExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-4 bg-secondary/50 rounded-xl"
          >
            <h3 className="font-semibold mb-2">Overview</h3>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{content.coreExplanation}</p>
          </motion.div>
        )}

        {/* Bullet Points */}
        {content.bulletPoints && content.bulletPoints.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Key Points</h3>
            </div>
            <ul className="space-y-2">
              {content.bulletPoints.map((point: string, index: number) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-2"
                >
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-muted-foreground">{point}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Mind Map with AI Diagram */}
        {content.mindMap && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Mind Map</h3>
            </div>
            
            {/* AI Generated Diagram */}
            {canGenerateDiagram && (
              <DiagramImage
                mindMapData={content.mindMap}
                learningUnitId={learningUnitId}
                userId={userId}
                tier={tier}
                sessionContentId={sessionContentId}
                cachedImageUrl={content.generatedDiagramUrl}
              />
            )}

            {/* Text-based Mind Map (fallback/reference) */}
            <div className="p-4 rounded-xl bg-secondary/30">
              <div className="text-center mb-4">
                <span className="inline-block px-4 py-2 rounded-full bg-primary text-primary-foreground font-bold">
                  {content.mindMap.mainTopic}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {content.mindMap.branches?.map((branch: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-background border border-border"
                  >
                    <p className="font-medium text-primary mb-2">{branch.title}</p>
                    <ul className="space-y-1">
                      {branch.details?.map((detail: string, dIndex: number) => (
                        <li key={dIndex} className="text-sm text-muted-foreground">
                          • {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Diagram Ideas */}
        {content.diagramIdeas && content.diagramIdeas.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Visualize It</h3>
            </div>
            <div className="space-y-2">
              {content.diagramIdeas.map((idea: string, index: number) => (
                <div key={index} className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm">{idea}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {/* Key Insight */}
        {content.keyInsight && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <h3 className="font-semibold mb-2">💡 Key Insight</h3>
              <p className="text-muted-foreground">{content.keyInsight}</p>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  if (tier === 2) {
    const canGenerateDetailedDiagram = learningUnitId && userId && content?.detailedMindMap;

    return (
      <div className="space-y-8">
        {/* Detailed Mind Map */}
        {content.detailedMindMap && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Detailed Concept Map</h3>
            </div>

            {/* AI Generated Diagram for Tier 2 */}
            {canGenerateDetailedDiagram && (
              <DiagramImage
                mindMapData={content.detailedMindMap}
                learningUnitId={learningUnitId}
                userId={userId}
                tier={tier}
                sessionContentId={sessionContentId}
                cachedImageUrl={content.generatedDiagramUrl}
              />
            )}

            <div className="p-4 rounded-xl bg-secondary/30">
              <div className="text-center mb-6">
                <span className="inline-block px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  {content.detailedMindMap.mainTopic}
                </span>
              </div>
              <div className="space-y-6">
                {content.detailedMindMap.branches?.map((branch: any, index: number) => (
                  <div key={index} className="border-l-2 border-primary pl-4">
                    <p className="font-bold text-primary mb-3">{branch.title}</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {branch.subBranches?.map((sub: any, sIndex: number) => (
                        <div key={sIndex} className="p-3 rounded-lg bg-background">
                          <p className="font-medium mb-2">{sub.title}</p>
                          <ul className="space-y-1">
                            {sub.details?.map((detail: string, dIndex: number) => (
                              <li key={dIndex} className="text-sm text-muted-foreground">
                                • {detail}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Flowchart */}
        {content.flowchartSteps && content.flowchartSteps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 className="font-semibold mb-3">Process Flow</h3>
            <div className="flex flex-wrap items-center gap-2">
              {content.flowchartSteps.map((step: string, index: number) => (
                <div key={index} className="flex items-center">
                  <span className="px-4 py-2 rounded-lg bg-secondary/50 text-sm">
                    {step}
                  </span>
                  {index < content.flowchartSteps.length - 1 && (
                    <span className="mx-2 text-primary">→</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Color Coding */}
        {content.colorCodingScheme && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Color Coding Guide</h3>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {Object.entries(content.colorCodingScheme).map(([key, value], index) => (
                <div key={key} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)` }}
                  />
                  <div>
                    <span className="font-medium">{key}:</span>{" "}
                    <span className="text-muted-foreground">{value as string}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Visual Analogies */}
        {content.visualAnalogies && content.visualAnalogies.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h3 className="font-semibold mb-3">Visual Analogies</h3>
            <div className="space-y-2">
              {content.visualAnalogies.map((analogy: string, index: number) => (
                <div key={index} className="p-3 rounded-lg bg-primary/10">
                  {analogy}
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
      {content.sketchExercises && content.sketchExercises.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="font-semibold mb-4">Sketch Exercises</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {content.sketchExercises.map((exercise: any, index: number) => (
              <div key={index} className="p-4 rounded-xl bg-secondary/30">
                <p className="font-medium mb-2">{exercise.task}</p>
                <p className="text-sm text-muted-foreground">{exercise.purpose}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {content.infographicPrompts && content.infographicPrompts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="font-semibold mb-3">Create Infographics</h3>
          <div className="space-y-3">
            {content.infographicPrompts.map((prompt: string, index: number) => (
              <div key={index} className="p-4 rounded-xl bg-primary/10">
                <p>{prompt}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {content.visualComparison && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="font-semibold mb-3">Visual Comparison</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-xl bg-secondary/30">
              <p className="font-medium mb-2">Concept 1</p>
              <p className="text-muted-foreground">{content.visualComparison.concept1}</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30">
              <p className="font-medium mb-2">Concept 2</p>
              <p className="text-muted-foreground">{content.visualComparison.concept2}</p>
            </div>
          </div>
          <div className="mt-4 p-4 rounded-xl bg-primary/10">
            <p className="font-medium mb-2">How They Relate</p>
            <p className="text-muted-foreground">{content.visualComparison.comparison}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
