import { motion } from "framer-motion";
import { AlertCircle, Zap } from "lucide-react";

const ProblemSolution = () => {
  return (
    <section id="about" className="py-24 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 gap-8 lg:gap-12"
        >
          {/* Problem */}
          <div className="glass-card p-8 lg:p-10">
            <div className="w-14 h-14 rounded-2xl bg-destructive/20 flex items-center justify-center mb-6">
              <AlertCircle className="w-7 h-7 text-destructive" />
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold mb-4 text-foreground">
              Overwhelmed by dual responsibilities?
            </h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Balancing classes with training or work feels impossible. Traditional study methods 
              require hours you don't have. You're forced to choose between excelling at school 
              or your career—but why should you have to?
            </p>
          </div>

          {/* Solution */}
          <div className="glass-card p-8 lg:p-10 gradient-border">
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6">
              <Zap className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold mb-4 gradient-text">
              Your schedule is chaotic. Your learning shouldn't be.
            </h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Stop cramming and start vibing with content adapted to your calendar. Phoenix 
              transforms your scattered free moments into focused learning sessions—turning 
              chaos into mastery, one micro-lesson at a time.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSolution;
