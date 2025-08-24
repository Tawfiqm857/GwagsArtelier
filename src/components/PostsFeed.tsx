import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";

const PostsFeed = () => {
  const posts = [
    {
      id: 1,
      author: "Amina Sule",
      avatar: "AS",
      location: "Gwagwalada, Abuja",
      time: "2 hours ago",
      content: "Beautiful sunset from my balcony in Gwagwalada! Love this peaceful evening 🌅",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=400&fit=crop",
      likes: 24,
      comments: 8,
      shares: 3
    },
    {
      id: 2,
      author: "Ibrahim Musa",
      avatar: "IM",
      location: "Phase 4, Gwagwalada",
      time: "4 hours ago",
      content: "Great football match at the community field today! Our Gwagwalada team won 3-1! ⚽",
      likes: 45,
      comments: 12,
      shares: 7
    },
    {
      id: 3,
      author: "Fatima Ali",
      avatar: "FA",
      location: "Gwagwalada Market",
      time: "6 hours ago",
      content: "Fresh tomatoes and peppers at the market today! Support local vendors 🍅🌶️",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&h=400&fit=crop",
      likes: 18,
      comments: 5,
      shares: 2
    }
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Latest
            <span className="text-gradient"> Posts</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Stay connected with what's happening in your community. Share, like, and engage with posts from friends and neighbors.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {posts.map((post) => (
            <Card key={post.id} className="shadow-soft hover:shadow-glow transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src="" />
                      <AvatarFallback className="gradient-primary text-white font-semibold">
                        {post.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{post.author}</h3>
                      <p className="text-sm text-muted-foreground">{post.location} • {post.time}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-foreground mb-4 leading-relaxed">{post.content}</p>
                
                {post.image && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img 
                      src={post.image} 
                      alt="Post content" 
                      className="w-full h-80 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-6">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary group">
                      <Heart className="w-5 h-5 mr-2 group-hover:fill-current transition-all" />
                      {post.likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      {post.comments}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                      <Share2 className="w-5 h-5 mr-2" />
                      {post.shares}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" className="gradient-primary text-white px-8 py-6 text-lg">
            View All Posts
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PostsFeed;