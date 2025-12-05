import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, MessageCircle, X, Search, Users, User, School, Megaphone, Reply, Edit2, Trash2, Check, XCircle } from 'lucide-react';

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
  edited_at: string | null;
  reply_to: string | null;
  is_read_by: any;
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
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [conversationUnreadCounts, setConversationUnreadCounts] = useState<Record<string, number>>({});
  
  // Reply and edit state
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editText, setEditText] = useState('');
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
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
    
    // Subscribe to all conversations for real-time updates
    const channel = supabase
      .channel('admin-all-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as Message;
            if (selectedConversation?.id === newMsg.conversation_id) {
              setMessages(prev => [...prev, newMsg]);
              markMessageAsRead(newMsg.id);
            }
            fetchConversations();
            calculateUnreadCounts();
          } else if (payload.eventType === 'UPDATE') {
            if (selectedConversation) {
              setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new as Message : m));
            }
          } else if (payload.eventType === 'DELETE') {
            if (selectedConversation) {
              setMessages(prev => prev.filter(m => m.id !== payload.old.id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    calculateUnreadCounts();
  }, [conversations, messages, userId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const calculateUnreadCounts = async () => {
    try {
      let total = 0;
      const counts: Record<string, number> = {};
      
      for (const conv of conversations) {
        const { data: convMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id);
        
        const unread = (convMessages || []).filter(m => 
          m.sender_user_id !== userId && 
          (!m.is_read_by || !m.is_read_by[userId])
        ).length;
        
        counts[conv.id] = unread;
        total += unread;
      }
      
      setConversationUnreadCounts(counts);
      setTotalUnreadCount(total);
    } catch (error) {
      console.error('Failed to calculate unread counts:', error);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      const { data: msg } = await supabase
        .from('messages')
        .select('is_read_by')
        .eq('id', messageId)
        .single();
      
      const currentReadBy = (msg?.is_read_by as Record<string, boolean>) || {};
      
      await supabase
        .from('messages')
        .update({ 
          is_read_by: { ...currentReadBy, [userId]: true } 
        })
        .eq('id', messageId);
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const markAllMessagesAsRead = async (conversationId: string) => {
    try {
      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .neq('sender_user_id', userId);
      
      for (const msg of (unreadMessages || [])) {
        if (!msg.is_read_by || !msg.is_read_by[userId]) {
          await markMessageAsRead(msg.id);
        }
      }
      calculateUnreadCounts();
    } catch (error) {
      console.error('Failed to mark all messages as read:', error);
    }
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
      
      // Mark all messages as read
      markAllMessagesAsRead(conversationId);
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
      const messageData: any = {
        conversation_id: selectedConversation.id,
        sender_user_id: userId,
        text: newMessage.trim(),
        sender_role: 'ADMIN',
        is_read_by: { [userId]: true }
      };

      if (replyingTo) {
        messageData.reply_to = replyingTo.id;
      }

      const { error } = await supabase
        .from('messages')
        .insert([messageData]);

      if (error) throw error;

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

      setNewMessage('');
      setReplyingTo(null);
      fetchConversations();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const canEditMessage = (message: Message) => {
    if (message.sender_user_id !== userId) return false;
    const createdAt = new Date(message.created_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    return diffMinutes <= 15;
  };

  const handleEditMessage = async () => {
    if (!editingMessage || !editText.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          text: editText.trim(),
          edited_at: new Date().toISOString()
        })
        .eq('id', editingMessage.id);

      if (error) throw error;
      
      setEditingMessage(null);
      setEditText('');
      toast({ title: 'Message updated' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to edit message',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteMessages = async () => {
    if (selectedMessages.size === 0) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .in('id', Array.from(selectedMessages));

      if (error) throw error;
      
      setSelectedMessages(new Set());
      setIsSelectionMode(false);
      toast({ title: `${selectedMessages.size} message(s) deleted` });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete messages',
        variant: 'destructive'
      });
    }
  };

  const toggleSelectMessage = (messageId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const getReplyPreview = (replyToId: string) => {
    const originalMsg = messages.find(m => m.id === replyToId);
    if (!originalMsg) return null;
    return originalMsg.text.substring(0, 50) + (originalMsg.text.length > 50 ? '...' : '');
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
            subject = `Support: ${school.name}`;
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

      for (const targetUserId of targetUserIds) {
        // For individual school, use proper subject format
        let convSubject = subject;
        if (broadcastTarget === 'individual_school') {
          const school = schools.find(s => s.user_id === targetUserId);
          if (school) {
            convSubject = `Support: ${school.name}`;
          }
        }

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
              subject: convSubject,
              participants: [userId, targetUserId],
              last_message_at: new Date().toISOString()
            })
            .select()
            .single();

          if (convError) throw convError;
          conversationId = newConv.id;
        }

        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_user_id: userId,
            text: broadcastMessage.trim(),
            sender_role: 'ADMIN',
            is_read_by: { [userId]: true }
          });

        if (msgError) throw msgError;

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
            {totalUnreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {totalUnreadCount} unread
              </Badge>
            )}
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
                const unreadCount = conversationUnreadCounts[conv.id] || 0;
                
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
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm truncate">{conv.subject || 'No Subject'}</div>
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs h-5 min-w-5 flex items-center justify-center">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
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
              <div className="flex items-center gap-1">
                {isSelectionMode && selectedMessages.size > 0 && (
                  <Button variant="destructive" size="icon" onClick={handleDeleteMessages} className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedConversation(null)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((msg) => {
                  const schoolInfo = getSchoolInfo(msg.sender_user_id);
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_user_id === userId ? 'justify-end' : 'justify-start'}`}
                      onClick={() => isSelectionMode && msg.sender_user_id === userId && toggleSelectMessage(msg.id)}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 relative group ${
                          msg.sender_user_id === userId
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                        } ${isSelectionMode && selectedMessages.has(msg.id) ? 'ring-2 ring-destructive' : ''}`}
                      >
                        {msg.reply_to && (
                          <div className={`text-xs mb-1 p-1 rounded border-l-2 ${
                            msg.sender_user_id === userId 
                              ? 'bg-primary-foreground/10 border-primary-foreground/50' 
                              : 'bg-slate-200 dark:bg-slate-700 border-slate-400'
                          }`}>
                            <Reply className="h-3 w-3 inline mr-1" />
                            {getReplyPreview(msg.reply_to)}
                          </div>
                        )}
                        
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
                        
                        {editingMessage?.id === msg.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="h-7 text-sm bg-background text-foreground"
                            />
                            <div className="flex gap-1">
                              <Button size="icon" className="h-6 w-6" onClick={handleEditMessage}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingMessage(null)}>
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                        )}
                        
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-xs opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {msg.edited_at && <span className="ml-1">(edited)</span>}
                          </div>
                          
                          {!editingMessage && !isSelectionMode && (
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReplyingTo(msg);
                                }}
                              >
                                <Reply className="h-3 w-3" />
                              </Button>
                              {canEditMessage(msg) && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingMessage(msg);
                                      setEditText(msg.text);
                                    }}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsSelectionMode(true);
                                      setSelectedMessages(new Set([msg.id]));
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {replyingTo && (
              <div className="px-4 py-2 border-t bg-muted/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Reply className="h-3 w-3" />
                  <span>Replying to: {replyingTo.text.substring(0, 40)}...</span>
                </div>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setReplyingTo(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

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