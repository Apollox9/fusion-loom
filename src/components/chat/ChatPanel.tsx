import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Send, MessageCircle, X, Minimize2, Maximize2, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface Conversation {
  id: string;
  subject: string;
  participants: string[];
  last_message_at: string;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  sender_role: string;
  text: string;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

interface ChatPanelProps {
  userId: string;
  userRole: string;
  isMinimized?: boolean;
  onMinimize?: () => void;
  onClose?: () => void;
  embedded?: boolean;
}

export function ChatPanel({ userId, userRole, isMinimized = false, onMinimize, onClose, embedded = false }: ChatPanelProps) {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [newConversation, setNewConversation] = useState({
    subject: '',
    participants: [] as string[]
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    fetchProfiles();
  }, [userId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      
      const channel = supabase
        .channel(`messages-${selectedConversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversation.id}`
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [userId])
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: selectedConversation.id,
          sender_user_id: userId,
          text: newMessage.trim(),
          sender_role: userRole as 'ADMIN' | 'OPERATOR' | 'AUDITOR' | 'SUPERVISOR' | 'AGENT' | 'SCHOOL_USER'
        }]);

      if (error) throw error;

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

      setNewMessage('');
      fetchConversations();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const handleCreateConversation = async () => {
    if (!newConversation.subject.trim() || newConversation.participants.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert([{
          subject: newConversation.subject,
          participants: [...newConversation.participants, userId],
          last_message_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Conversation created'
      });

      setIsNewConversationOpen(false);
      setNewConversation({ subject: '', participants: [] });
      fetchConversations();
      setSelectedConversation(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create conversation',
        variant: 'destructive'
      });
    }
  };

  const getProfileName = (userId: string) => {
    const profile = profiles.find(p => p.id === userId);
    return profile?.full_name || 'Unknown';
  };

  const getProfileRole = (userId: string) => {
    const profile = profiles.find(p => p.id === userId);
    return profile?.role || 'USER';
  };

  const filteredConversations = conversations.filter(c =>
    c.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isMinimized && !embedded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onMinimize}
          className="rounded-full w-14 h-14 shadow-lg"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          {conversations.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full">
              {conversations.length}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  const containerClass = embedded 
    ? "w-full h-full rounded-lg border bg-card" 
    : "fixed bottom-4 right-4 w-96 h-[600px] z-50 shadow-2xl rounded-lg border bg-card";

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h3 className="font-semibold">Messages</h3>
          {conversations.length > 0 && (
            <Badge variant="secondary">{conversations.length}</Badge>
          )}
        </div>
        {!embedded && (
          <div className="flex items-center gap-1">
            {onMinimize && (
              <Button variant="ghost" size="icon" onClick={onMinimize}>
                <Minimize2 className="h-4 w-4" />
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {!selectedConversation ? (
        <div className="flex flex-col h-[calc(100%-65px)]">
          <div className="p-3 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  New Conversation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Subject</Label>
                    <Input
                      value={newConversation.subject}
                      onChange={(e) => setNewConversation({ ...newConversation, subject: e.target.value })}
                      placeholder="Enter subject"
                    />
                  </div>
                  <div>
                    <Label>Participants</Label>
                    <ScrollArea className="h-48 border rounded-md p-3">
                      {profiles.filter(p => p.id !== userId).map((profile) => (
                        <div key={profile.id} className="flex items-center space-x-2 py-2">
                          <Checkbox
                            id={profile.id}
                            checked={newConversation.participants.includes(profile.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewConversation({
                                  ...newConversation,
                                  participants: [...newConversation.participants, profile.id]
                                });
                              } else {
                                setNewConversation({
                                  ...newConversation,
                                  participants: newConversation.participants.filter(id => id !== profile.id)
                                });
                              }
                            }}
                          />
                          <label htmlFor={profile.id} className="text-sm cursor-pointer">
                            {profile.full_name} <span className="text-muted-foreground">({profile.role})</span>
                          </label>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsNewConversationOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateConversation}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <ScrollArea className="flex-1 p-2">
            {filteredConversations.length > 0 ? (
              <div className="space-y-2">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="p-3 rounded-lg border bg-background hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="font-medium text-sm truncate">{conv.subject || 'No Subject'}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {conv.participants.length} participants • {new Date(conv.last_message_at || conv.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1">Start a new conversation to get started</p>
              </div>
            )}
          </ScrollArea>
        </div>
      ) : (
        <div className="flex flex-col h-[calc(100%-65px)]">
          <div className="p-3 border-b flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{selectedConversation.subject}</h4>
              <p className="text-xs text-muted-foreground">{selectedConversation.participants.length} participants</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedConversation(null)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_user_id === userId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-2 ${
                      msg.sender_user_id === userId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.sender_user_id !== userId && (
                      <div className="text-xs opacity-70 mb-1">
                        {getProfileName(msg.sender_user_id)} • {getProfileRole(msg.sender_user_id)}
                      </div>
                    )}
                    <p className="text-sm break-words">{msg.text}</p>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-3">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="h-9"
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="icon" className="h-9 w-9">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
