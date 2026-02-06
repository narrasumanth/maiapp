import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AboutSection } from "@/components/result/AboutSection";
import { CommentsSection } from "@/components/result/CommentsSection";
import { FeedbackSection } from "@/components/result/FeedbackSection";
import { AskMAITab } from "@/components/result/AskMAITab";
import { Info, MessageCircle, MessageSquare, Bot } from "lucide-react";

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
  onAuthRequired,
}: ProfileTabsProps) => {
  return (
    <Tabs defaultValue="about" className="w-full">
      <TabsList className="w-full grid grid-cols-4 bg-secondary/30 p-1 rounded-xl">
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
    </Tabs>
  );
};
