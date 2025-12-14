import { motion } from "framer-motion";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row items-center justify-between gap-6"
        >
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center overflow-hidden">
              <img 
                src="/lovable-uploads/e4f47c99-cd35-4b67-b8a2-0d37c014991d.png" 
                alt="Phoenix logo" 
                className="w-full h-full object-cover" 
              />
            </div>
            <span className="text-lg font-bold gradient-text">Phoenix</span>
          </div>

          {/* Copyright */}
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Phoenix AI. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
