 import { useState, useEffect } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { X, Sparkles, UserPlus } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 
 interface SignupPromptProps {
   onAuthRequired: () => void;
 }
 
 export const SignupPrompt = ({ onAuthRequired }: SignupPromptProps) => {
   const [isVisible, setIsVisible] = useState(false);
   const [isDismissed, setIsDismissed] = useState(false);
   const [isLoggedIn, setIsLoggedIn] = useState(false);
 
   useEffect(() => {
     // Check if user is logged in
     supabase.auth.getSession().then(({ data: { session } }) => {
       setIsLoggedIn(!!session?.user);
     });
 
     // Show prompt after 3 seconds if not dismissed
     const timer = setTimeout(() => {
       if (!isDismissed) setIsVisible(true);
     }, 3000);
 
     return () => clearTimeout(timer);
   }, [isDismissed]);
 
   // Don't show for logged in users
   if (isLoggedIn || isDismissed) return null;
 
   return (
     <AnimatePresence>
       {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10, x: 10 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-4 z-40 max-w-xs"
          >
            <div className="relative bg-card backdrop-blur-sm border border-primary/20 rounded-xl p-4 shadow-lg shadow-primary/5">
             <button
               onClick={() => setIsDismissed(true)}
               className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
               aria-label="Dismiss"
             >
               <X className="w-3.5 h-3.5" />
             </button>
 
             <div className="flex items-start gap-3 pr-4">
               <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                 <Sparkles className="w-4 h-4" />
               </div>
 
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-medium text-foreground leading-tight">
                   Ready to claim your profile?
                 </p>
                 <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                   Sign up to review, claim & manage your reputation.
                 </p>
 
                 <button
                   onClick={() => {
                     setIsDismissed(true);
                     onAuthRequired();
                   }}
                   className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                 >
                   <UserPlus className="w-3 h-3" />
                   Sign Up Free
                 </button>
               </div>
             </div>
           </div>
         </motion.div>
       )}
     </AnimatePresence>
   );
 };