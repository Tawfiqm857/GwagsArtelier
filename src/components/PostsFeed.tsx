import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Image as ImageIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  created_at: string;
  user_id: string;
  profiles: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface PostLike {
  post_id: string;
  user_id: string;
}

const PostsFeed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchPosts();
    if (user) {
      fetchUserLikes();
    }

    // Subscribe to realtime updates
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          fetchPosts();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_likes' },
        () => {
          fetchPosts();
          if (user) fetchUserLikes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const fetchUserLikes = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id);

    if (!error && data) {
      setUserLikes(new Set(data.map(like => like.post_id)));
    }
  };

  const handleCreatePost = async () => {
    if (!user || !newPost.trim()) return;

    setPosting(true);
    const { error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: newPost.trim(),
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating post",
        description: error.message,
      });
    } else {
      setNewPost("");
      toast({ title: "Post created!" });
    }
    setPosting(false);
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Please sign in",
        description: "You need to be signed in to like posts",
      });
      return;
    }

    const isLiked = userLikes.has(postId);

    if (isLiked) {
      // Unlike
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (!error) {
        setUserLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }
    } else {
      // Like
      const { error } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      if (!error) {
        setUserLikes(prev => new Set(prev).add(postId));
      }
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

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
          {/* Create Post */}
          {user && (
            <Card className="shadow-soft border-0 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src="" />
                    <AvatarFallback className="gradient-primary text-white">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <Textarea
                      placeholder="What's on your mind?"
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="resize-none bg-background/50 border-border/50"
                      rows={3}
                    />
                    <div className="flex justify-between items-center">
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <ImageIcon className="w-5 h-5 mr-2" />
                        Photo
                      </Button>
                      <Button 
                        onClick={handleCreatePost}
                        disabled={!newPost.trim() || posting}
                        className="gradient-primary text-white"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {posting ? 'Posting...' : 'Post'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts List */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
          ) : posts.length === 0 ? (
            <Card className="shadow-soft border-0 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center text-muted-foreground">
                No posts yet. Be the first to share something!
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="shadow-soft hover:shadow-glow transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <Link to={`/profile/${post.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={post.profiles?.avatar_url || ''} />
                        <AvatarFallback className="gradient-primary text-white font-semibold">
                          {(post.profiles?.display_name || post.profiles?.username || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {post.profiles?.display_name || post.profiles?.username || 'Anonymous'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatTimeAgo(post.created_at)}
                        </p>
                      </div>
                    </Link>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-foreground mb-4 leading-relaxed">{post.content}</p>
                  
                  {post.image_url && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img 
                        src={post.image_url} 
                        alt="Post content" 
                        className="w-full h-80 object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-6">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleLike(post.id)}
                        className={`group ${userLikes.has(post.id) ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                      >
                        <Heart className={`w-5 h-5 mr-2 transition-all ${userLikes.has(post.id) ? 'fill-current' : 'group-hover:fill-current'}`} />
                        {post.likes_count}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        0
                      </Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                        <Share2 className="w-5 h-5 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {!user && (
          <div className="text-center mt-12">
            <Link to="/auth">
              <Button size="lg" className="gradient-primary text-white px-8 py-6 text-lg">
                Join to Start Posting
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default PostsFeed;
