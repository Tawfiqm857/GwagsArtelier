
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Users, BookOpen, Heart, Zap, Shield } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: MessageCircle,
      title: "Story Circles",
      description: "Share your journey in intimate circles where every voice matters and growth is celebrated.",
      gradient: "gradient-primary"
    },
    {
      icon: Users,
      title: "Tribe Building",
      description: "Find your people and build meaningful connections that support your personal evolution.",
      gradient: "gradient-secondary"
    },
    {
      icon: BookOpen,
      title: "Growth Journals",
      description: "Document your transformation with guided prompts and reflection tools designed for insight.",
      gradient: "bg-accent"
    },
    {
      icon: Heart,
      title: "Emotional Support",
      description: "Access a network of caring individuals who understand your journey and celebrate your wins.",
      gradient: "gradient-primary"
    },
    {
      icon: Zap,
      title: "Inspiration Hub",
      description: "Discover daily inspiration, challenges, and opportunities to step into your fullest potential.",
      gradient: "gradient-secondary"
    },
    {
      icon: Shield,
      title: "Safe Space",
      description: "Share vulnerably in a protected environment where authenticity is honored and respected.",
      gradient: "bg-accent"
    }
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything You Need to
            <span className="text-gradient"> Unfold</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our platform provides the tools, community, and support you need to embrace your authentic self and grow alongside others.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="shadow-soft hover:shadow-glow transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm group hover:scale-105">
              <CardContent className="p-8">
                <div className={`w-14 h-14 ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
