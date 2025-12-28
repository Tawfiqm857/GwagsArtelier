import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Edit2, Save, X, Heart, MessageCircle, ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  created_at: string;
}

export default function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: '', bio: '' });
  const [uploading, setUploading] = useState(false);

  const profileId = userId || user?.id;
  const isOwnProfile = user?.id === profileId;

  useEffect(() => {
    if (profileId) {
      fetchProfile();
      fetchPosts();
    }
  }, [profileId]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      toast({ variant: 'destructive', title: 'Error loading profile' });
    } else if (data) {
      setProfile(data);
      setEditForm({ 
        display_name: data.display_name || '', 
        bio: data.bio || '' 
      });
    }
    setLoading(false);
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
    } else {
      setPosts(data || []);
    }
  };

  const handleSaveProfile = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: editForm.display_name,
        bio: editForm.bio,
      })
      .eq('id', user?.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error updating profile' });
    } else {
      setProfile(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditing(false);
      toast({ title: 'Profile updated!' });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ variant: 'destructive', title: 'Error uploading avatar' });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      toast({ variant: 'destructive', title: 'Error updating profile' });
    } else {
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast({ title: 'Avatar updated!' });
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Profile not found</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Feed
          </Button>

          {/* Profile Header */}
          <Card className="mb-8 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-primary">
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                      {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isOwnProfile && (
                    <label className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                      <Camera className="w-4 h-4 text-primary-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 w-full">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Display Name</label>
                        <Input
                          value={editForm.display_name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Bio</label>
                        <Textarea
                          value={editForm.bio}
                          onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                          className="bg-background resize-none"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveProfile} className="gap-2">
                          <Save className="w-4 h-4" />
                          Save
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-2">
                          <X className="w-4 h-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <h1 className="text-2xl font-bold text-foreground">
                          {profile.display_name || profile.username || 'Anonymous'}
                        </h1>
                        {isOwnProfile && (
                          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </Button>
                        )}
                      </div>
                      {profile.username && (
                        <p className="text-muted-foreground mb-3">@{profile.username}</p>
                      )}
                      <p className="text-foreground">{profile.bio || 'No bio yet'}</p>
                      <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
                        <span><strong className="text-foreground">{posts.length}</strong> posts</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Posts Grid */}
          <h2 className="text-xl font-bold text-foreground mb-4">Posts</h2>
          {posts.length === 0 ? (
            <Card className="border-primary/20">
              <CardContent className="p-8 text-center text-muted-foreground">
                {isOwnProfile ? "You haven't posted anything yet" : "No posts yet"}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="border-primary/20">
                  <CardContent className="p-4">
                    <p className="text-foreground mb-3">{post.content}</p>
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt="Post"
                        className="rounded-lg w-full max-h-96 object-cover mb-3"
                      />
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {post.likes_count}
                      </span>
                      <span>
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
