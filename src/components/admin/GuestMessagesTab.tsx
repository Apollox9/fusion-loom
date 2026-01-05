import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Mail, Eye, Clock, Check } from 'lucide-react';

interface GuestMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function GuestMessagesTab() {
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<GuestMessage | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel('guest-messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guest_messages'
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('guest_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
      setUnreadCount(data?.filter(m => !m.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching guest messages:', error);
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = async (message: GuestMessage) => {
    setSelectedMessage(message);
    setShowDetails(true);

    // Mark as read if not already
    if (!message.is_read) {
      try {
        await supabase
          .from('guest_messages')
          .update({ is_read: true })
          .eq('id', message.id);
        
        setMessages(prev => 
          prev.map(m => m.id === message.id ? { ...m, is_read: true } : m)
        );
        setUnreadCount(prev => prev - 1);
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await supabase
        .from('guest_messages')
        .update({ is_read: true })
        .eq('is_read', false);
      
      setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
      setUnreadCount(0);
      toast.success('All messages marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Guest Messages
                {unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount} unread</Badge>
                )}
              </CardTitle>
              <CardDescription>Messages from the contact page</CardDescription>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                <Check className="h-4 w-4 mr-1" />
                Mark All Read
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => (
                  <TableRow key={message.id} className={!message.is_read ? 'bg-primary/5 font-medium' : ''}>
                    <TableCell>
                      {!message.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{message.name}</p>
                        <p className="text-xs text-muted-foreground">{message.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{message.subject}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {message.message.substring(0, 50)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(message.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewMessage(message)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Message Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
            <DialogDescription>
              From {selectedMessage?.name} on {selectedMessage && new Date(selectedMessage.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedMessage.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a href={`mailto:${selectedMessage.email}`} className="font-medium text-primary hover:underline">
                    {selectedMessage.email}
                  </a>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Message</p>
                <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t">
                <Button asChild>
                  <a href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Reply via Email
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
