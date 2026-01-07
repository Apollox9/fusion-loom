import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, MessageCircle, X, Minimize2, Reply, Edit2, Trash2, Check, XCircle } from 'lucide-react';

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

interface SchoolChatPanelProps {
  userId: string;
  schoolName: string;
  isMinimized?: boolean;
  onMinimize?: () => void;
  onClose?: () => void;
}

export function SchoolChatPanel({ userId, schoolName, isMinimized = false, onMinimize, onClose }: SchoolChatPanelProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [adminId, setAdminId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editText, setEditText] = useState('');
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeConversation();
  }, [userId]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel(`school-messages-${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setMessages(prev => [...prev, payload.new as Message]);
              // Mark as read if panel is open
              if (!isMinimized) {
                markMessageAsRead(payload.new.id);
              }
            } else if (payload.eventType === 'UPDATE') {
              setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new as Message : m));
            } else if (payload.eventType === 'DELETE') {
              setMessages(prev => prev.filter(m => m.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversationId, isMinimized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Calculate unread count
    const unread = messages.filter(m => 
      m.sender_user_id !== userId && 
      (!m.is_read_by || !m.is_read_by[userId])
    ).length;
    setUnreadCount(unread);
  }, [messages, userId]);

  useEffect(() => {
    // Mark messages as read when panel opens
    if (!isMinimized && conversationId) {
      markAllMessagesAsRead();
    }
  }, [isMinimized, conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      const currentReadBy = (message?.is_read_by as Record<string, boolean>) || {};
      
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

  const markAllMessagesAsRead = async () => {
    const unreadMessages = messages.filter(m => 
      m.sender_user_id !== userId && 
      (!m.is_read_by || !m.is_read_by[userId])
    );
    
    for (const msg of unreadMessages) {
      await markMessageAsRead(msg.id);
    }
  };

  const initializeConversation = async () => {
    try {
      // Get admin profile
      const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'ADMIN')
        .limit(1)
        .maybeSingle();

      if (adminError) {
        console.error('Failed to fetch admin profile:', adminError);
        return;
      }

      if (adminProfile) {
        setAdminId(adminProfile.id);
      } else {
        console.error('No admin profile found');
        return;
      }

      // Find any existing conversation where this user is a participant
      const { data: existingConversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [userId])
        .order('last_message_at', { ascending: false });

      if (convError) {
        console.error('Failed to fetch conversations:', convError);
        return;
      }

      // Find a conversation that includes the admin
      const existingConv = existingConversations?.find(conv => 
        conv.participants.includes(adminProfile.id)
      );

      if (existingConv) {
        console.log('Found existing conversation:', existingConv.id);
        setConversationId(existingConv.id);
      } else {
        // Create new conversation with admin
        console.log('Creating new conversation with admin');
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            subject: `Support: ${schoolName}`,
            participants: [userId, adminProfile.id],
            last_message_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Failed to create conversation:', createError);
          return;
        }

        if (newConv) {
          console.log('Created new conversation:', newConv.id);
          setConversationId(newConv.id);
        }
      }
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;
    
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

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      console.log('Message is empty, not sending');
      return;
    }
    
    if (!conversationId) {
      console.error('No conversation ID available');
      toast({
        title: 'Error',
        description: 'Chat not initialized. Please try refreshing the page.',
        variant: 'destructive'
      });
      return;
    }

    console.log('Sending message:', { conversationId, userId, text: newMessage.trim() });

    try {
      const messageData: any = {
        conversation_id: conversationId,
        sender_user_id: userId,
        text: newMessage.trim(),
        sender_role: 'SCHOOL_USER',
        is_read_by: { [userId]: true }
      };

      if (replyingTo) {
        messageData.reply_to = replyingTo.id;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select();

      if (error) {
        console.error('Failed to insert message:', error);
        throw error;
      }

      console.log('Message sent successfully:', data);

      // Update conversation last_message_at
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (updateError) {
        console.error('Failed to update conversation timestamp:', updateError);
      }

      setNewMessage('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Send message error:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
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

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onMinimize}
          className="rounded-full w-14 h-14 shadow-lg relative"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 rounded-full bg-destructive text-destructive-foreground text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] z-50 shadow-2xl rounded-lg border bg-card flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold text-sm">Support Chat</h3>
            <p className="text-xs text-muted-foreground">Chat with Admin</p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">{unreadCount} new</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isSelectionMode && selectedMessages.size > 0 && (
            <Button variant="destructive" size="icon" onClick={handleDeleteMessages} className="h-8 w-8">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {onMinimize && (
            <Button variant="ghost" size="icon" onClick={onMinimize} className="h-8 w-8">
              <Minimize2 className="h-4 w-4" />
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1">Send a message to start chatting with admin</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_user_id === userId ? 'justify-end' : 'justify-start'}`}
                onClick={() => isSelectionMode && msg.sender_user_id === userId && toggleSelectMessage(msg.id)}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-2 relative group ${
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
                    <div className="text-xs opacity-70 mb-1 font-medium">
                      Admin
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
                    <p className="text-sm break-words">{msg.text}</p>
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
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {replyingTo && (
        <div className="px-3 py-2 border-t bg-muted/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Reply className="h-3 w-3" />
            <span>Replying to: {replyingTo.text.substring(0, 30)}...</span>
          </div>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setReplyingTo(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

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
  );
}