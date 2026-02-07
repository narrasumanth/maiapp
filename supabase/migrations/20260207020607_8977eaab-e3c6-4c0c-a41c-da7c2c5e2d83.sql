-- Function to notify all admins when a new contact message is received
CREATE OR REPLACE FUNCTION public.notify_admins_on_contact_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Insert a notification for each admin user
  FOR admin_record IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type
    ) VALUES (
      admin_record.user_id,
      '📬 New Contact Message',
      'New message from ' || NEW.sender_name || ': ' || LEFT(NEW.subject, 50) || CASE WHEN LENGTH(NEW.subject) > 50 THEN '...' ELSE '' END,
      'contact_message'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger to fire on new contact message inserts
DROP TRIGGER IF EXISTS trigger_notify_admins_contact ON public.contact_messages;
CREATE TRIGGER trigger_notify_admins_contact
  AFTER INSERT ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_contact_message();