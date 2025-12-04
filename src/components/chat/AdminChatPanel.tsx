import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, MessageCircle, X, Search, Users, User, School, Megaphone } from 'lucide-react';

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

interface SchoolData {
  id: string;
  name: string;
  headmaster_name: string | null;
  user_id: string | null;
}

interface StaffData {
  id: string;
  full_name: string;
  role: string;
  user_id: string | null;
}

interface AdminChatPanelProps {
  userId: string;
}

type BroadcastTarget = 'individual_school' | 'individual_staff' | 'all_schools' | 'all_staff' | 'all_users';

export function AdminChatPanel({ userId }: AdminChatPanelProps) {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [staff, setStaff] = useState<StaffData[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Broadcast state
  const [broadcastTarget, setBroadcastTarget] = useState<BroadcastTarget>('individual_school');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    fetchProfiles();
    fetchSchools();
    fetchStaff();
  }, [userId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      
      const channel = supabase
        .channel(`admin-messages-${selectedConversation.id}`)
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

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, headmaster_name, user_id')
        .order('name');

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, full_name, role, user_id')
        .order('full_name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
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
          sender_role: 'ADMIN' as const
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

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive'
      });
      return;
    }

    setIsSending(true);
    
    try {
      let targetUserIds: string[] = [];
      let subject = '';

      switch (broadcastTarget) {
        case 'individual_school':
          if (!selectedSchoolId) {
            toast({ title: 'Error', description: 'Please select a school', variant: 'destructive' });
            setIsSending(false);
            return;
          }
          const school = schools.find(s => s.id === selectedSchoolId);
          if (school?.user_id) {
            targetUserIds = [school.user_id];
            subject = `Message to ${school.name}`;
          }
          break;
        case 'individual_staff':
          if (!selectedStaffId) {
            toast({ title: 'Error', description: 'Please select a staff member', variant: 'destructive' });
            setIsSending(false);
            return;
          }
          const staffMember = staff.find(s => s.id === selectedStaffId);
          if (staffMember?.user_id) {
            targetUserIds = [staffMember.user_id];
            subject = `Message to ${staffMember.full_name}`;
          }
          break;
        case 'all_schools':
          targetUserIds = schools.filter(s => s.user_id).map(s => s.user_id!);
          subject = 'Broadcast to All Schools';
          break;
        case 'all_staff':
          targetUserIds = staff.filter(s => s.user_id).map(s => s.user_id!);
          subject = 'Broadcast to All Staff';
          break;
        case 'all_users':
          const schoolUserIds = schools.filter(s => s.user_id).map(s => s.user_id!);
          const staffUserIds = staff.filter(s => s.user_id).map(s => s.user_id!);
          targetUserIds = [...new Set([...schoolUserIds, ...staffUserIds])];
          subject = 'Broadcast to All Users';
          break;
      }

      if (targetUserIds.length === 0) {
        toast({ title: 'Error', description: 'No recipients found', variant: 'destructive' });
        setIsSending(false);
        return;
      }

      // Create conversations and send messages
      for (const targetUserId of targetUserIds) {
        // Check for existing conversation
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('*')
          .contains('participants', [userId, targetUserId])
          .maybeSingle();

        let conversationId: string;

        if (existingConv) {
          conversationId = existingConv.id;
        } else {
          const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert({
              subject,
              participants: [userId, targetUserId],
              last_message_at: new Date().toISOString()
            })
            .select()
            .single();

          if (convError) throw convError;
          conversationId = newConv.id;
        }

        // Send message
        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_user_id: userId,
            text: broadcastMessage.trim(),
            sender_role: 'ADMIN' as const
          });

        if (msgError) throw msgError;

        // Update conversation last_message_at
        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversationId);
      }

      toast({
        title: 'Success',
        description: `Message sent to ${targetUserIds.length} recipient(s)`
      });

      setBroadcastMessage('');
      fetchConversations();
    } catch (error) {
      console.error('Failed to send broadcast:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  const getProfileName = (id: string) => {
    const profile = profiles.find(p => p.id === id);
    return profile?.full_name || 'Unknown';
  };

  const getSchoolInfo = (participantId: string) => {
    // Find school where user_id matches
    const school = schools.find(s => s.user_id === participantId);
    return school;
  };

  const filteredConversations = conversations.filter(c =>
    c.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-[600px] rounded-lg border bg-card flex">
      {/* Left Panel - Conversations & Broadcast */}
      <div className="w-1/3 border-r flex flex-col">
        <div className="p-4 border-b bg-muted/50">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
          </h3>
        </div>

        {/* Broadcast Section */}
        <div className="p-3 border-b space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Megaphone className="h-4 w-4" />
            Send Message
          </div>
          
          <Select value={broadcastTarget} onValueChange={(v) => setBroadcastTarget(v as BroadcastTarget)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select recipient type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual_school">
                <span className="flex items-center gap-2"><School className="h-3 w-3" /> Individual School</span>
              </SelectItem>
              <SelectItem value="individual_staff">
                <span className="flex items-center gap-2"><User className="h-3 w-3" /> Individual Staff</span>
              </SelectItem>
              <SelectItem value="all_schools">
                <span className="flex items-center gap-2"><School className="h-3 w-3" /> All Schools</span>
              </SelectItem>
              <SelectItem value="all_staff">
                <span className="flex items-center gap-2"><Users className="h-3 w-3" /> All Staff</span>
              </SelectItem>
              <SelectItem value="all_users">
                <span className="flex items-center gap-2"><Users className="h-3 w-3" /> All Users</span>
              </SelectItem>
            </SelectContent>
          </Select>

          {broadcastTarget === 'individual_school' && (
            <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select school" />
              </SelectTrigger>
              <SelectContent>
                {schools.filter(s => s.user_id).map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {broadcastTarget === 'individual_staff' && (
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select staff" />
              </SelectTrigger>
              <SelectContent>
                {staff.filter(s => s.user_id).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.full_name} ({s.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Textarea
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            placeholder="Type your message..."
            className="text-xs min-h-[60px]"
          />
          
          <Button 
            onClick={handleBroadcast} 
            disabled={isSending || !broadcastMessage.trim()}
            size="sm" 
            className="w-full"
          >
            <Send className="h-3 w-3 mr-2" />
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </div>

        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {filteredConversations.length > 0 ? (
            <div className="p-2 space-y-1">
              {filteredConversations.map((conv) => {
                const otherParticipant = conv.participants.find(p => p !== userId);
                const schoolInfo = otherParticipant ? getSchoolInfo(otherParticipant) : null;
                
                return (
                  <div
                    key={conv.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation?.id === conv.id 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'hover:bg-accent border border-transparent'
                    }`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="font-medium text-sm truncate">{conv.subject || 'No Subject'}</div>
                    {schoolInfo && (
                      <div className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium">{schoolInfo.name}</span>
                        {schoolInfo.headmaster_name && (
                          <span className="block text-xs opacity-70">{schoolInfo.headmaster_name}</span>
                        )}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(conv.last_message_at || conv.created_at).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center p-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
              <p className="text-xs text-muted-foreground">No conversations</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel - Chat View */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b flex items-center justify-between bg-muted/50">
              <div>
                <h4 className="font-medium">{selectedConversation.subject}</h4>
                {(() => {
                  const otherParticipant = selectedConversation.participants.find(p => p !== userId);
                  const schoolInfo = otherParticipant ? getSchoolInfo(otherParticipant) : null;
                  if (schoolInfo) {
                    return (
                      <p className="text-xs text-muted-foreground">
                        {schoolInfo.name} • {schoolInfo.headmaster_name || 'No headmaster'}
                      </p>
                    );
                  }
                  return <p className="text-xs text-muted-foreground">{selectedConversation.participants.length} participants</p>;
                })()}
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

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((msg) => {
                  const schoolInfo = getSchoolInfo(msg.sender_user_id);
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_user_id === userId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.sender_user_id === userId
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {msg.sender_user_id !== userId && (
                          <div className="text-xs opacity-70 mb-1">
                            <span className="font-medium">{getProfileName(msg.sender_user_id)}</span>
                            {schoolInfo && (
                              <span className="block text-[10px] opacity-80">
                                {schoolInfo.name} • {schoolInfo.headmaster_name || 'No headmaster'}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-sm break-words">{msg.text}</p>
                        <div className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t p-4">
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
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground">Select a conversation or send a new message</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
