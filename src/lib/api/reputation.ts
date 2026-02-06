import { supabase } from "@/integrations/supabase/client";

// Timeout for API calls (45 seconds - balance between completion and user experience)
const API_TIMEOUT_MS = 45000;

// Simple request queue to prevent parallel requests overwhelming the backend
let pendingRequest: Promise<any> | null = null;
let lastRequestTime = 0;
const MIN_REQUEST_GAP_MS = 1000; // Minimum 1 second between requests

// Helper to add timeout to fetch operations
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
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

// Helper to throttle requests and prevent overwhelming the API
async function throttledRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  // Wait for any pending request to complete first
  if (pendingRequest) {
    try {
      await pendingRequest;
    } catch {
      // Ignore errors from previous request
    }
  }
  
  // Ensure minimum gap between requests
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_GAP_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_GAP_MS - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  pendingRequest = requestFn();
  
  try {
    const result = await pendingRequest;
    return result;
  } finally {
    pendingRequest = null;
  }
}

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
  funFact?: string;
  hardFact?: string;
  metadata?: Record<string, any>;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: ReputationResult;
  error?: string;
  limitInfo?: {
    message: string;
    isAuthenticated: boolean;
    limit: number;
  };
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
  try {
    console.log("Starting disambiguation for:", query);
    const startTime = Date.now();
    
    const result = await throttledRequest(async () => {
      const { data, error } = await withTimeout(
        supabase.functions.invoke<DisambiguationResponse>("analyze-reputation", {
          body: { query, disambiguate: true },
        }),
        API_TIMEOUT_MS,
        "Request timed out. Please try again."
      );
      
      if (error) {
        console.error("Disambiguation error:", error.message || error);
        return { isAmbiguous: false, options: [] };
      }
      
      return data || { isAmbiguous: false, options: [] };
    });

    console.log(`Disambiguation completed in ${Date.now() - startTime}ms`);
    return result;
  } catch (err: any) {
    // Handle network errors gracefully - don't block the flow
    console.error("Network error in checkDisambiguation:", err?.message || err);
    return { isAmbiguous: false, options: [] };
  }
};

export const analyzeReputation = async (
  query: string, 
  selectedOption?: DisambiguationOption
): Promise<AnalyzeResponse> => {
  try {
    console.log("Starting reputation analysis for:", query);
    const startTime = Date.now();
    
    const result = await throttledRequest(async () => {
      const { data, error } = await withTimeout(
        supabase.functions.invoke<AnalyzeResponse>("analyze-reputation", {
          body: { query, selectedOption },
        }),
        API_TIMEOUT_MS,
        "Analysis timed out. The servers may be busy - please try again."
      );

      console.log(`Analysis completed in ${Date.now() - startTime}ms`);

      if (error) {
        console.error("Analysis error:", error.message || error);
        
        // Check for rate limit errors (429 status or specific messages)
        const isRateLimitError = 
          error.message?.includes("SEARCH_LIMIT_REACHED") ||
          error.message?.includes("Rate limit") ||
          error.message?.includes("429") ||
          error.message?.includes("Too many requests") ||
          error.message?.includes("retry_after");
        
        if (isRateLimitError) {
          return { 
            success: false, 
            error: "SEARCH_LIMIT_REACHED" 
          };
        }
        
        const errorMessage = error.message?.includes("timed out")
          ? "Analysis timed out. Please try again."
          : error.message?.includes("Failed to send") || error.message?.includes("Failed to fetch")
            ? "SEARCH_LIMIT_REACHED"
            : error.message || "Analysis failed. Please try again.";
        return { success: false, error: errorMessage };
      }

      if (!data) {
        return { success: false, error: "No response from analysis service. Please try again." };
      }

      // Handle edge function error responses
      if ((data as any).error === "SEARCH_LIMIT_REACHED") {
        return { 
          success: false, 
          error: "SEARCH_LIMIT_REACHED",
          limitInfo: {
            message: (data as any).message,
            isAuthenticated: (data as any).isAuthenticated,
            limit: (data as any).limit,
          }
        };
      }
      
      if ((data as any).error) {
        return { success: false, error: (data as any).error };
      }

      return data;
    });

    return result;
  } catch (err: any) {
    console.error("Network error in analyzeReputation:", err?.message || err);
    const errorMessage = err?.message?.includes("timed out")
      ? "Analysis timed out. Please try again."
      : "Network error. Please check your connection and try again.";
    return { 
      success: false, 
      error: errorMessage
    };
  }
};
