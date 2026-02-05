import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 
 const LookupPage = () => {
   const { code } = useParams<{ code: string }>();
   const navigate = useNavigate();
   const [error, setError] = useState<string | null>(null);
 
   useEffect(() => {
     if (!code) {
       navigate("/");
       return;
     }
 
     const lookupEntity = async () => {
       try {
         // The share code is the first 12 chars of the entity ID (uppercased)
        // Or it could be a URL-encoded entity name
         const normalizedCode = code.toLowerCase();
         
        // First try to find by ID prefix
        let { data: entities, error: queryError } = await supabase
           .from("entities")
           .select(`
             id,
             name,
             category,
             is_verified,
             claimed_by,
             about,
             contact_email,
             website_url
           `)
           .ilike("id", `${normalizedCode}%`)
           .limit(1);
 
         if (queryError) throw queryError;
 
        // If not found by ID, try to find by normalized name
        if (!entities || entities.length === 0) {
          const nameSearch = decodeURIComponent(normalizedCode).replace(/-/g, ' ');
          const { data: nameResults, error: nameError } = await supabase
            .from("entities")
            .select(`
              id,
              name,
              category,
              is_verified,
              claimed_by,
              about,
              contact_email,
              website_url
            `)
            .ilike("normalized_name", `%${nameSearch}%`)
            .limit(1);
            
          if (!nameError && nameResults && nameResults.length > 0) {
            entities = nameResults;
          }
        }

         if (!entities || entities.length === 0) {
           setError("Profile not found. The link may be invalid or expired.");
           return;
         }
 
         const entity = entities[0];
 
         // Fetch the entity score
         const { data: scoreData } = await supabase
           .from("entity_scores")
           .select("score, summary, vibe_check, evidence")
           .eq("entity_id", entity.id)
           .single();
 
         if (!scoreData) {
           setError("Score data not found for this profile.");
           return;
         }
 
         // Build the result object to match ReputationResult interface
         const result = {
           name: entity.name,
           score: scoreData.score,
           category: entity.category,
           summary: scoreData.summary || "",
           vibeCheck: scoreData.vibe_check || "Profile data loaded from shared link.",
           evidence: scoreData.evidence || [],
         };
 
         // Store in sessionStorage and redirect to result page
         sessionStorage.setItem("mai-result", JSON.stringify(result));
         sessionStorage.setItem("mai-entity-id", entity.id);
         
         navigate(`/result?q=${encodeURIComponent(entity.name)}`);
       } catch (err) {
         console.error("Lookup error:", err);
         setError("Failed to load profile. Please try again.");
       }
     };
 
     lookupEntity();
   }, [code, navigate]);
 
   if (error) {
     return (
       <div className="min-h-screen flex items-center justify-center px-4">
         <div className="text-center max-w-md">
           <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-score-red/20 flex items-center justify-center">
             <span className="text-2xl">🔗</span>
           </div>
           <h1 className="text-2xl font-bold mb-2">Link Not Found</h1>
           <p className="text-muted-foreground mb-6">{error}</p>
           <button
             onClick={() => navigate("/")}
             className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
           >
             Go to Home
           </button>
         </div>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen flex items-center justify-center">
       <div className="text-center">
         <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
         <p className="text-muted-foreground">Loading shared profile...</p>
       </div>
     </div>
   );
 };
 
 export default LookupPage;