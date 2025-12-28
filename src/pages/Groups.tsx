import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UsersRound, Plus, Send, Image, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';

interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  member_count?: number;
  is_member?: boolean;
}

interface GroupPost {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profile?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export default function Groups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupPosts, setGroupPosts] = useState<GroupPost[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupPosts(selectedGroup.id);
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      if (groupsData && user) {
        const { data: memberships } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);

        const memberGroupIds = new Set(memberships?.map(m => m.group_id) || []);

        const groupsWithMembership = await Promise.all(
          groupsData.map(async (group) => {
            const { count } = await supabase
              .from('group_members')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', group.id);

            return {
              ...group,
              member_count: count || 0,
              is_member: memberGroupIds.has(group.id)
            };
          })
        );

        setGroups(groupsWithMembership);
      } else {
        setGroups(groupsData || []);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupPosts = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('group_posts')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const postsWithProfiles = await Promise.all(
          data.map(async (post) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, display_name, avatar_url')
              .eq('id', post.user_id)
              .maybeSingle();

            return { ...post, profile };
          })
        );
        setGroupPosts(postsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching group posts:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) return;

    try {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({ name: newGroupName, description: newGroupDescription, created_by: user.id })
        .select()
        .single();

      if (groupError) throw groupError;

      await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: user.id, role: 'admin' });

      toast({ title: 'Group created successfully!' });
      setNewGroupName('');
      setNewGroupDescription('');
      setCreateDialogOpen(false);
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({ title: 'Error creating group', variant: 'destructive' });
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: user.id });

      toast({ title: 'Joined group!' });
      fetchGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      toast({ title: 'Error joining group', variant: 'destructive' });
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      toast({ title: 'Left group' });
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
        setGroupPosts([]);
      }
      fetchGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({ title: 'Error leaving group', variant: 'destructive' });
    }
  };

  const handleCreatePost = async () => {
    if (!user || !selectedGroup || !newPostContent.trim()) return;

    try {
      let imageUrl = null;
      if (postImage) {
        const fileExt = postImage.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, postImage);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      await supabase
        .from('group_posts')
        .insert({
          group_id: selectedGroup.id,
          user_id: user.id,
          content: newPostContent,
          image_url: imageUrl
        });

      toast({ title: 'Post created!' });
      setNewPostContent('');
      setPostImage(null);
      fetchGroupPosts(selectedGroup.id);
    } catch (error) {
      console.error('Error creating post:', error);
      toast({ title: 'Error creating post', variant: 'destructive' });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 pb-12 container mx-auto px-4 max-w-2xl text-center">
          <UsersRound className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Sign in to access Groups</h1>
          <p className="text-muted-foreground">Create and join groups to connect with like-minded people.</p>
        </div>
      </div>
    );
  }

  if (selectedGroup) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 pb-12 container mx-auto px-4 max-w-2xl">
          <Button variant="ghost" onClick={() => setSelectedGroup(null)} className="mb-4">
            ← Back to Groups
          </Button>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedGroup.avatar_url || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {selectedGroup.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle>{selectedGroup.name}</CardTitle>
                  <p className="text-muted-foreground text-sm">{selectedGroup.description}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <Users className="w-4 h-4 inline mr-1" />
                    {selectedGroup.member_count} members
                  </p>
                </div>
                <Button variant="outline" onClick={() => handleLeaveGroup(selectedGroup.id)}>
                  Leave
                </Button>
              </div>
            </CardHeader>
          </Card>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <Textarea
                placeholder="Share something with the group..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="mb-3"
              />
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setPostImage(e.target.files?.[0] || null)}
                  />
                  <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <Image className="w-5 h-5" />
                    {postImage && <span className="text-sm">{postImage.name}</span>}
                  </div>
                </label>
                <Button onClick={handleCreatePost} className="ml-auto gradient-primary text-primary-foreground">
                  <Send className="w-4 h-4 mr-2" /> Post
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {groupPosts.map((post) => (
              <Card key={post.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={post.profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {post.profile?.display_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{post.profile?.display_name || post.profile?.username || 'User'}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                      <p className="mt-2">{post.content}</p>
                      {post.image_url && (
                        <img src={post.image_url} alt="" className="mt-3 rounded-lg max-h-80 object-cover" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {groupPosts.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No posts yet. Be the first to share!</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-12 container mx-auto px-4 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Groups</h1>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" /> Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                />
                <Button onClick={handleCreateGroup} className="w-full gradient-primary text-primary-foreground">
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading groups...</p>
        ) : groups.length === 0 ? (
          <Card className="border-primary/20">
            <CardContent className="p-12 text-center">
              <UsersRound className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-2">No groups yet</h2>
              <p className="text-muted-foreground">Be the first to create a group!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <Card key={group.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={group.avatar_url || ''} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {group.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{group.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{group.description}</p>
                      <p className="text-sm text-muted-foreground">
                        <Users className="w-3 h-3 inline mr-1" />
                        {group.member_count} members
                      </p>
                    </div>
                    {group.is_member ? (
                      <Button onClick={() => setSelectedGroup(group)}>
                        View
                      </Button>
                    ) : (
                      <Button onClick={() => handleJoinGroup(group.id)} variant="outline">
                        Join
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
