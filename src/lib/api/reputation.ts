import { supabase } from "@/integrations/supabase/client";

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
  try {
    const { data, error } = await supabase.functions.invoke<DisambiguationResponse>("analyze-reputation", {
      body: { query, disambiguate: true },
    });

    if (error) {
      console.error("Disambiguation error:", error.message || error);
      // Don't throw - just return non-ambiguous fallback
      return { isAmbiguous: false, options: [] };
    }

    return data || { isAmbiguous: false, options: [] };
  } catch (err: any) {
    // Handle network errors gracefully
    console.error("Network error in checkDisambiguation:", err?.message || err);
    return { isAmbiguous: false, options: [] };
  }
};

export const analyzeReputation = async (
  query: string, 
  selectedOption?: DisambiguationOption
): Promise<AnalyzeResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke<AnalyzeResponse>("analyze-reputation", {
      body: { query, selectedOption },
    });

    if (error) {
      console.error("Analysis error:", error.message || error);
      const errorMessage = error.message?.includes("Failed to send")
        ? "Network error. Please check your connection and try again."
        : error.message || "Analysis failed. Please try again.";
      return { success: false, error: errorMessage };
    }

    if (!data) {
      return { success: false, error: "No response from analysis service. Please try again." };
    }

    // Handle edge function error responses
    if ((data as any).error) {
      return { success: false, error: (data as any).error };
    }

    return data;
  } catch (err: any) {
    console.error("Network error in analyzeReputation:", err?.message || err);
    return { 
      success: false, 
      error: "Network error. Please check your connection and try again." 
    };
  }
};
