import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Calendar, Mail, Phone, MapPin, School, Eye, Check, Clock } from 'lucide-react';

interface DemoRequest {
  id: string;
  school_name: string;
  location: string;
  headmaster_name: string;
  email: string;
  phone: string;
  preferred_date: string;
  message: string | null;
  is_read: boolean;
  status: string;
  created_at: string;
}

export function DemoRequestsTab() {
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchDemoRequests();

    // Real-time subscription
    const channel = supabase
      .channel('demo-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'demo_requests'
        },
        () => {
          fetchDemoRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDemoRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('demo_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
      setUnreadCount(data?.filter(r => !r.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching demo requests:', error);
      toast.error('Failed to fetch demo requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (request: DemoRequest) => {
    setSelectedRequest(request);
    setShowDetails(true);

    // Mark as read if not already
    if (!request.is_read) {
      try {
        await supabase
          .from('demo_requests')
          .update({ is_read: true })
          .eq('id', request.id);
        
        setRequests(prev => 
          prev.map(r => r.id === request.id ? { ...r, is_read: true } : r)
        );
        setUnreadCount(prev => prev - 1);
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }
  };

  const handleUpdateStatus = async (requestId: string, status: string) => {
    try {
      await supabase
        .from('demo_requests')
        .update({ status })
        .eq('id', requestId);
      
      setRequests(prev => 
        prev.map(r => r.id === requestId ? { ...r, status } : r)
      );
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      'PENDING': { variant: 'outline', label: 'Pending' },
      'CONTACTED': { variant: 'secondary', label: 'Contacted' },
      'SCHEDULED': { variant: 'default', label: 'Scheduled' },
      'COMPLETED': { variant: 'default', label: 'Completed' },
      'CANCELLED': { variant: 'destructive', label: 'Cancelled' }
    };
    const config = configs[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
                Demo Requests
                {unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount} new</Badge>
                )}
              </CardTitle>
              <CardDescription>Manage demo requests from potential schools</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No demo requests yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Headmaster</TableHead>
                  <TableHead>Preferred Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id} className={!request.is_read ? 'bg-primary/5' : ''}>
                    <TableCell>
                      {!request.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{request.school_name}</TableCell>
                    <TableCell>{request.headmaster_name}</TableCell>
                    <TableCell>{new Date(request.preferred_date).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(request)}
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

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Demo Request Details</DialogTitle>
            <DialogDescription>
              Submitted on {selectedRequest && new Date(selectedRequest.created_at).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <School className="h-4 w-4" />
                    School Name
                  </div>
                  <p className="font-medium">{selectedRequest.school_name}</p>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <MapPin className="h-4 w-4" />
                    Location
                  </div>
                  <p className="font-medium">{selectedRequest.location}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    Headmaster
                  </div>
                  <p className="font-medium">{selectedRequest.headmaster_name}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    Preferred Date
                  </div>
                  <p className="font-medium">{new Date(selectedRequest.preferred_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                  <a href={`mailto:${selectedRequest.email}`} className="font-medium text-primary hover:underline">
                    {selectedRequest.email}
                  </a>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Phone className="h-4 w-4" />
                    Phone
                  </div>
                  <a href={`tel:${selectedRequest.phone}`} className="font-medium text-primary hover:underline">
                    {selectedRequest.phone}
                  </a>
                </div>
                {selectedRequest.message && (
                  <div className="col-span-2">
                    <div className="text-sm text-muted-foreground mb-1">Additional Notes</div>
                    <p className="font-medium bg-muted p-3 rounded-md">{selectedRequest.message}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button 
                  size="sm" 
                  asChild
                  className="bg-gradient-hero text-white"
                >
                  <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedRequest.email)}&su=${encodeURIComponent(`Re: Demo Request - ${selectedRequest.school_name}`)}`} target="_blank" rel="noopener noreferrer">
                    <Mail className="h-4 w-4 mr-1" />
                    Reply via Email
                  </a>
                </Button>
                <Button 
                  size="sm" 
                  variant={selectedRequest.status === 'CONTACTED' ? 'default' : 'outline'}
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'CONTACTED')}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Mark Contacted
                </Button>
                <Button 
                  size="sm" 
                  variant={selectedRequest.status === 'SCHEDULED' ? 'default' : 'outline'}
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'SCHEDULED')}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Mark Scheduled
                </Button>
                <Button 
                  size="sm" 
                  variant={selectedRequest.status === 'COMPLETED' ? 'default' : 'outline'}
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'COMPLETED')}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Completed
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
