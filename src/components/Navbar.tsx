import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import phoenixLogo from "@/assets/phoenix-logo.png";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "glass py-3" : "py-5"
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-110">
              <img src="/lovable-uploads/e4f47c99-cd35-4b67-b8a2-0d37c014991d.png" alt="Phoenix logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold gradient-text">Phoenix</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              About
            </a>
            {!loading && (
              user ? (
                <Button variant="hero" size="lg" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="lg" asChild>
                    <Link to="/auth" className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </Link>
                  </Button>
                  <Button variant="hero" size="lg" asChild className="text-foreground">
                    <Link to="/auth">Get Started</Link>
                  </Button>
                </div>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden mt-6 pb-6 border-t border-border pt-6"
          >
            <div className="flex flex-col gap-4">
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#about"
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </a>
              {!loading && (
                user ? (
                  <Button variant="hero" size="lg" className="mt-2" asChild>
                    <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      Dashboard
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" size="lg" asChild>
                      <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                        Sign In
                      </Link>
                    </Button>
                    <Button variant="hero" size="lg" className="mt-2 text-foreground" asChild>
                      <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                        Get Started
                      </Link>
                    </Button>
                  </>
                )
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
