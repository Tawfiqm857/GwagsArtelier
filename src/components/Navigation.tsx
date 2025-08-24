import { Button } from "@/components/ui/button";
import { Menu, X, Camera, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">GwagsPortrait</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Feed
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Friends
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Groups
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Messages
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="mr-2"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="outline" className="mr-2">
              Sign In
            </Button>
            <Button className="gradient-primary text-white">
              Join Now
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border">
            <div className="flex flex-col gap-4 pt-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Feed
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Friends
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Groups
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Messages
              </a>
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {theme === "dark" ? "Light" : "Dark"} Mode
                </Button>
              </div>
              <div className="flex flex-col gap-2 pt-4">
                <Button variant="outline">Sign In</Button>
                <Button className="gradient-primary text-white">Join Now</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;