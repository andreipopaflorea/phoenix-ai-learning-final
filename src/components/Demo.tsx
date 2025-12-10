import { motion } from "framer-motion";
import { Upload, Cpu, BookOpen, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload",
    description: "Drop your PDFs, lecture notes, or any study material",
  },
  {
    icon: Cpu,
    title: "AI Processing",
    description: "Our AI analyzes and breaks down complex content",
  },
  {
    icon: BookOpen,
    title: "Micro-Lessons",
    description: "Get flashcards, quizzes, and bite-sized lessons",
  },
  {
    icon: CheckCircle,
    title: "Master It",
    description: "Learn in your schedule's natural breaks",
  },
];

const Demo = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-phoenix-purple/5 to-transparent" />
      
      <div className="container px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            See how it <span className="gradient-text">works</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From chaos to clarity in four simple steps
          </p>
        </motion.div>

        {/* Workflow Steps */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-phoenix-purple/50 via-phoenix-blue/50 to-phoenix-purple/50 -translate-y-1/2" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="relative flex flex-col items-center text-center"
                >
                  {/* Step Number */}
                  <div className="absolute -top-3 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 lg:top-auto lg:-left-3 text-6xl font-bold text-phoenix-purple/10">
                    {index + 1}
                  </div>
                  
                  {/* Icon Container */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative z-10 w-20 h-20 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-6 group"
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Icon className="w-8 h-8 text-phoenix-purple group-hover:text-primary-foreground relative z-10 transition-colors duration-300" />
                  </motion.div>

                  <h3 className="text-lg font-semibold mb-2 text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Demo Card Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 max-w-3xl mx-auto"
        >
          <div className="glass-card p-8 gradient-border">
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              {/* Input Card */}
              <div className="flex-1 bg-secondary/50 rounded-xl p-6 text-center">
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Economics_101.pdf</p>
                <p className="text-xs text-muted-foreground/60 mt-1">42 pages • 2.4 MB</p>
              </div>

              {/* Arrow */}
              <div className="hidden sm:flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center animate-pulse">
                  <Cpu className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>

              {/* Output Cards */}
              <div className="flex-1 space-y-3">
                <div className="bg-phoenix-purple/20 rounded-lg p-3 border border-phoenix-purple/30">
                  <p className="text-sm font-medium text-foreground">📚 12 Micro-Lessons</p>
                </div>
                <div className="bg-phoenix-blue/20 rounded-lg p-3 border border-phoenix-blue/30">
                  <p className="text-sm font-medium text-foreground">🎴 48 Flashcards</p>
                </div>
                <div className="bg-accent/20 rounded-lg p-3 border border-accent/30">
                  <p className="text-sm font-medium text-foreground">✅ 6 Practice Quizzes</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Demo;
