import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AboutSection } from "@/components/result/AboutSection";
import { CommentsSection } from "@/components/result/CommentsSection";
import { FeedbackSection } from "@/components/result/FeedbackSection";
import { AskMAITab } from "@/components/result/AskMAITab";
import { MessageModal } from "@/components/result/MessageModal";
import { Info, MessageCircle, MessageSquare, Bot, Send } from "lucide-react";

interface SocialLink {
  platform: string;
  url: string;
}

interface ProfileTabsProps {
  entityId: string;
  entityName: string;
  category: string;
  about?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  location?: string;
  socialLinks?: SocialLink[];
  isOwner: boolean;
  isClaimed: boolean;
  onAuthRequired: () => void;
}

export const ProfileTabs = ({
  entityId,
  entityName,
  category,
  about,
  contactEmail,
  contactPhone,
  websiteUrl,
  location,
  socialLinks,
  isOwner,
  isClaimed,
  onAuthRequired,
}: ProfileTabsProps) => {
  const [showMessageModal, setShowMessageModal] = useState(false);

  return (
    <>
      <Tabs defaultValue="about" className="w-full">
        <TabsList className={`w-full grid ${isClaimed && entityId ? 'grid-cols-5' : 'grid-cols-4'} bg-secondary/30 p-1 rounded-xl`}>
          <TabsTrigger 
            value="about" 
            className="flex items-center gap-1.5 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">About</span>
          </TabsTrigger>
          <TabsTrigger 
            value="comments"
            className="flex items-center gap-1.5 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Comments</span>
          </TabsTrigger>
          <TabsTrigger 
            value="feedback"
            className="flex items-center gap-1.5 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Feedback</span>
          </TabsTrigger>
          <TabsTrigger 
            value="askmai"
            className="flex items-center gap-1.5 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">Ask MAI</span>
          </TabsTrigger>
          {isClaimed && entityId && (
            <TabsTrigger 
              value="message"
              className="flex items-center gap-1.5 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Message</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="about" className="mt-4">
          <AboutSection
            entityId={entityId}
            entityName={entityName}
            category={category}
            about={about}
            contactEmail={contactEmail}
            contactPhone={contactPhone}
            websiteUrl={websiteUrl}
            location={location}
            socialLinks={socialLinks}
            isOwner={isOwner}
            onAuthRequired={onAuthRequired}
          />
        </TabsContent>

        <TabsContent value="comments" className="mt-4">
          <CommentsSection
            entityId={entityId}
            onAuthRequired={onAuthRequired}
          />
        </TabsContent>

        <TabsContent value="feedback" className="mt-4">
          <FeedbackSection
            entityId={entityId}
            onAuthRequired={onAuthRequired}
          />
        </TabsContent>

        <TabsContent value="askmai" className="mt-4">
          <div className="glass-card p-5">
            <AskMAITab
              entityId={entityId}
              entityName={entityName}
              entityCategory={category}
            />
          </div>
        </TabsContent>

        {isClaimed && entityId && (
          <TabsContent value="message" className="mt-4">
            <div className="glass-card p-5">
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Send a Message</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Want to contact {entityName} directly? Send them a private message.
                </p>
                <button
                  onClick={() => setShowMessageModal(true)}
                  className="btn-neon px-6 py-3"
                >
                  Compose Message
                </button>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {entityId && (
        <MessageModal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          entityId={entityId}
          entityName={entityName}
          onAuthRequired={onAuthRequired}
        />
      )}
    </>
  );
};
