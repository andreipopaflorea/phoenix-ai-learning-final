import { motion } from "framer-motion";

const logos = [
  { name: "Stanford", abbr: "SU" },
  { name: "MIT", abbr: "MIT" },
  { name: "UCLA", abbr: "UCLA" },
  { name: "Duke", abbr: "Duke" },
  { name: "USC", abbr: "USC" },
  { name: "Michigan", abbr: "UMich" },
];

const SocialProof = () => {
  return (
    <section className="py-20 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-muted-foreground text-sm uppercase tracking-wider mb-8">
            Built for high performers at
          </p>
          
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 lg:gap-16">
            {logos.map((logo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group"
              >
                <div className="w-24 h-12 flex items-center justify-center rounded-lg bg-secondary/50 border border-border hover:border-primary/30 transition-all duration-300 group-hover:bg-secondary">
                  <span className="text-muted-foreground group-hover:text-foreground font-semibold transition-colors duration-300">
                    {logo.abbr}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProof;
