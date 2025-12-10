import { motion } from "framer-motion";
import { Hand, Activity, FlaskConical, Users } from "lucide-react";

interface Props {
  content: any;
  tier: number;
}

export const KinestheticContent = ({ content, tier }: Props) => {
  if (tier === 1) {
    return (
      <div className="space-y-8">
        {/* Summary */}
        {content.summary && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="font-semibold mb-3">Action Summary</h3>
            <p className="text-muted-foreground">{content.summary}</p>
          </motion.div>
        )}

        {/* Quick Activities */}
        {content.quickActivities && content.quickActivities.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Quick Activities</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {content.quickActivities.map((activity: any, index: number) => (
                <div key={index} className="p-4 rounded-xl bg-secondary/30">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">{activity.action}</span>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                      {activity.duration}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Real World Connections */}
        {content.realWorldConnections && content.realWorldConnections.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-3">
              <Hand className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Real-World Applications</h3>
            </div>
            <ul className="space-y-2">
              {content.realWorldConnections.map((connection: string, index: number) => (
                <li key={index} className="p-3 rounded-lg bg-primary/10">
                  {connection}
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
        {content.walkThrough && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="font-semibold mb-3">Step-by-Step Walkthrough</h3>
            <div className="p-4 bg-secondary/50 rounded-xl">
              <p className="text-muted-foreground whitespace-pre-wrap">{content.walkThrough}</p>
            </div>
          </motion.div>
        )}

        {content.simulations && content.simulations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Simulations</h3>
            </div>
            <div className="space-y-4">
              {content.simulations.map((sim: any, index: number) => (
                <div key={index} className="p-4 rounded-xl bg-secondary/30">
                  <p className="font-medium mb-2">{sim.scenario}</p>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Actions to take:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {sim.actions?.map((action: string, aIndex: number) => (
                        <li key={aIndex}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {content.movementBreaks && content.movementBreaks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Movement Breaks</h3>
            </div>
            <p className="text-muted-foreground mb-3">
              Take a break and try these movements while processing the information:
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              {content.movementBreaks.map((movement: string, index: number) => (
                <div key={index} className="p-3 rounded-lg bg-primary/10">
                  {movement}
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
      {content.handsonProjects && content.handsonProjects.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="font-semibold mb-4">Hands-On Projects</h3>
          <div className="space-y-6">
            {content.handsonProjects.map((project: any, index: number) => (
              <div key={index} className="p-4 rounded-xl bg-secondary/30">
                <p className="font-bold mb-3">{project.project}</p>
                
                {project.materials && project.materials.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium">Materials needed:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {project.materials.map((mat: string, mIndex: number) => (
                        <li key={mIndex}>{mat}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {project.steps && project.steps.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium">Steps:</p>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground">
                      {project.steps.map((step: string, sIndex: number) => (
                        <li key={sIndex}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                
                {project.learningOutcome && (
                  <div className="p-2 rounded-lg bg-primary/10 text-sm">
                    <span className="font-medium">What you'll learn: </span>
                    {project.learningOutcome}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {content.rolePlayScenarios && content.rolePlayScenarios.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Role-Play Scenarios</h3>
          </div>
          <div className="space-y-3">
            {content.rolePlayScenarios.map((scenario: string, index: number) => (
              <div key={index} className="p-4 rounded-xl bg-secondary/30">
                <p>{scenario}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {content.experiments && content.experiments.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Experiments to Try</h3>
          </div>
          <div className="space-y-4">
            {content.experiments.map((exp: any, index: number) => (
              <div key={index} className="p-4 rounded-xl bg-primary/10">
                <p className="font-medium mb-2">{exp.experiment}</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Observe: </span>
                  {exp.observation}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
