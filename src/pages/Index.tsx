
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import CommunityPreview from "@/components/CommunityPreview";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <Features />
      <CommunityPreview />
    </div>
  );
};

export default Index;
