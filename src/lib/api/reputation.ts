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
}

export interface AnalyzeResponse {
  success: boolean;
  data?: ReputationResult;
  error?: string;
}

export const analyzeReputation = async (query: string): Promise<AnalyzeResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke<AnalyzeResponse>("analyze-reputation", {
      body: { query },
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
