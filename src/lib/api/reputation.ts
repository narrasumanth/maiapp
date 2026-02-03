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
      console.error("Error checking disambiguation:", error);
      return { isAmbiguous: false, options: [] };
    }

    return data || { isAmbiguous: false, options: [] };
  } catch (err) {
    console.error("Error in checkDisambiguation:", err);
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
      console.error("Error analyzing reputation:", error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "No response from analysis service" };
    }

    return data;
  } catch (err) {
    console.error("Error in analyzeReputation:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Unknown error" 
    };
  }
};
