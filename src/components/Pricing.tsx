import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "€0",
    period: "forever",
    description: "Perfect for getting started with micro-learning",
    features: [
      "Up to 3 PDF uploads",
      "All learning styles",
      "Tier 1 content only",
      "5 flashcards per lesson",
      "Community support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Premium",
    price: "€10",
    period: "/month",
    description: "Unlock your full learning potential",
    features: [
      "Unlimited PDF uploads",
      "All learning styles",
      "All 3 content tiers",
      "Unlimited flashcards",
      "AI-generated diagrams",
      "Progress analytics",
      "Calendar integration",
      "Priority support",
    ],
    cta: "Upgrade to Premium",
    popular: true,
  },
];

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade when you're ready to unlock the full power of personalized learning.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? "bg-gradient-to-br from-primary/10 via-background to-primary/5 border-2 border-primary shadow-xl"
                  : "bg-background border border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className={`rounded-full p-1 ${plan.popular ? "bg-primary/20" : "bg-muted"}`}>
                      <Check className={`w-4 h-4 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full py-6 text-lg"
                variant={plan.popular ? "default" : "outline"}
                onClick={() => navigate("/auth")}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          Cancel anytime • No hidden fees • Secure payment via Stripe
        </motion.p>
      </div>
    </section>
  );
};

export default Pricing;
