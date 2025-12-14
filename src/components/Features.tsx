import { motion } from "framer-motion";
import { Brain, Zap, Calendar, Sparkles, Target, BookOpen } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Your Second Brain",
    description: "Upload PDFs or notes. Our AI learns your profile and organizes content for you.",
    gradient: true,
    large: true,
  },
  {
    icon: Zap,
    title: "Bite-Sized Mastery",
    description: "We convert heavy lectures into 5-minute interactive lessons.",
    gradient: false,
    large: false,
  },
  {
    icon: Calendar,
    title: "Time-Mapped Study",
    description: "We sync with your training or work shifts to find your golden windows for learning.",
    gradient: false,
    large: false,
  },
  {
    icon: Sparkles,
    title: "AI-Powered Quizzes",
    description: "Adaptive assessments that target your weak spots and reinforce retention.",
    gradient: false,
    large: false,
  },
  {
    icon: Target,
    title: "Progress Tracking",
    description: "Visual dashboards show your learning velocity and knowledge gaps.",
    gradient: false,
    large: false,
  },
  {
    icon: BookOpen,
    title: "Multi-Format Support",
    description: "PDFs, videos, audio lectures—we process any format you throw at us.",
    gradient: true,
    large: true,
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-phoenix-purple/10 rounded-full blur-[150px]" />
      
      <div className="container px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 font-display">
            Everything you need to{" "}
            <span className="gradient-text">learn smarter</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Powerful features designed for students who refuse to choose between their passions
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`bento-item ${feature.large ? "lg:col-span-1 lg:row-span-1" : ""} ${
                  feature.gradient ? "gradient-border" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-secondary">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground font-display">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
