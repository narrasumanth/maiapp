import { ReactNode } from "react";
import { 
  User, MapPin, Film, Music, Building, ShoppingBag, Utensils, 
  Plane, Book, Gamepad2, Tv, Briefcase, GraduationCap, Heart,
  Star, Globe, Phone, Mail, Calendar, Award
} from "lucide-react";

export type EntityCategory = 
  | "Person" 
  | "Movie" 
  | "Restaurant" 
  | "Place" 
  | "Product" 
  | "Business" 
  | "Song" 
  | "Show"
  | "Game"
  | "Book"
  | "Service";

interface CategoryConfig {
  icon: typeof User;
  color: string;
  bgGradient: string;
  fields: string[];
  platforms: string[];
}

export const categoryConfigs: Record<string, CategoryConfig> = {
  Person: {
    icon: User,
    color: "text-blue-400",
    bgGradient: "from-blue-500/20 to-purple-500/20",
    fields: ["occupation", "location", "known_for", "contact"],
    platforms: ["linkedin", "twitter", "instagram", "website"],
  },
  Movie: {
    icon: Film,
    color: "text-amber-400",
    bgGradient: "from-amber-500/20 to-red-500/20",
    fields: ["release_year", "director", "genre", "runtime", "rating"],
    platforms: ["imdb", "rottentomatoes", "letterboxd"],
  },
  Restaurant: {
    icon: Utensils,
    color: "text-orange-400",
    bgGradient: "from-orange-500/20 to-red-500/20",
    fields: ["cuisine", "price_range", "hours", "location", "phone"],
    platforms: ["yelp", "google", "tripadvisor", "opentable"],
  },
  Place: {
    icon: MapPin,
    color: "text-green-400",
    bgGradient: "from-green-500/20 to-teal-500/20",
    fields: ["type", "location", "hours", "admission"],
    platforms: ["google", "tripadvisor", "foursquare"],
  },
  Product: {
    icon: ShoppingBag,
    color: "text-pink-400",
    bgGradient: "from-pink-500/20 to-purple-500/20",
    fields: ["brand", "category", "price", "availability"],
    platforms: ["amazon", "website"],
  },
  Business: {
    icon: Building,
    color: "text-cyan-400",
    bgGradient: "from-cyan-500/20 to-blue-500/20",
    fields: ["industry", "founded", "headquarters", "employees"],
    platforms: ["linkedin", "website", "glassdoor", "crunchbase"],
  },
  Song: {
    icon: Music,
    color: "text-emerald-400",
    bgGradient: "from-emerald-500/20 to-green-500/20",
    fields: ["artist", "album", "release_year", "genre"],
    platforms: ["spotify", "apple_music", "youtube"],
  },
  Show: {
    icon: Tv,
    color: "text-violet-400",
    bgGradient: "from-violet-500/20 to-purple-500/20",
    fields: ["network", "seasons", "genre", "status"],
    platforms: ["imdb", "rottentomatoes", "tvtime"],
  },
  Game: {
    icon: Gamepad2,
    color: "text-red-400",
    bgGradient: "from-red-500/20 to-orange-500/20",
    fields: ["developer", "platform", "genre", "release_year"],
    platforms: ["steam", "metacritic", "ign"],
  },
  Book: {
    icon: Book,
    color: "text-yellow-400",
    bgGradient: "from-yellow-500/20 to-amber-500/20",
    fields: ["author", "genre", "published", "pages"],
    platforms: ["goodreads", "amazon"],
  },
  Service: {
    icon: Briefcase,
    color: "text-indigo-400",
    bgGradient: "from-indigo-500/20 to-blue-500/20",
    fields: ["type", "pricing", "availability"],
    platforms: ["website", "trustpilot"],
  },
};

export const getCategoryConfig = (category: string): CategoryConfig => {
  return categoryConfigs[category] || categoryConfigs["Product"];
};

interface CategoryHeaderProps {
  category: string;
  name: string;
  isVerified: boolean;
  children?: ReactNode;
}

export const CategoryHeader = ({ category, name, isVerified, children }: CategoryHeaderProps) => {
  const config = getCategoryConfig(category);
  const Icon = config.icon;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${config.bgGradient} p-6 md:p-8`}>
      <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
        <Icon className="w-full h-full" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-5 h-5 ${config.color}`} />
          <span className={`text-sm font-medium ${config.color}`}>{category}</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold mb-2">{name}</h1>
        {children}
      </div>
    </div>
  );
};

// Platform icons mapping
export const platformIcons: Record<string, typeof Globe> = {
  website: Globe,
  linkedin: Briefcase,
  twitter: Globe,
  instagram: Globe,
  facebook: Globe,
  youtube: Tv,
  imdb: Film,
  rottentomatoes: Film,
  yelp: Star,
  google: Globe,
  tripadvisor: Plane,
  spotify: Music,
  apple_music: Music,
  steam: Gamepad2,
  goodreads: Book,
  amazon: ShoppingBag,
  custom: Globe,
};
