# MAI Protocol Whitepaper
## A Credit Score for the Internet

**Version 1.0** | February 2026

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Solution Overview](#solution-overview)
4. [Core Features](#core-features)
5. [Technical Architecture](#technical-architecture)
6. [Reputation Scoring System](#reputation-scoring-system)
7. [Gamification & Incentives](#gamification--incentives)
8. [Security Framework](#security-framework)
9. [Privacy & Data Control](#privacy--data-control)
10. [API & Monetization](#api--monetization)
11. [Governance & Dispute Resolution](#governance--dispute-resolution)
12. [Roadmap](#roadmap)

---

## Executive Summary

MAI Protocol is a decentralized reputation verification platform that provides universal trust scores (0-100) for any entity on the internet—people, businesses, products, places, or organizations. Think of it as a "Credit Score for the Internet."

By aggregating real-time data from verified web sources (Google, Reddit, news outlets, social platforms) and applying AI-powered analysis, MAI Protocol creates transparent, evidence-based trust assessments that help users make informed decisions in an increasingly complex digital landscape.

### Key Metrics
- **Score Range**: 0-100 trust score
- **Categories**: 11 entity types (Person, Business, Product, Place, Service, Organization, Website, App, Crypto, Event, Other)
- **Data Sources**: Google Search, Reddit, News outlets, Social media platforms
- **Update Frequency**: Real-time analysis with 30-day decay mechanism

---

## Problem Statement

### The Trust Crisis
In today's digital economy, trust is the most valuable yet scarce commodity:

1. **Information Asymmetry**: Consumers lack reliable ways to verify the reputation of people, businesses, and products before engaging
2. **Fake Reviews**: 30%+ of online reviews are fabricated, manipulated, or incentivized
3. **Fragmented Data**: Reputation signals are scattered across hundreds of platforms with no unified view
4. **Identity Fraud**: Bad actors exploit the lack of verification to impersonate or misrepresent entities
5. **No Accountability**: There's no persistent, portable reputation that follows entities across platforms

### Current Solutions Fall Short
- **Platform-specific ratings** (Yelp, TrustPilot) are siloed and easily gamed
- **Background checks** are expensive, slow, and limited in scope
- **Social proof** is manipulable and lacks quantitative rigor
- **Word of mouth** doesn't scale in global digital markets

---

## Solution Overview

MAI Protocol addresses these challenges through:

### 1. Universal Trust Scores
A single, standardized 0-100 score that works across all entity types:
- **75-100**: High Trust (Green) - Verified positive reputation
- **50-74**: Moderate Trust (Yellow) - Mixed or limited data
- **0-49**: Low Trust (Red) - Concerning signals or negative history

### 2. Evidence-Based Analysis
Every score is backed by verifiable evidence cards sourced from:
- Search engine results and rankings
- Social media sentiment and engagement
- News coverage and press mentions
- Review platforms and ratings
- Community discussions (Reddit, forums)
- Official registrations and certifications

### 3. AI-Powered Insights
Our proprietary MAI (Modular AI Intelligence) system provides:
- **Vibe Check**: Colloquial one-line summary using Gen-Z language
- **Key Evidence**: Categorized proof points with source links
- **Interactive Q&A**: Natural language queries about any entity

### 4. Community Governance
Decentralized moderation through:
- Public voting on disputes
- Reputation tiers for voters
- Point-based incentive alignment

---

## Core Features

### 🔍 Search & Discovery

#### Entity Search
Users can search for any entity by name, with intelligent disambiguation when multiple matches exist. The system presents the top 5 candidates with descriptions, allowing users to select the correct one.

#### Category-Specific Icons
Each entity type has distinctive visual identification:
- 👤 Person
- 🏢 Business
- 📦 Product
- 📍 Place
- ⚡ Service
- 🏛️ Organization
- 🌐 Website
- 📱 App
- ₿ Crypto
- 📅 Event

#### Random Discovery (Roulette)
"Feeling Lucky" feature that surfaces random entities for exploration, encouraging serendipitous discovery.

---

### 📊 Reputation Analysis

#### Score Generation
Scores are calculated using a weighted algorithm:

| Factor | Weight | Description |
|--------|--------|-------------|
| Web Presence | 25% | Search rankings, official sites, verified profiles |
| Social Sentiment | 20% | Aggregated sentiment from social platforms |
| Review Analysis | 20% | Ratings from major review platforms |
| News Coverage | 15% | Press mentions and media sentiment |
| Community Signals | 10% | Reddit, forums, community discussions |
| Official Records | 10% | Business registrations, certifications |

#### Evidence Cards
Each score includes categorized evidence:
- **Positive**: Green-highlighted proof of trustworthiness
- **Neutral**: Gray informational data points
- **Negative**: Red-flagged concerning signals

#### Vibe Check
AI-generated one-liner using contemporary language:
> "This restaurant is giving main character energy with those Michelin vibes 🍽️"

---

### 👤 User Dashboard

#### Profile Management
- View personal trust score
- Track disputes won/lost
- Monitor voting accuracy
- Manage claimed entities

#### Claimed Profiles
Entity owners can claim their profiles through:
1. **Domain Verification**: Add TXT record to domain DNS
2. **Social Proof**: Verify through linked social accounts
3. **Manual Review**: Submit documentation for admin approval

#### Traffic Analytics
Profile owners see:
- Unique visits (30-day rolling)
- Visitor demographics (anonymized)
- Search query sources
- Engagement metrics

#### Notifications
Real-time alerts for:
- Score changes on followed entities
- New reviews on claimed profiles
- Dispute outcomes
- Voting results

---

### 💬 Social Features

#### Comments
- Threaded discussions on entity pages
- Rate-limited to prevent spam
- Bot protection via honeypot fields

#### Reviews (Yay/Nay)
- Binary voting system for simplicity
- 24-hour cooldown between votes
- Optional text explanation
- GPS-verified reviews carry +10 bonus points

#### Following
- Track entities of interest
- Receive score change notifications
- Build personalized watchlists

#### Direct Messaging
- Contact verified profile owners
- Secure inbox within platform
- Read receipts for transparency

---

### 🤝 Verification System

#### Mutual Verification
Profile owners can verify connections through:
1. Entity A generates 6-digit verification code
2. Entity B enters code on their profile
3. Bidirectional "verified connection" badge appears
4. Both parties gain trust score boost

#### Verification Badges
- ✓ Claimed Profile
- ✓ Email Verified
- ✓ Social Verified
- ✓ Domain Verified
- ✓ Peer Verified

---

### 📤 Sharing

#### Share Modal
- One-click sharing to Twitter, Facebook, LinkedIn, WhatsApp
- Auto-generated viral captions per platform
- Visual score cards for social preview

#### QR Codes
- Unique QR code per entity
- Scannable for instant profile access
- Downloadable for offline use

#### Share Codes
- 8-character unique identifier per entity
- URL format: `mai.protocol/e/ABC12345`
- Easy verbal sharing

#### Private Links
- Time-limited access tokens
- Configurable detail levels (basic/detailed/full)
- Usage tracking and expiration

---

## Technical Architecture

### Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React + Vite)                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Tailwind  │  │   Framer    │  │   TanStack Query    │  │
│  │     CSS     │  │   Motion    │  │   (Data Fetching)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Lovable Cloud (Backend)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Supabase   │  │    Edge     │  │      Supabase       │  │
│  │  Database   │  │  Functions  │  │   Authentication    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Firecrawl  │  │   Gemini    │  │   Lovable AI        │  │
│  │ (Scraping)  │  │  (Analysis) │  │   (MAI Chatbot)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

#### Core Tables

| Table | Purpose |
|-------|---------|
| `entities` | All searchable entities with metadata |
| `entity_scores` | Trust scores with evidence JSON |
| `profiles` | User accounts and reputation |
| `user_roles` | Admin/moderator permissions |

#### Interaction Tables

| Table | Purpose |
|-------|---------|
| `entity_reviews` | Yay/Nay votes with optional content |
| `entity_comments` | Threaded discussions |
| `entity_reactions` | Quick emoji reactions |
| `entity_follows` | User watchlists |
| `entity_visits` | Traffic analytics |

#### Trust & Verification

| Table | Purpose |
|-------|---------|
| `profile_claims` | Ownership claim requests |
| `profile_verifications` | Mutual verification records |
| `disputes` | Dispute filings and votes |
| `dispute_votes` | Public voting on disputes |

#### Security & API

| Table | Purpose |
|-------|---------|
| `rate_limits` | Request throttling |
| `blocked_ips` | Spam prevention |
| `honeypot_logs` | Bot detection logs |
| `api_keys` | Developer API access |
| `api_usage_logs` | Usage analytics |

### Edge Functions

| Function | Purpose |
|----------|---------|
| `analyze-reputation` | Generate scores via Firecrawl + Gemini |
| `ask-mai` | AI chatbot for entity Q&A |
| `score-decay` | Apply 5% decay after 30 days inactivity |
| `public-api` | RESTful API for third parties |

---

## Reputation Scoring System

### Score Calculation Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Search    │────▶│  Firecrawl  │────▶│   Gemini    │
│   Query     │     │  Web Scrape │     │   Analysis  │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                    ┌─────────────────────────────────────┐
                    │          Score Components           │
                    │  ┌─────────┐  ┌─────────┐          │
                    │  │  Score  │  │  Vibe   │          │
                    │  │  0-100  │  │  Check  │          │
                    │  └─────────┘  └─────────┘          │
                    │  ┌─────────────────────────────┐   │
                    │  │    Evidence Cards (JSON)    │   │
                    │  │  [{type, title, source}]    │   │
                    │  └─────────────────────────────┘   │
                    └─────────────────────────────────────┘
```

### Score Methodology Display

Each result page includes a "Score Methodology" tab showing:
- Weighted breakdown by data source
- Number of sources analyzed
- Last update timestamp
- Confidence interval

### Score Decay Mechanism

To ensure scores reflect current reality:
- Scores decay 5% after 30 days without new reviews
- Decay is capped at 50% of original score
- Any new review resets the decay timer
- Re-analysis updates score with fresh data

### Score Caching (Cost Defense)

To prevent expensive re-scraping on popular entities:
- Results cached with 24-48 hour TTL
- Cache served instantly ("stale-while-revalidate")
- Background refresh for active entities
- Hit count tracked for analytics

### Score History Timeline

Full transparency on score changes:
- All score changes recorded with timestamps
- Change amounts (+/-) displayed
- Reasons for changes logged
- Real-time updates via WebSocket

### Community Influence

User actions affect scores:
| Action | Score Impact |
|--------|--------------|
| Positive review | +0.5 to entity score |
| Negative review | -0.5 to entity score |
| GPS-verified review | 1.5x weight |
| High-reputation voter | 2x weight |

### Stake-to-Vote (Anti-Sybil)

To prevent bot voting and Sybil attacks:
- Users must stake 10 points to vote
- If community majority agrees, stake returned + 5 bonus
- If community majority disagrees, stake forfeited
- Creates economic disincentive for manipulation

### Velocity Lock (Review Bomb Protection)

To prevent coordinated attacks:
- If score changes >20% in 1 hour, entity is locked
- 2-hour "cooling off" period prevents new votes
- Protects businesses from viral mob attacks
- Admin can manually unlock if needed

---

## Gamification & Incentives

### Points System

Users earn points for constructive participation:

| Action | Points |
|--------|--------|
| First search | +5 |
| Submit review | +10 |
| GPS-verified review | +20 |
| Vote on dispute | +5 |
| Correct dispute vote | +10 |
| Incorrect dispute vote | -5 |
| Win dispute (as filer) | +50 |
| Lose dispute (as filer) | -25 |
| Claim profile | +25 |
| Verify mutual connection | +15 |
| Follow entity | +2 |

### Reputation Tiers

Users progress through tiers based on voting accuracy:

| Tier | Requirements | Benefits |
|------|--------------|----------|
| **Newcomer** | 0 votes | Basic access |
| **Member** | 5+ votes | Comment on disputes |
| **Contributor** | 20+ correct, 60%+ accuracy | Vote weight 1.25x |
| **Trusted** | 50+ correct, 70%+ accuracy | Vote weight 1.5x |
| **Expert** | 100+ correct, 80%+ accuracy | Vote weight 2x, Moderator nominations |

### Leaderboards

- Weekly top voters
- Monthly top contributors
- All-time accuracy rankings
- Category-specific leaders

---

## Security Framework

### Multi-Layer Protection

#### 1. Authentication
- **Magic Link (Passwordless)**: OTP-based email authentication
- No passwords to leak or phish
- Session management via Supabase Auth

#### 2. Bot Protection
- **Honeypot Fields**: Hidden form fields that catch automated submissions
- **Rate Limiting**: Request throttling per action type
- **IP Blocking**: Temporary and permanent bans for abuse

#### 3. Row-Level Security (RLS)
All database tables implement RLS policies:
```sql
-- Example: Users can only view their own data
CREATE POLICY "Users can view own data"
ON profiles FOR SELECT
USING (auth.uid() = user_id);
```

#### 4. Role-Based Access Control
```
User < Moderator < Admin
  │        │         │
  │        │         └── Full system access
  │        └── Dispute resolution, content moderation
  └── Standard features
```

### API Security

- **Hashed API Keys**: Keys are hashed before storage (only prefix visible)
- **Rate Limits**: Configurable per-key request limits
- **Scope Permissions**: Read-only, write, admin scopes
- **Usage Logging**: All requests logged for audit

### Data Validation

- Server-side validation on all inputs
- Character limits on text fields
- URL validation for evidence links
- SQL injection prevention via parameterized queries

---

## Privacy & Data Control

### Privacy Levels

Entity owners can set visibility:

| Level | Description |
|-------|-------------|
| **Public** | Full profile visible to everyone |
| **Limited** | Basic info public, details require login |
| **Private** | Visible only via private share links |

### Hidden Fields

Owners can hide specific fields:
- Contact email
- Social links
- Detailed about section
- Evidence cards

### Private Sharing

Generate access-controlled links with:
- **Access Levels**: Basic, Detailed, Full
- **Expiration**: 1 hour to 30 days
- **Use Limits**: Single-use or unlimited
- **Revocation**: Instant link deactivation

### Data Deletion

Users can request:
- Comment deletion
- Review removal
- Profile unclaiming
- Account deletion (GDPR compliant)

---

## API & Monetization

### Public API

RESTful API for third-party integrations:

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/score/:query` | Get entity score by name |
| GET | `/api/entity/:id` | Get entity details by ID |
| GET | `/api/search?q=` | Search entities |
| GET | `/api/verify/:token` | Validate private share link |

#### Authentication

```bash
curl -H "Authorization: Bearer mai_xxxx" \
  https://api.mai.protocol/v1/score/apple
```

#### Response Format

```json
{
  "entity": {
    "id": "uuid",
    "name": "Apple Inc.",
    "category": "business",
    "score": 87,
    "vibe_check": "Tech giant with that trillion-dollar energy 🍎",
    "evidence_count": 24
  },
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-02-03T12:00:00Z"
  }
}
```

### Pricing Tiers (Planned)

| Tier | Requests/Month | Price |
|------|----------------|-------|
| **Free** | 100 | $0 |
| **Starter** | 10,000 | $49/mo |
| **Growth** | 100,000 | $199/mo |
| **Enterprise** | Unlimited | Custom |

### Use Cases

1. **E-commerce**: Display trust scores on seller profiles
2. **Dating Apps**: Verify user reputation before matching
3. **Hiring**: Quick background reputation checks
4. **Marketplaces**: Buyer/seller trust indicators
5. **News**: Embed source credibility scores

### Embeddable Trust Badge Widget

High-scoring entities can embed a live trust badge on their website:

```html
<!-- MAI Trust Badge -->
<div id="mai-trust-badge" data-token="your_token"></div>
<script src="https://mai.protocol/widget.js" async></script>
```

Features:
- Live score updates
- Customizable theme (dark/light)
- Multiple sizes (small/medium/large)
- Domain restrictions for security
- Impression tracking analytics

### Legal Disclaimers (FCRA Compliance)

To prevent legal liability, all scores include:
- Explicit statement that scores are "AI-generated opinions"
- FCRA disclaimer: Cannot be used for hiring, housing, or credit
- Terms of Service acceptance required for voting
- Clear attribution to public data sources

---

## Governance & Dispute Resolution

### Dispute Filing

Any user can file a dispute for:
- **Inaccurate Score**: Score doesn't reflect reality
- **False Review**: Review contains false information
- **Incorrect Info**: Entity details are wrong
- **Impersonation**: Someone is impersonating entity
- **Other**: Issues not covered above

### Evidence Requirements

Disputers must provide:
- Clear title (200 char max)
- Detailed description (2000 char max)
- Up to 5 evidence URLs

### Public Voting

Disputes are resolved through community voting:

1. **Voting Period**: 7 days from filing
2. **Minimum Votes**: 10 votes required for resolution
3. **Threshold**: >60% majority determines outcome
4. **Weighted Votes**: Higher-tier users have more influence

### Resolution Outcomes

| Outcome | Effect on Disputer | Effect on Voters |
|---------|-------------------|------------------|
| **Win** | +50 points, dispute_won +1 | Correct: +10 pts, Incorrect: -5 pts |
| **Lose** | -25 points, dispute_lost +1 | Correct: +10 pts, Incorrect: -5 pts |

### Admin Override

Administrators can:
- Expedite urgent disputes
- Override community decisions (with justification)
- Issue permanent bans for abuse
- Adjust point awards/penalties

---

## Roadmap

### Phase 1: Foundation ✅ (Complete)

- [x] Entity search and scoring
- [x] AI-powered analysis (Firecrawl + Gemini)
- [x] User authentication (Magic Link)
- [x] Reviews and comments
- [x] Profile claiming
- [x] Basic sharing

### Phase 2: Trust Layer ✅ (Complete)

- [x] Mutual verification system
- [x] Score decay mechanism
- [x] Privacy controls
- [x] Private sharing links
- [x] Notification system
- [x] User dashboard

### Phase 3: Security & Governance ✅ (Complete)

- [x] Bot protection (honeypot)
- [x] Rate limiting
- [x] IP blocking
- [x] Dispute resolution system
- [x] Public voting
- [x] Reputation tiers
- [x] Admin dashboard

### Phase 4: Monetization & Scaling ✅ (Complete)

- [x] Public API infrastructure
- [x] API key management
- [x] Usage analytics
- [x] **Score caching layer (24-48hr TTL)** - Cost defense
- [x] **Stake-to-vote system** - Anti-Sybil attack protection
- [x] **Velocity lock system** - Review bomb protection
- [x] **Embeddable trust badge widgets** - Partner integration
- [x] **Score history timeline** - Transparency
- [x] **PWA manifest** - Mobile installability
- [x] **FCRA disclaimers** - Legal liability shield
- [ ] Stripe payment integration
- [ ] Subscription tiers
- [ ] Enterprise features

### Phase 5: Scale (Planned)

- [ ] Mobile apps (iOS/Android)
- [x] Browser extension widget (JavaScript embed)
- [x] Embeddable widgets (live trust badges)
- [ ] Real-time score updates (WebSocket)
- [ ] Multi-language support
- [ ] Regional data centers
- [ ] Pre-seeding top 10,000 entities

### Phase 6: Ecosystem (Future)

- [ ] Verified badge API for partners
- [ ] Score portability protocol
- [ ] Decentralized governance token
- [ ] DAO structure for major decisions
- [ ] Open-source core components
- [ ] Phone verification for voting (SMS)
- [ ] GPS-weighted voting (5x power for location-verified)

---

## Appendix

### A. Design System: Omni-Glass

The platform uses a distinctive dark-mode aesthetic:

- **Background**: Deep navy gradient `hsl(230 25% 9%)`
- **Cards**: Frosted glassmorphism with subtle borders
- **Accents**: Neon blue-to-purple gradients
- **Score Colors**: 
  - Green (75-100): `#22c55e`
  - Yellow (50-74): `#eab308`
  - Red (0-49): `#ef4444`

### B. Entity Categories

| Category | Icon | Description |
|----------|------|-------------|
| Person | 👤 | Individuals, public figures |
| Business | 🏢 | Companies, corporations |
| Product | 📦 | Physical or digital products |
| Place | 📍 | Locations, venues, destinations |
| Service | ⚡ | Service providers, freelancers |
| Organization | 🏛️ | Non-profits, institutions |
| Website | 🌐 | Web properties, domains |
| App | 📱 | Mobile or desktop applications |
| Crypto | ₿ | Cryptocurrencies, tokens, projects |
| Event | 📅 | Conferences, concerts, gatherings |
| Other | ⭐ | Miscellaneous entities |

### C. Contact

- **Website**: mai.protocol
- **Support**: support@mai.protocol
- **API Docs**: developers.mai.protocol
- **Status**: status.mai.protocol

---

*© 2026 MAI Protocol. All rights reserved.*

*This whitepaper is for informational purposes only and does not constitute financial advice, investment recommendations, or an offer to sell securities.*
