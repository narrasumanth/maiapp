import { useRef, useCallback } from "react";

interface HoneypotFieldProps {
  formId: string;
  onBotDetected?: () => void;
}

/**
 * Invisible honeypot field to detect bots.
 * Bots will fill this field, humans won't see it.
 */
export const HoneypotField = ({ formId, onBotDetected }: HoneypotFieldProps) => {
  const fieldRef = useRef<HTMLInputElement>(null);

  const checkHoneypot = useCallback(() => {
    if (fieldRef.current && fieldRef.current.value) {
      onBotDetected?.();
      return true; // Bot detected
    }
    return false;
  }, [onBotDetected]);

  return (
    <>
      {/* Honeypot field - hidden from humans via CSS */}
      <div 
        aria-hidden="true" 
        style={{ 
          position: 'absolute',
          left: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      >
        <label htmlFor={`${formId}-hp`}>
          Leave this field empty
        </label>
        <input
          ref={fieldRef}
          type="text"
          id={`${formId}-hp`}
          name={`${formId}_website_url`}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
    </>
  );
};

/**
 * Hook to validate honeypot fields before form submission
 */
export const useHoneypotValidation = (formId: string) => {
  const validateHoneypot = useCallback((): boolean => {
    const honeypotField = document.getElementById(`${formId}-hp`) as HTMLInputElement;
    if (honeypotField && honeypotField.value) {
      console.warn("Bot detected via honeypot");
      return false; // Bot detected
    }
    return true; // Human
  }, [formId]);

  return { validateHoneypot };
};
