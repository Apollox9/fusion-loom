-- Add UPDATE policy for conversations so participants can update last_message_at
CREATE POLICY "Participants can update their conversations"
ON public.conversations
FOR UPDATE
USING (auth.uid() = ANY (participants))
WITH CHECK (auth.uid() = ANY (participants));