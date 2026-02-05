import { supabase } from "@/integrations/supabase/client";

// Timeout for API calls (75 seconds to allow edge function time to complete)
const API_TIMEOUT_MS = 75000;

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Check if Supabase client is properly initialized
function isSupabaseReady(): boolean {
  try {
    // Access the supabase client to verify it's initialized
    return !!(supabase && typeof supabase.functions?.invoke === 'function');
  } catch {
    return false;
  }
}

// Helper to add timeout to fetch operations
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

// Helper for delay between retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface ReputationResult {
  name: string;
  category: string;
  score: number;
  summary: string;
  vibeCheck: string;
  evidence: Array<{
    icon: "star" | "message" | "news" | "trending" | "shield" | "award";
    title: string;
    value: string;
    positive: boolean;
  }>;
  metadata?: Record<string, any>;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: ReputationResult;
  error?: string;
}

export interface DisambiguationOption {
  id: string;
  name: string;
  category: string;
  description?: string;
  location?: string;
  metadata?: {
    year?: string;
    creator?: string;
    distinguisher?: string;
  };
}

export interface DisambiguationResponse {
  isAmbiguous: boolean;
  reason?: string;
  options: DisambiguationOption[];
  clarifyingQuestion?: string;
}

export const checkDisambiguation = async (query: string): Promise<DisambiguationResponse> => {
  // Check if Supabase is ready
  if (!isSupabaseReady()) {
    console.warn("[API] Supabase client not ready for disambiguation");
    return { isAmbiguous: false, options: [] };
  }

  try {
    console.log("[API] Checking disambiguation for:", query);
    const { data, error } = await withTimeout(
      supabase.functions.invoke<DisambiguationResponse>("analyze-reputation", {
        body: { query, disambiguate: true },
      }),
      API_TIMEOUT_MS,
      "Request timed out. Please try again."
    );

    if (error) {
      console.error("[API] Disambiguation error:", error.message || error);
      return { isAmbiguous: false, options: [] };
    }

    console.log("[API] Disambiguation result:", data?.isAmbiguous);
    return data || { isAmbiguous: false, options: [] };
  } catch (err: any) {
    console.error("[API] Network error in checkDisambiguation:", err?.message || err);
    return { isAmbiguous: false, options: [] };
  }
};

export const analyzeReputation = async (
  query: string, 
  selectedOption?: DisambiguationOption,
  retryCount = 0
): Promise<AnalyzeResponse> => {
  console.log(`[API] analyzeReputation called for: "${query}" (attempt ${retryCount + 1})`);
  
  // Check if Supabase is ready
  if (!isSupabaseReady()) {
    console.error("[API] Supabase client not ready for analysis");
    return { success: false, error: "Service not ready. Please refresh the page and try again." };
  }
  
  try {
    console.log("[API] Invoking edge function...");
    const { data, error } = await withTimeout(
      supabase.functions.invoke<AnalyzeResponse>("analyze-reputation", {
        body: { query, selectedOption },
      }),
      API_TIMEOUT_MS,
      "Analysis timed out. The servers may be busy - please try again."
    );

    console.log("[API] Response received:", { hasData: !!data, hasError: !!error, errorMsg: error?.message });

    if (error) {
      console.error("[API] Analysis error:", error.message || error);
      
      // Retry on connection/timeout errors
      const isRetryable = error.message?.includes("timed out") || 
                          error.message?.includes("Failed to send") ||
                          error.message?.includes("FunctionsFetchError") ||
                          error.message?.includes("network");
      
      if (isRetryable && retryCount < MAX_RETRIES) {
        console.log(`[API] Retrying analysis (attempt ${retryCount + 2}/${MAX_RETRIES + 1})...`);
        await delay(RETRY_DELAY_MS * (retryCount + 1)); // Exponential backoff
        return analyzeReputation(query, selectedOption, retryCount + 1);
      }
      
      const errorMessage = error.message?.includes("timed out")
        ? "Analysis timed out. The servers may be busy - please try again in a moment."
        : error.message?.includes("Failed to send")
          ? "Network error. Please check your connection and try again."
          : error.message?.includes("Rate limit")
            ? "Too many requests. Please wait a moment and try again."
            : error.message?.includes("504")
              ? "Analysis took too long. Please try again."
              : error.message || "Analysis failed. Please try again.";
      return { success: false, error: errorMessage };
    }

    if (!data) {
      console.error("[API] No data in response");
      return { success: false, error: "No response from analysis service. Please try again." };
    }

    // Handle edge function error responses
    if ((data as any).error) {
      console.error("[API] Edge function returned error:", (data as any).error);
      return { success: false, error: (data as any).error };
    }

    console.log("[API] Analysis successful, score:", data.data?.score);
    return data;
  } catch (err: any) {
    // Handle AbortError specifically - don't retry, just return quietly
    if (err?.name === 'AbortError') {
      console.log("[API] Request aborted");
      return { success: false, error: "Request was cancelled." };
    }
    
    console.error("[API] Network error in analyzeReputation:", err?.message || err);
    
    // Retry on network errors
    if (retryCount < MAX_RETRIES) {
      console.log(`[API] Retrying after network error (attempt ${retryCount + 2}/${MAX_RETRIES + 1})...`);
      await delay(RETRY_DELAY_MS * (retryCount + 1));
      return analyzeReputation(query, selectedOption, retryCount + 1);
    }
    
    const errorMessage = err?.message?.includes("timed out")
      ? "Analysis timed out after multiple attempts. Please try again later."
      : "Connection failed after multiple attempts. Please check your network and try again.";
    return { 
      success: false, 
      error: errorMessage
    };
  }
};
