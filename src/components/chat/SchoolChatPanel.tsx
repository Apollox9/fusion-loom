import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, MessageCircle, X, Minimize2 } from 'lucide-react';

interface Message {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  sender_role: string;
  text: string;
  created_at: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeConversation();
  }, [userId]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      
      const channel = supabase
        .channel(`school-messages-${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
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
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeConversation = async () => {
    try {
      // First, find an admin user
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'ADMIN')
        .limit(1)
        .single();

      if (adminProfile) {
        setAdminId(adminProfile.id);
      }

      // Check if conversation with admin exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [userId])
        .eq('subject', `Support: ${schoolName}`)
        .maybeSingle();

      if (existingConv) {
        setConversationId(existingConv.id);
      } else if (adminProfile) {
        // Create new conversation with admin
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            subject: `Support: ${schoolName}`,
            participants: [userId, adminProfile.id],
            last_message_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error && newConv) {
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
    if (!newMessage.trim() || !conversationId) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          sender_user_id: userId,
          text: newMessage.trim(),
          sender_role: 'SCHOOL_USER' as const
        }]);

      if (error) throw error;

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      setNewMessage('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onMinimize}
          className="rounded-full w-14 h-14 shadow-lg"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          {messages.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full">
              {messages.filter(m => m.sender_user_id !== userId).length}
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
        </div>
        <div className="flex items-center gap-1">
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
              >
                <div
                  className={`max-w-[80%] rounded-lg p-2 ${
                    msg.sender_user_id === userId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.sender_user_id !== userId && (
                    <div className="text-xs opacity-70 mb-1 font-medium">
                      Admin
                    </div>
                  )}
                  <p className="text-sm break-words">{msg.text}</p>
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
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
  );
}
