-- Drop and recreate the INSERT policy with correct roles
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;

CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages
AS PERMISSIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (true);