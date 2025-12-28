import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Construction } from 'lucide-react';
import Navigation from '@/components/Navigation';

export default function Messages() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-12 container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>

        <Card className="border-primary/20">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-primary" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Construction className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground font-medium">Coming Soon</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Direct Messages</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Send private messages to your friends and followers. Start conversations, share media, and stay connected in real-time.
            </p>
            {!user && (
              <Link to="/auth">
                <Button className="gradient-primary text-white">
                  Sign Up to Get Notified
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
