import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Handles OAuth callback by checking for tokens in URL hash/params
 * after redirect from Lovable OAuth broker
 */
export const useOAuthCallback = () => {
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check if we have OAuth tokens in the URL (hash fragment)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      
      // Also check URL search params as fallback
      const searchParams = new URLSearchParams(window.location.search);
      const accessTokenSearch = searchParams.get("access_token");
      const refreshTokenSearch = searchParams.get("refresh_token");
      
      const finalAccessToken = accessToken || accessTokenSearch;
      const finalRefreshToken = refreshToken || refreshTokenSearch;
      
      if (finalAccessToken && finalRefreshToken) {
        console.log("OAuth callback: Found tokens in URL, setting session");
        
        try {
          const { error } = await supabase.auth.setSession({
            access_token: finalAccessToken,
            refresh_token: finalRefreshToken,
          });
          
          if (error) {
            console.error("OAuth callback: Failed to set session:", error);
          } else {
            console.log("OAuth callback: Session set successfully");
            
            // Clean up URL by removing tokens
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            
            // Force reload to properly initialize authenticated state
            window.location.reload();
          }
        } catch (err) {
          console.error("OAuth callback error:", err);
        }
      }
    };
    
    handleOAuthCallback();
  }, []);
};
