-- Add edited_at and reply_to columns to messages table for edit and reply functionality
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reply_to uuid REFERENCES public.messages(id) DEFAULT NULL;

-- Create index for faster reply lookups
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to);

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Allow users to update their own messages (for editing)
CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
USING (sender_user_id = auth.uid())
WITH CHECK (sender_user_id = auth.uid());

-- Allow users to delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
USING (sender_user_id = auth.uid());