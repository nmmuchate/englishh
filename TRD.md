# 📋 Technical Requirements Document (TRD)
# English Conversation Practice App - MVP

---

## 📊 Document Overview

**Project Name:** English Conversation Practice App  
**Tech Approach:** Vibe Coding with AI Tools (Claude Code, Cursor, v0.dev)  
**Timeline:** 14 days (6 hours/day = 84 total hours)  
**Builder:** Solo developer using AI assistance  
**Platform:** Mobile-first PWA (Progressive Web App)  
**Primary Framework:** Quasar Framework (Vue 3 + Composition API)  
**Budget:** $20-50/month for API costs, $7.50/month for Firebase  

**Build Philosophy:**
- AI-friendly specifications (exact names, clear structure)
- Free tiers maximized, paid services only when necessary
- Standard patterns over custom solutions
- Mobile-first, works in browser (installable later)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  Quasar PWA (Vue 3) - Mobile Web Browser (Chrome/Edge)     │
│  - Web Speech API (voice input)                             │
│  - IndexedDB (offline transcript cache)                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ HTTPS/WSS
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICES LAYER                    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Firebase   │  │Firebase Cloud│  │   Firebase   │     │
│  │     Auth     │  │  Functions   │  │   Hosting    │     │
│  │  (Google ID) │  │ (Serverless) │  │   (Static)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└──────────────────┬───────────────────────┬──────────────────┘
                   │                       │
                   ▼                       ▼
┌─────────────────────────────┐  ┌─────────────────────────┐
│      DATABASE LAYER         │  │     EXTERNAL APIs       │
│                             │  │                         │
│  Firebase Firestore         │  │  • Gemini Flash API     │
│  • users/                   │  │    (conversations)      │
│  • sessions/                │  │  • MozPayments API      │
│  • vocabulary/              │  │    (subscriptions)      │
│  • leaderboard/             │  │  • Stripe Test Mode     │
│  • subscriptions/           │  │    (dev fallback)       │
└─────────────────────────────┘  └─────────────────────────┘
```

**Data Flow:**
1. User speaks → Web Speech API → Text transcript
2. Text → Firebase Cloud Function → Gemini API → AI response
3. Session data → Firestore → Dashboard updates
4. Payment → MozPayments webhook → Cloud Function → Subscription status update

---

## 🛠️ Technology Stack

| **Component** | **Technology** | **Why This Choice** | **Cost** |
|--------------|----------------|---------------------|----------|
| **Frontend Framework** | Quasar Framework v2.x (Vue 3) | Per your request, excellent PWA support, Material Design built-in | Free |
| **UI Components** | Quasar Built-in Components | Pre-built mobile components (QBtn, QCard, QInput), saves 20+ hours vs custom | Free |
| **State Management** | Pinia (official Vue store) | Quasar default, simpler than Vuex, AI tools know it well | Free |
| **Routing** | Vue Router 4 | Quasar built-in, standard Vue routing | Free |
| **Authentication** | Firebase Auth (Google provider only) | One-click setup, handles tokens/sessions automatically | Free (Spark) |
| **Database** | Firebase Firestore | Real-time sync, offline support, generous free tier (50k reads/day) | $7.50/mo (Blaze) |
| **Backend Functions** | Firebase Cloud Functions (Node.js 18) | Serverless, auto-scales, needed for payment webhooks + cron jobs | Included in $7.50/mo |
| **Voice Recognition** | Web Speech API (browser native) | Zero cost, works in Chrome/Edge, no API key needed | Free |
| **Text Input Fallback** | Quasar QInput component | Keyboard input when voice fails or user prefers typing | Free |
| **AI Conversations** | Google Gemini 1.5 Flash API | Fast (2s response), cheap ($0.075/1M tokens), good conversational quality | ~$25/mo (250 sessions/day) |
| **Payment Gateway (Primary)** | MozPayments API | Required for Mozambique M-Pesa/e-Mola, local payment method | Transaction fees only |
| **Payment Gateway (Dev)** | Stripe Test Mode | For development/testing before MozPayments integration | Free (test mode) |
| **Hosting** | Firebase Hosting | CDN, auto HTTPS, free SSL, 10GB storage + 360MB/day transfer | Included in Blaze |
| **Analytics** | Firebase Analytics | Built-in, tracks user flows, session counts | Free |
| **Error Tracking** | Firebase Crashlytics (web SDK) | Auto crash reports, free tier sufficient | Free |
| **Cron Jobs** | Firebase Cloud Scheduler | Weekly leaderboard reset, old data cleanup | $0.10/mo (3 jobs) |
| **Development Tools** | Vite (Quasar default bundler) | Fast HMR, optimized builds, AI-friendly config | Free |
| **Package Manager** | npm or yarn | Standard, works with all AI coding tools | Free |

**Total Monthly Cost Estimate:**
- 100 users: ~$7.50 (Firebase only)
- 1,000 users: ~$30 (Firebase + Gemini)
- 10,000 users: ~$200 (Firebase $50 + Gemini $150)

---

## 🗄️ Database Schema (Firestore)

### **Collection: `users`**
```
users/{userId}
  ├── email: string (from Google Auth)
  ├── displayName: string (from Google profile)
  ├── photoURL: string (Google profile picture)
  ├── currentLevel: string ("A1" | "A2" | "B1" | "B2" | "C1" | "C2")
  ├── levelProgress: number (0-100, percentage to next level)
  ├── dailyStreak: number (consecutive days with sessions)
  ├── lastSessionDate: timestamp (for streak calculation)
  ├── totalVocabularyWords: number (count of saved words)
  ├── totalHoursPracticed: number (in minutes, divide by 60 for display)
  ├── totalSessionsCompleted: number
  ├── averageScore: number (0-100, rolling average of last 10 sessions)
  ├── onboardingCompleted: boolean
  ├── freeSessionUsed: boolean (true after first session)
  ├── subscriptionStatus: string ("none" | "active" | "expired" | "cancelled")
  ├── subscriptionExpiresAt: timestamp | null
  ├── createdAt: timestamp
  └── updatedAt: timestamp
```

**Indexes Needed:**
- `subscriptionStatus` (for querying active subscribers)
- `lastSessionDate` (for streak calculations)

---

### **Collection: `sessions`**
```
sessions/{sessionId}
  ├── userId: string (reference to users/{userId})
  ├── sessionNumber: number (1, 2, 3... for this user)
  ├── topic: string (AI-assigned topic, e.g., "Discuss your hobbies")
  ├── userLevel: string (level at time of session: "B1", "B2", etc.)
  ├── durationSeconds: number (actual session length, max 600)
  ├── transcript: array of objects
  │   └── [
  │       { speaker: "user", text: string, timestamp: number },
  │       { speaker: "ai", text: string, timestamp: number }
  │     ]
  ├── mistakes: array of objects
  │   └── [
  │       {
  │         type: string ("grammar" | "pronunciation" | "vocabulary"),
  │         original: string (what user said),
  │         correction: string (correct version),
  │         explanation: string (why it's wrong)
  │       }
  │     ]
  ├── newVocabulary: array of objects
  │   └── [
  │       {
  │         word: string,
  │         definition: string,
  │         exampleSentence: string,
  │         savedToBank: boolean (false by default)
  │       }
  │     ]
  ├── scores: object
  │   ├── fluency: number (0-100)
  │   ├── grammar: number (0-100)
  │   ├── vocabulary: number (0-100)
  │   └── overall: number (0-100, weighted average)
  ├── aiModel: string ("gemini-1.5-flash")
  ├── createdAt: timestamp
  └── completedAt: timestamp
```

**Indexes Needed:**
- Composite: `userId` + `createdAt` (DESC) - for user's session history
- `createdAt` (DESC) - for recent sessions query

---

### **Collection: `vocabulary`**
```
vocabulary/{userId}/words/{wordId}
  ├── word: string (lowercase)
  ├── definition: string
  ├── exampleSentence: string
  ├── sourceSessionId: string (where word was first encountered)
  ├── timesEncountered: number (how many sessions had this word)
  ├── savedAt: timestamp
  └── lastReviewedAt: timestamp | null
```

**Subcollection Structure:** Each user has their own words subcollection
**Indexes:** None needed (queries are scoped to userId)

---

### **Collection: `leaderboard`**
```
leaderboard/{weekId}/users/{userId}
  ├── displayName: string
  ├── photoURL: string
  ├── weeklySessionTime: number (total minutes this week)
  ├── weeklySessionCount: number
  ├── currentStreak: number (for display)
  ├── rank: number (1, 2, 3... calculated by Cloud Function)
  └── lastUpdated: timestamp

weekId format: "YYYY-WW" (e.g., "2026-04" for week 4 of 2026)
```

**Indexes Needed:**
- Composite: `weekId` + `weeklySessionTime` (DESC) - for ranking

**How it works:**
- Cloud Function runs every Monday 00:00 UTC
- Creates new week document, copies top 100 users from previous week
- Resets `weeklySessionTime` to 0 for new week

---

### **Collection: `subscriptions`**
```
subscriptions/{userId}
  ├── status: string ("active" | "expired" | "cancelled" | "pending")
  ├── plan: string ("monthly_unlimited") (only one plan in MVP)
  ├── priceId: string (MozPayments price ID)
  ├── paymentProvider: string ("mozpayments" | "stripe_test")
  ├── externalSubscriptionId: string (from MozPayments)
  ├── startedAt: timestamp
  ├── expiresAt: timestamp
  ├── renewsAt: timestamp | null (null if cancelled)
  ├── cancelledAt: timestamp | null
  ├── paymentHistory: array of objects
  │   └── [
  │       {
  │         amount: number (400 for 400 MZN),
  │         currency: string ("MZN"),
  │         paymentMethod: string ("mpesa" | "emola"),
  │         phoneNumber: string (last 4 digits only),
  │         status: string ("success" | "failed"),
  │         paidAt: timestamp,
  │         receiptId: string
  │       }
  │     ]
  └── createdAt: timestamp
```

**Indexes Needed:**
- `status` + `expiresAt` (for finding expired subscriptions to update)

---

### **Collection: `system_config`** (for admin settings)
```
system_config/app_settings
  ├── maintenanceMode: boolean
  ├── minAppVersion: string ("1.0.0")
  ├── subscriptionPriceMZN: number (400)
  ├── freeSessionLimit: number (1)
  ├── maxSessionDuration: number (600 seconds)
  ├── geminiModel: string ("gemini-1.5-flash")
  └── updatedAt: timestamp
```

---

## 🔌 API Design (Firebase Cloud Functions)

### **Function 1: `startConversation`**
- **Trigger:** HTTPS Callable
- **Purpose:** Initialize a new conversation session with AI
- **Input:**
  ```javascript
  {
    userId: string,
    userLevel: string, // "B1", "B2", etc.
    sessionNumber: number
  }
  ```
- **Output:**
  ```javascript
  {
    sessionId: string,
    topic: string, // AI-generated topic
    initialMessage: string, // AI's first message
    systemPrompt: string // For frontend to maintain context
  }
  ```
- **Logic:**
  1. Check user subscription status (if sessionNumber > 1, must be subscribed)
  2. Query Gemini API for topic assignment based on user level
  3. Create session document in Firestore
  4. Return topic + AI's opening question
- **Rate Limit:** 10 requests/minute per user

---

### **Function 2: `sendMessage`**
- **Trigger:** HTTPS Callable
- **Purpose:** Send user message to AI, get response + mistake detection
- **Input:**
  ```javascript
  {
    sessionId: string,
    userMessage: string,
    conversationHistory: array // last 10 messages for context
  }
  ```
- **Output:**
  ```javascript
  {
    aiResponse: string,
    mistakes: array, // grammar/pronunciation errors found
    newVocabulary: array // new words introduced in AI response
  }
  ```
- **Logic:**
  1. Validate session exists and is active
  2. Call Gemini API with:
     - System prompt: "You're an English teacher. Detect mistakes but don't interrupt."
     - User message + history
  3. Parse AI response for mistakes (Gemini outputs structured JSON)
  4. Update session transcript in Firestore
  5. Return AI response + feedback
- **Rate Limit:** 30 requests/minute per user
- **Timeout:** 15 seconds

---

### **Function 3: `endSession`**
- **Trigger:** HTTPS Callable
- **Purpose:** Finalize session, calculate scores, generate feedback
- **Input:**
  ```javascript
  {
    sessionId: string,
    finalTranscript: array // complete conversation
  }
  ```
- **Output:**
  ```javascript
  {
    scores: {
      fluency: number,
      grammar: number,
      vocabulary: number,
      overall: number
    },
    feedback: {
      pronunciationIssues: array,
      grammarMistakes: array,
      vocabularySuggestions: array
    }
  }
  ```
- **Logic:**
  1. Call Gemini API to analyze full transcript
  2. Calculate scores based on:
     - Fluency: Words per minute, pauses, hesitations
     - Grammar: Mistakes / total sentences
     - Vocabulary: Unique words used, complexity
  3. Update user stats (totalHoursPracticed, averageScore, streak)
  4. Check if user should level up (15 sessions + 85% avg score)
  5. Update leaderboard entry for current week
  6. Return detailed feedback
- **Rate Limit:** 5 requests/minute per user

---

### **Function 4: `createSubscription`**
- **Trigger:** HTTPS Callable (from paywall)
- **Purpose:** Initiate MozPayments checkout flow
- **Input:**
  ```javascript
  {
    userId: string,
    phoneNumber: string, // for M-Pesa
    paymentMethod: string // "mpesa" | "emola"
  }
  ```
- **Output:**
  ```javascript
  {
    checkoutUrl: string, // MozPayments hosted page
    subscriptionId: string,
    expiresIn: number // 15 minutes before checkout link expires
  }
  ```
- **Logic:**
  1. Create subscription document with status: "pending"
  2. Call MozPayments API to create checkout session
  3. Return checkout URL for redirect
- **Rate Limit:** 3 requests/minute per user

---

### **Function 5: `handlePaymentWebhook`**
- **Trigger:** HTTPS (webhook from MozPayments)
- **Purpose:** Process payment confirmation, activate subscription
- **Input:** MozPayments webhook payload (signature verified)
  ```javascript
  {
    event: "payment.success" | "payment.failed",
    subscriptionId: string,
    amount: number,
    phoneNumber: string,
    receiptId: string
  }
  ```
- **Output:** `{ received: true }` (200 OK)
- **Logic:**
  1. Verify webhook signature (MozPayments secret key)
  2. Update subscription document:
     - status: "active" (if success) or "expired" (if failed)
     - expiresAt: now + 30 days
     - Add payment to paymentHistory
  3. Update user document:
     - subscriptionStatus: "active"
     - subscriptionExpiresAt: now + 30 days
  4. Send confirmation email (optional, via Firebase Extensions)
- **Rate Limit:** None (external webhook)

---

### **Function 6: `updateWeeklyLeaderboard`**
- **Trigger:** Cloud Scheduler (Cron: every Monday 00:00 UTC)
- **Purpose:** Reset weekly leaderboard, archive previous week
- **Input:** None (scheduled job)
- **Output:** None
- **Logic:**
  1. Query current week's leaderboard (top 100 by weeklySessionTime)
  2. Calculate final ranks
  3. Archive to `leaderboard_archive/{weekId}` collection
  4. Create new week document (weekId: next week)
  5. Copy users from previous week with reset stats
- **Execution Time:** ~30 seconds for 1,000 users

---

### **Function 7: `deleteOldTranscripts`**
- **Trigger:** Cloud Scheduler (Cron: daily 02:00 UTC)
- **Purpose:** Delete session transcripts older than 30 days (privacy)
- **Input:** None
- **Output:** None
- **Logic:**
  1. Query sessions where `createdAt` < (now - 30 days)
  2. Batch delete (500 at a time)
  3. Keep scores/mistakes, only remove transcript field
- **Execution Time:** ~10 seconds per 500 sessions

---

### **Function 8: `checkSubscriptionStatus`** (Dev/Testing Helper)
- **Trigger:** HTTPS Callable
- **Purpose:** Manual check if user subscription is active
- **Input:** `{ userId: string }`
- **Output:**
  ```javascript
  {
    isActive: boolean,
    expiresAt: timestamp | null,
    daysRemaining: number
  }
  ```
- **Rate Limit:** 10 requests/minute per user

---

## 🔒 Security & Rate Limiting

### **Firestore Security Rules**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function hasActiveSubscription() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.subscriptionStatus == 'active';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId);
      allow delete: if false; // Users cannot delete themselves (contact support)
    }
    
    // Sessions collection
    match /sessions/{sessionId} {
      allow read: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid &&
        (request.resource.data.sessionNumber == 1 || hasActiveSubscription());
      allow update: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      allow delete: if false; // Sessions are permanent (except admin deletion)
    }
    
    // Vocabulary subcollection
    match /vocabulary/{userId}/words/{wordId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }
    
    // Leaderboard (read-only for users)
    match /leaderboard/{weekId}/users/{userId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only Cloud Functions can write
    }
    
    // Subscriptions (read-only for users)
    match /subscriptions/{userId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow write: if false; // Only Cloud Functions can write
    }
    
    // System config (public read, no write)
    match /system_config/{doc} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

---

### **Rate Limiting Strategy**

**Client-Side (Quasar Frontend):**
- Debounce voice input: 500ms between sending messages
- Disable "Start Session" button for 5 seconds after clicking (prevent double-clicks)
- Show loading state during API calls

**Cloud Functions:**
| Function | Limit | Window | Action if Exceeded |
|----------|-------|--------|-------------------|
| `startConversation` | 10 requests | 1 minute | Return 429 error |
| `sendMessage` | 30 requests | 1 minute | Return 429 error |
| `endSession` | 5 requests | 1 minute | Return 429 error |
| `createSubscription` | 3 requests | 1 minute | Return 429 error |

**Implementation:** Use Firebase Extensions "Limit repeated requests to HTTPS callable Cloud Functions"

**Gemini API Rate Limits:**
- Free tier: 15 RPM (requests per minute), 1M TPM (tokens per minute)
- Paid tier (required for production): 360 RPM, unlimited tokens
- Handle 429 errors: Retry with exponential backoff (1s, 2s, 4s, 8s)

---

### **Authentication Security**

- Google Sign-In only (no custom passwords to manage)
- Firebase Auth tokens auto-refresh (1 hour expiry)
- No admin users in MVP (use Firebase Console for admin tasks)
- User cannot delete their account via app (prevents accidental data loss)

---

### **Data Privacy**

- Transcripts deleted after 30 days (automated Cloud Function)
- Payment data (phone numbers) stored as last 4 digits only
- No PII in leaderboard (displayName is first name + last initial)
- Firestore data encrypted at rest by default

---

## 🤖 AI Integration (Gemini Flash API)

### **API Details**
- **Service:** Google Gemini API (via AI Studio or Vertex AI)
- **Model:** `gemini-1.5-flash` (fast, cost-effective)
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
- **Authentication:** API Key (stored in Firebase Functions config)
- **Pricing:** $0.075 per 1M input tokens, $0.30 per 1M output tokens

---

### **Conversation System Prompt**

**Stored in:** `system_config/app_settings/conversationPrompts/{level}`

**Example for B1 Level:**
```
You are an encouraging English conversation teacher named Alex. You're having a 5-10 minute spoken conversation with an intermediate (B1) learner. 

RULES:
1. Ask engaging questions about the assigned topic: "{TOPIC}"
2. Respond naturally to their answers like a friend would
3. Adapt your vocabulary to B1 level (avoid idioms, phrasal verbs unless explaining them)
4. If they make a grammar mistake, continue the conversation naturally - DON'T correct them mid-conversation
5. Track mistakes silently and include them in your response metadata
6. Introduce 2-3 new useful words during the conversation
7. Keep responses short (2-3 sentences max) to encourage them to speak more
8. Be warm, patient, and positive

OUTPUT FORMAT (JSON):
{
  "response": "Your conversational reply here",
  "mistakes": [
    {
      "type": "grammar",
      "original": "I goed to the store",
      "correction": "I went to the store",
      "explanation": "Past tense of 'go' is 'went' (irregular verb)"
    }
  ],
  "newVocabulary": [
    {
      "word": "groceries",
      "definition": "Food and household items you buy at a store",
      "example": "I bought groceries for the week."
    }
  ]
}

CONVERSATION HISTORY:
{HISTORY}

USER'S LATEST MESSAGE:
"{USER_MESSAGE}"

Your response (JSON only, no markdown):
```

---

### **Topic Assignment Prompt**

**Triggered by:** `startConversation` function

```
Generate an engaging conversation topic for a {LEVEL} English learner. 

LEVEL GUIDELINES:
- A1-A2 (Beginner): Daily routines, family, hobbies, food, weather
- B1-B2 (Intermediate): Work, travel experiences, opinions on current events, hypothetical scenarios
- C1-C2 (Advanced): Abstract concepts, debates, professional discussions, cultural analysis

SESSION NUMBER: {SESSION_NUMBER}
(Avoid repeating topics from previous 5 sessions)

OUTPUT (JSON):
{
  "topic": "Clear, specific topic statement",
  "openingQuestion": "Friendly first question to start conversation"
}

Example for B1:
{
  "topic": "Discuss your favorite way to spend weekends",
  "openingQuestion": "Hey! So, what do you usually like to do on Saturdays?"
}
```

---

### **Mistake Detection Logic**

Gemini analyzes user input for:
1. **Grammar Errors:**
   - Subject-verb agreement
   - Tense usage
   - Articles (a/an/the)
   - Prepositions
   - Word order

2. **Pronunciation Errors (Simulated):**
   - Common mispronunciations for Portuguese speakers:
     - "schedule" /ʃedjuːl/ vs /skedʒuːl/
     - "th" sounds (think/that)
     - Final consonants (bus vs "buh")
   - Note: Real pronunciation scoring NOT in MVP (Web Speech API doesn't provide phonetic data)
   - Workaround: Gemini guesses likely mispronunciations based on written text + language transfer

3. **Vocabulary Gaps:**
   - Overly simple words (always using "good" instead of "excellent/fantastic")
   - Repetition (saying "very" 10 times)

---

### **API Call Example (Node.js in Cloud Function)**

```javascript
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(functions.config().gemini.apikey);

async function getAIResponse(userMessage, conversationHistory, userLevel) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const systemPrompt = `/* Full prompt from above */`;
  
  const prompt = systemPrompt
    .replace("{TOPIC}", conversationHistory[0].topic)
    .replace("{LEVEL}", userLevel)
    .replace("{HISTORY}", JSON.stringify(conversationHistory))
    .replace("{USER_MESSAGE}", userMessage);
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    const parsedResponse = JSON.parse(text);
    
    return {
      aiResponse: parsedResponse.response,
      mistakes: parsedResponse.mistakes || [],
      newVocabulary: parsedResponse.newVocabulary || []
    };
  } catch (error) {
    // Fallback if Gemini fails
    return {
      aiResponse: "Sorry, I'm having trouble understanding. Could you rephrase that?",
      mistakes: [],
      newVocabulary: []
    };
  }
}
```

---

### **Fallback Strategy**

If Gemini API fails (rate limit, timeout, error):
1. **First retry:** Wait 2 seconds, retry same request
2. **Second retry:** Wait 5 seconds, retry with simplified prompt
3. **Final fallback:** Return generic response:
   - "That's interesting! Tell me more about that."
   - "I see. How did that make you feel?"
   - No mistake detection in fallback mode
4. Log error to Firebase Crashlytics for debugging

---

## 🚀 Deployment Strategy

### **Prerequisites**
1. **Firebase Project Setup:**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize project
   firebase init
   # Select: Hosting, Functions, Firestore
   # Choose existing project or create new one
   ```

2. **Upgrade to Blaze Plan:**
   - Go to Firebase Console → Upgrade
   - Required for Cloud Functions + Firestore beyond free limits
   - Cost: Pay-as-you-go (~$7.50/month for MVP traffic)

3. **Get API Keys:**
   - **Gemini API Key:**
     - Go to https://aistudio.google.com/apikey
     - Create API key
     - Store securely (will add to Functions config)
   
   - **MozPayments API Credentials:**
     - Register at https://mozpayment.co.mz/
     - Get API key from dashboard
     - Get webhook secret for signature verification

4. **Domain Setup (HTTPS required for Web Speech API):**
   - Buy domain (Namecheap, Google Domains): ~$12/year
   - Add to Firebase Hosting:
     ```bash
     firebase hosting:channel:deploy production --only hosting
     ```
   - Configure DNS (A record) - Firebase provides IP
   - SSL auto-configured by Firebase

---

### **Step-by-Step Deployment**

#### **Phase 1: Development Environment (Local)**

**Day 1-10: Build locally, test with emulators**

```bash
# 1. Clone/create Quasar project
npm init quasar
# Choose: Quasar v2, Vite, Composition API, PWA mode

# 2. Install dependencies
cd your-project
npm install firebase pinia @google/generative-ai

# 3. Setup Firebase emulators (for testing without deploying)
firebase init emulators
# Select: Auth, Functions, Firestore, Hosting

# 4. Run local dev server
quasar dev -m pwa

# 5. Run Firebase emulators (separate terminal)
firebase emulators:start

# Frontend: http://localhost:9000
# Firestore UI: http://localhost:4000
# Functions: http://localhost:5001
```

**Environment Variables (`.env.local`):**
```
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_GEMINI_API_KEY=your-gemini-key (only for frontend direct calls if any)
```

**Firebase Functions Config:**
```bash
firebase functions:config:set gemini.apikey="YOUR_GEMINI_KEY"
firebase functions:config:set mozpayments.apikey="YOUR_MOZPAYMENTS_KEY"
firebase functions:config:set mozpayments.webhooksecret="YOUR_WEBHOOK_SECRET"
```

---

#### **Phase 2: Staging Deployment (Testing)**

**Day 11-12: Deploy to Firebase preview channel**

```bash
# 1. Build production bundle
quasar build -m pwa

# 2. Deploy to Firebase preview channel (not live yet)
firebase hosting:channel:deploy staging

# Output: https://your-project--staging-xxxxx.web.app

# 3. Deploy Cloud Functions to test environment
firebase deploy --only functions --project your-project-id

# 4. Test full flow:
# - Sign in with test Google account
# - Complete onboarding session
# - Try payment flow with Stripe test mode
# - Check Firestore data in console
```

**Invite 5 beta testers:**
- Share staging URL
- Ask them to complete full flow (signup → session → payment)
- Track completion in Google Analytics

---

#### **Phase 3: Production Deployment (Live)**

**Day 13-14: Go live**

```bash
# 1. Final production build
quasar build -m pwa

# 2. Deploy to production
firebase deploy --only hosting,functions,firestore

# Output: https://your-project.web.app
# Custom domain: https://yourdomain.com (if configured)

# 3. Verify deployment
firebase hosting:sites:list
```

**Post-Deployment Checklist:**
- ✅ Test Google Sign-In on mobile browser (Chrome/Edge)
- ✅ Complete one full session (voice input)
- ✅ Verify leaderboard updates
- ✅ Test payment flow (real MozPayments transaction)
- ✅ Check Firebase Crashlytics for errors
- ✅ Verify HTTPS (green lock icon in browser)
- ✅ Test PWA install prompt on Android/iOS

---

#### **Phase 4: Monitoring Setup**

```bash
# 1. Enable Firebase Performance Monitoring
firebase init performance

# 2. Setup custom alerts in Firebase Console:
# - Cloud Functions: Execution time > 10s
# - Firestore: Read/write errors > 5/minute
# - Gemini API: 429 rate limit errors

# 3. Setup Google Analytics events tracking:
# - session_started
# - session_completed
# - payment_initiated
# - payment_success
# - level_up
```

---

### **Rollback Strategy**

If production breaks:
```bash
# Rollback to previous Hosting version
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL TARGET_SITE_ID:live

# Rollback Cloud Functions
firebase functions:delete FUNCTION_NAME
firebase deploy --only functions # redeploy previous version
```

---

### **CI/CD (Optional, Post-MVP)**

**GitHub Actions workflow** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to Firebase
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: quasar build -m pwa
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
```

---

## 📊 Performance Requirements

### **Load Time Targets**

| **Page** | **Target (Mobile 4G)** | **How to Achieve** |
|----------|------------------------|-------------------|
| Landing page | < 2 seconds | Optimize images (WebP), lazy load components |
| Dashboard (after login) | < 3 seconds | Preload user data, cache in IndexedDB |
| Session screen | < 1.5 seconds | Keep UI minimal, transcript stream updates |
| Feedback screen | < 2 seconds | Generate during session, not after |

**Tools for Testing:**
- Lighthouse (Chrome DevTools): Aim for 90+ Performance score
- Firebase Performance Monitoring: Track real user metrics

---

### **Real-Time Performance**

| **Metric** | **Target** | **Optimization** |
|-----------|-----------|------------------|
| Voice → Text latency | < 500ms | Web Speech API is instant, no optimization needed |
| Text → AI response | < 3 seconds | Use Gemini Flash (faster than GPT-4), stream responses if possible |
| Firestore write | < 200ms | Batch writes, use offline persistence |
| Transcript scroll | 60 FPS | Use virtual scrolling (Quasar QVirtualScroll) for long transcripts |

---

### **Scalability Targets**

| **User Count** | **Firebase Tier** | **Expected Load** | **Bottleneck** |
|---------------|------------------|-------------------|----------------|
| 100 users | Spark (free) | 50 sessions/day | None |
| 1,000 users | Blaze (~$30/mo) | 250 sessions/day | Gemini API rate limits (upgrade to paid) |
| 10,000 users | Blaze (~$200/mo) | 2,500 sessions/day | Firestore reads (optimize queries, cache) |
| 100,000 users | Blaze (~$2,000/mo) | 25,000 sessions/day | Cloud Functions cold starts (reserve min instances) |

**Auto-Scaling:**
- Cloud Functions: Auto-scales to 1,000 instances (default)
- Firestore: Handles 10,000 writes/second (no manual scaling needed)
- Gemini API: Request quota increase from Google

---

### **Offline Support**

**Required Capabilities:**
1. User can view dashboard while offline (cached data)
2. Cannot start new sessions offline (requires AI)
3. If disconnected mid-session, transcript saves locally, resumes on reconnect

**Implementation:**
- Firestore offline persistence: `enableIndexedDbPersistence()`
- Cache user stats in localStorage
- Service Worker for PWA (Quasar handles automatically)

---

### **Animation Guidelines**

- Page transitions: 250ms ease-in-out
- Button presses: 100ms scale animation (0.95)
- Loading spinners: Use Quasar QSpinner (optimized)
- Confetti on level up: Use lightweight library (canvas-confetti, <5KB)
- No animations if device is low-end (check `navigator.hardwareConcurrency < 4`)

---

## 💰 Cost Estimate

### **Breakdown by Service**

#### **Firebase (Blaze Plan)**

| **Service** | **Free Quota** | **Usage at 1,000 Users** | **Cost** |
|-------------|---------------|-------------------------|----------|
| **Firestore** | 50k reads/day, 20k writes/day | 300k reads/day, 100k writes/day | $6.00/mo |
| **Cloud Functions** | 2M invocations/mo, 400k GB-sec | 8M invocations/mo, 1.5M GB-sec | $1.50/mo |
| **Hosting** | 10GB storage, 360MB/day transfer | 5GB storage, 50GB/mo transfer | Free |
| **Cloud Scheduler** | 3 jobs/mo free | 3 jobs (leaderboard, cleanup) | Free |
| **Auth** | Unlimited | Unlimited | Free |
| **Analytics** | Unlimited | Unlimited | Free |
| **Total Firebase** | - | - | **~$7.50/mo** |

---

#### **Gemini API**

| **User Count** | **Sessions/Day** | **Tokens/Day** | **Monthly Cost** |
|---------------|-----------------|----------------|------------------|
| 100 users | 50 | 100k | Free (1M/mo limit) |
| 1,000 users | 250 | 500k | $11.25 ($0.075/1M input × 15M tokens) |
| 10,000 users | 2,500 | 5M | $112.50 ($0.075/1M × 150M tokens) |

**Calculation:**
- Average session: 20 user messages × 50 tokens = 1,000 input tokens
- 20 AI responses × 100 tokens = 2,000 output tokens
- Total per session: 3,000 tokens (input + output)
- 250 sessions/day × 3,000 = 750k tokens/day = 22.5M tokens/month

**Paid Tier Required:** At ~300 users (need 360 RPM limit)

---

#### **MozPayments**

| **Transaction** | **Fee** | **Monthly Revenue (1,000 Users)** | **Net Revenue** |
|----------------|---------|----------------------------------|-----------------|
| Subscription ($10/mo) | 3.5% + 10 MZN | $10,000 | $9,600 (after fees) |

**Assumption:** 50% conversion rate (500 paid users)

---

#### **Domain & SSL**

- Domain: $12/year (Namecheap .com)
- SSL: Free (Firebase auto-provision)

---

### **Total Monthly Cost Summary**

| **User Tier** | **Firebase** | **Gemini** | **Domain** | **Total** | **Revenue (50% conversion)** | **Profit** |
|--------------|-------------|-----------|-----------|-----------|------------------------------|-----------|
| **100 users** | $7.50 | $0 | $1 | **$8.50** | $500 | **+$491.50** |
| **1,000 users** | $7.50 | $22.50 | $1 | **$31** | $5,000 | **+$4,969** |
| **10,000 users** | $50 | $225 | $1 | **$276** | $50,000 | **+$49,724** |

**Break-Even Point:** ~10 paid users (covers infrastructure)

---

### **Cost Optimization Tips**

1. **Cache Firestore reads:**
   - Store user stats in localStorage, refresh every 5 minutes
   - Saves ~40% on read operations

2. **Limit Gemini tokens:**
   - Truncate conversation history to last 10 messages
   - Reduce system prompt verbosity (saves 20% tokens)

3. **Batch Cloud Functions:**
   - Instead of updating leaderboard every session, batch updates every 10 minutes
   - Reduces function invocations by 80%

4. **Use Firestore TTL (Time-To-Live):**
   - Auto-delete old transcripts (instead of daily cron job)
   - Saves on function execution costs

---

## 📋 Development Checklist (Day-by-Day)

### **Week 1: Core Foundation**

#### **Day 1: Project Setup & Authentication**
- [ ] Initialize Quasar project (PWA mode)
- [ ] Install dependencies: `firebase`, `pinia`, `@google/generative-ai`
- [ ] Setup Firebase project (create in console)
- [ ] Initialize Firebase SDK in Quasar (`src/boot/firebase.js`)
- [ ] Create `.env.local` with API keys
- [ ] Implement Google Sign-In button (landing page)
- [ ] Test login flow (create test Google account)
- [ ] Create basic routing structure (pages: Landing, Dashboard, Session, Feedback)
- [ ] Deploy to Firebase preview channel for testing

**AI Coding Prompt for Day 1:**
```
Create a Quasar v2 PWA project with:
1. Firebase Auth (Google Sign-In only)
2. Vue Router setup with 4 pages: Landing, Dashboard, Session, Feedback
3. Pinia store for user state (userId, email, displayName, currentLevel)
4. Landing page with centered "Sign in with Google" button (Quasar QBtn)
5. After login, redirect to /dashboard
6. Use Quasar's default Material Design theme

File structure:
- src/boot/firebase.js (Firebase initialization)
- src/stores/user.js (Pinia user store)
- src/pages/Landing.vue
- src/pages/Dashboard.vue
- src/pages/Session.vue
- src/pages/Feedback.vue
- src/router/routes.js (route guards for authentication)

Include environment variable handling for Firebase config.
```

---

#### **Day 2: Onboarding Flow**
- [ ] Create onboarding pages (3-step wizard)
- [ ] Build quick assessment form (3 radio button questions)
- [ ] Implement level assignment logic (mock AI response for now)
- [ ] Store user profile in Firestore `users/{userId}`
- [ ] Create welcome screen with progress indicators
- [ ] Test full onboarding flow (new user → dashboard)

**AI Coding Prompt:**
```
Create a 3-step onboarding wizard in Quasar:

Step 1 (Assessment.vue):
- Question 1: "How comfortable are you speaking English?" (Beginner/Intermediate/Advanced radio buttons)
- Question 2: "What's your main goal?" (Career/Travel/Personal Growth)
- Question 3: "How much time can you practice daily?" (5min/15min/30min)
- "Next" button (Quasar QBtn primary)

Step 2 (FirstSession.vue):
- Show: "Let's have your first 5-minute conversation!"
- Big "Start Conversation" button
- Mock conversation: display hardcoded transcript for testing
- After 10 seconds, auto-redirect to Step 3

Step 3 (LevelResult.vue):
- Display: "You're B1 Intermediate! 🎉"
- Show progress bar (0% to next level)
- "Go to Dashboard" button

Firestore write:
- After Step 3, save to users/{userId}:
  {
    currentLevel: "B1",
    levelProgress: 0,
    dailyStreak: 1,
    onboardingCompleted: true,
    createdAt: serverTimestamp()
  }

Use Quasar QStepper component for wizard navigation.
```

---

#### **Day 3-4: Conversation Engine (Voice Input)**
- [ ] Integrate Web Speech API (SpeechRecognition)
- [ ] Create voice input button (mic icon, shows recording state)
- [ ] Display real-time transcript as user speaks
- [ ] Add text input fallback (keyboard if voice fails)
- [ ] Create session timer (countdown from 10:00)
- [ ] Test voice recognition in Chrome on mobile device

**AI Coding Prompt:**
```
Create a Session.vue page with:

1. Header:
   - Timer: "05:32" (countdown from 10:00, format MM:SS)
   - Mistake counter: "3 mistakes" (top-right corner)
   - "End Session" button (Quasar QBtn flat)

2. Transcript Display:
   - Scrollable chat-like interface (Quasar QChatMessage)
   - Messages alternate: user (right, blue) vs AI (left, gray)
   - Mistakes highlighted with red underline in user messages
   - Auto-scroll to bottom when new message added

3. Voice Input:
   - Large circular microphone button (center-bottom)
   - States:
     - Idle: Gray mic icon
     - Recording: Pulsing red mic icon + "Listening..."
     - Processing: Spinner
   - On click: Start Web Speech API (SpeechRecognition)
   - On voice detected: Display text in real-time
   - On silence (2 seconds): Auto-send to AI

4. Text Input Fallback:
   - Show text input field below mic if voice fails
   - "Send" button (Quasar QBtn)

Web Speech API setup:
- Language: 'en-US'
- Continuous: false (stop after each utterance)
- InterimResults: true (show while speaking)

State management (Pinia):
- transcript: array of { speaker: 'user'|'ai', text: string, timestamp: number }
- mistakeCount: number
- isRecording: boolean
- timeRemaining: number (in seconds)

Timer logic:
- Start at 600 seconds (10 min)
- Decrement every second
- Auto-end session when reaches 0
```

---

#### **Day 5-6: AI Integration (Gemini API)**
- [ ] Setup Firebase Cloud Functions project (`functions/` directory)
- [ ] Create `startConversation` function (returns topic + first AI message)
- [ ] Create `sendMessage` function (sends user text, gets AI response)
- [ ] Integrate Gemini API in Cloud Function
- [ ] Test AI conversation flow (10 back-and-forth messages)
- [ ] Implement mistake detection (grammar errors highlighted)
- [ ] Handle API errors gracefully (show fallback message)

**AI Coding Prompt:**
```
Create Firebase Cloud Function: sendMessage

Input (HTTPS Callable):
{
  sessionId: string,
  userMessage: string,
  conversationHistory: array (last 10 messages)
}

Logic:
1. Call Gemini API (gemini-1.5-flash) with this prompt:

"You are an English teacher. The user said: '{userMessage}'

Respond naturally like a friend, then output JSON:
{
  "response": "Your conversational reply",
  "mistakes": [
    {
      "type": "grammar",
      "original": "I goed",
      "correction": "I went",
      "explanation": "Irregular past tense"
    }
  ]
}

Conversation history: {conversationHistory}"

2. Parse Gemini's JSON response
3. Update Firestore sessions/{sessionId}:
   - Append to transcript array
   - Increment mistake count if mistakes found
4. Return { aiResponse, mistakes }

Error handling:
- If Gemini API fails, return generic response: "That's interesting! Tell me more."
- Log error to Firebase Crashlytics

Dependencies:
- @google/generative-ai
- firebase-admin (for Firestore)

Rate limiting:
- Max 30 calls/minute per user (use Firebase Extensions)
```

---

#### **Day 7: Session End & Scoring**
- [ ] Create `endSession` Cloud Function (calculates scores)
- [ ] Build feedback dashboard (3 tabs: Pronunciation, Grammar, Vocabulary)
- [ ] Implement score calculation algorithm (fluency, grammar, vocab)
- [ ] Update user stats in Firestore (totalHoursPracticed, averageScore)
- [ ] Test complete session flow (start → 5 min → end → view feedback)

**AI Coding Prompt:**
```
Create Feedback.vue page (shown after session ends):

Layout:
- Header: Overall score circle (0-100, large font 48px)
- Score breakdown:
  - Fluency: 75/100 (progress bar, green)
  - Grammar: 60/100 (progress bar, orange)
  - Vocabulary: 80/100 (progress bar, green)

Tabs (Quasar QTabs):
1. Pronunciation Tab:
   - List of mispronounced words (simulated for MVP)
   - Example: "schedule" → You said: /sked-jool/ Correct: /shed-yool/
   - Audio play button (use Web Speech Synthesis for TTS)

2. Grammar Tab:
   - List of mistakes from session
   - Format: "I goed to store" → "I went to the store"
   - Explanation: "Past tense of 'go' is irregular"

3. Vocabulary Tab:
   - New words AI introduced
   - Word + Definition + Example sentence
   - "Add to My Vocabulary" button (Quasar QBtn outline)

Bottom action:
- "Back to Dashboard" button

Firestore read:
- Get data from sessions/{sessionId}
- Display scores, mistakes, newVocabulary arrays

Pinia action:
- saveVocabularyWord(word) → writes to vocabulary/{userId}/words/{wordId}
```

---

### **Week 2: Monetization, Progress, Polish**

#### **Day 8-9: Dashboard & Progress Tracking**
- [ ] Build dashboard layout (stats cards, streak counter)
- [ ] Create streak calculation logic (check lastSessionDate)
- [ ] Display weekly chart (bar graph of sessions per day)
- [ ] Implement vocabulary bank (user's saved words list)
- [ ] Add "Start Session" floating action button
- [ ] Test streak increments correctly (complete session today, tomorrow)

**AI Coding Prompt:**
```
Create Dashboard.vue with:

Header:
- User profile pic (from Google) + "Welcome back, {firstName}!"

Stats Cards (Quasar QCard, grid layout 2 columns):
1. Streak Card:
   - Fire emoji 🔥 (large, 64px)
   - Number: "5 days" (bold, 32px)
   - Subtitle: "Keep it going!"

2. Vocabulary Card:
   - Book emoji 📚
   - Number: "47 words"
   - Subtitle: "learned so far"

3. Hours Card:
   - Clock emoji ⏱️
   - Number: "2h 13min"
   - Subtitle: "total practice"

4. Level Card:
   - Progress bar (B1 → B2)
   - "You're 40% to B2!"

Weekly Chart (use chart.js or Quasar QLinearProgress):
- X-axis: Mon, Tue, Wed, Thu, Fri, Sat, Sun
- Y-axis: Number of sessions (0-5)
- Data: sessionsThisWeek array from Firestore

Leaderboard Preview:
- "Top 3 This Week" section
- Show: Rank, Name, Session Time
- "View Full Leaderboard" link

Floating Action Button (FAB):
- Bottom-right corner
- Green circle, mic icon
- Text: "Start Session"
- On click: Navigate to /session

Firestore queries:
- Get user stats from users/{userId}
- Get sessions from last 7 days: sessions where userId == currentUser AND createdAt > (now - 7 days)
```

---

#### **Day 10-11: Leaderboard**
- [ ] Create leaderboard page (top 10 users)
- [ ] Implement weekly ranking query (Firestore composite index)
- [ ] Add user's own rank at bottom (if not in top 10)
- [ ] Create Cloud Function `updateWeeklyLeaderboard` (cron job)
- [ ] Test leaderboard resets on Monday

**AI Coding Prompt:**
```
Create Leaderboard.vue page:

Header:
- Title: "Top Learners This Week 🏆"
- Subtitle: "Week of Jan 20-26"
- User's rank badge: "You're #15" (if not in top 10)

List (Quasar QList):
- Top 3 with medal icons: 🥇 🥈 🥉
- Ranks 4-10: number only
- Each row shows:
  - Rank
  - Avatar (profile pic)
  - Name (first name + last initial, e.g., "John D.")
  - Session time (e.g., "3h 45min")
  - Streak (fire emoji + number)

User's Own Row (sticky at bottom):
- Highlighted background (light blue)
- Same format as above
- Always visible (even if user scrolls)

Firestore query:
- Collection: leaderboard/{currentWeekId}/users
- Order by: weeklySessionTime DESC
- Limit: 10

Cloud Function (updateWeeklyLeaderboard):
- Trigger: Cloud Scheduler (Cron: "0 0 * * 1" = every Monday midnight UTC)
- Logic:
  1. Get current week's top 100 users
  2. Calculate ranks (1, 2, 3...)
  3. Create new week document (weekId: "2026-05")
  4. Copy users with reset stats (weeklySessionTime: 0)
```

---

#### **Day 12: Payment Integration (MozPayments)**
- [ ] Create paywall modal (triggers after session 1)
- [ ] Build subscription page (pricing, CTA)
- [ ] Implement `createSubscription` Cloud Function
- [ ] Integrate MozPayments checkout flow
- [ ] Create `handlePaymentWebhook` function (verify signature)
- [ ] Test payment flow with test account
- [ ] Update user `subscriptionStatus` on success

**AI Coding Prompt:**
```
Create PaywallModal.vue component:

Display trigger:
- Show modal when user clicks "Start Session" AND freeSessionUsed == true AND subscriptionStatus != "active"

Modal content (Quasar QDialog):
- Title: "Continue Learning with Premium 🚀"
- Features list:
  - ✓ Unlimited conversations
  - ✓ Advanced feedback
  - ✓ Weekly progress reports
  - ✓ Leaderboard access
- Pricing: "400 MZN/month ($10 USD)"
- "Subscribe Now" button (Quasar QBtn primary, large)
- "Not now" link (close modal)

On click "Subscribe Now":
1. Call Cloud Function: createSubscription({ userId, paymentMethod: 'mpesa' })
2. Receive: { checkoutUrl }
3. Redirect to checkoutUrl (opens MozPayments hosted page)

MozPayments Integration (Cloud Function):
- API endpoint: POST https://api.mozpayment.co.mz/v1/checkout
- Headers: { Authorization: "Bearer {API_KEY}" }
- Body:
  {
    amount: 400,
    currency: "MZN",
    description: "English Practice - Monthly Subscription",
    return_url: "https://yourapp.com/payment-success",
    webhook_url: "https://yourapp.com/api/payment-webhook"
  }
- Response: { checkout_url }

Webhook Handler (handlePaymentWebhook):
- Verify signature (HMAC-SHA256 with webhook secret)
- Parse payload: { event: "payment.success", subscription_id, amount }
- Update Firestore:
  - subscriptions/{userId}: { status: "active", expiresAt: now + 30 days }
  - users/{userId}: { subscriptionStatus: "active" }
- Return 200 OK

Fallback for testing (Stripe Test Mode):
- Use Stripe Checkout if MozPayments unavailable
- Test card: 4242 4242 4242 4242
```

---

#### **Day 13: UI Polish & Responsiveness**
- [ ] Test app on mobile devices (iOS Safari, Android Chrome)
- [ ] Fix layout issues on small screens (<375px width)
- [ ] Optimize images (convert to WebP, lazy load)
- [ ] Add loading skeletons (Quasar QSkeleton)
- [ ] Implement error states (no internet, API failure)
- [ ] Add success animations (confetti on level up)
- [ ] Test PWA install prompt (Add to Home Screen)

**AI Coding Prompt:**
```
Add mobile responsiveness fixes:

1. Dashboard.vue:
   - Stats cards: 2 columns on mobile, 4 columns on tablet+
   - Use Quasar's responsive classes: col-6 (mobile), col-md-3 (tablet+)

2. Session.vue:
   - Transcript: max-height 60vh, overflow-y scroll
   - Voice button: 72px diameter on mobile, 96px on tablet

3. Feedback.vue:
   - Tabs: horizontal scroll on mobile if text overflows
   - Progress bars: full-width on mobile

4. Loading States:
   - Add QSkeleton for dashboard stats while loading
   - Show QSpinner in session while AI responds

5. Error Handling:
   - No internet: Show QBanner "You're offline. Reconnect to continue."
   - API error: Fallback message + "Try again" button
   - Payment failed: Show error dialog with retry option

6. Animations:
   - Level up: Use canvas-confetti library (import from CDN)
   - Trigger: After endSession, if newLevel > oldLevel
   - Duration: 3 seconds

7. PWA Manifest (quasar.config.js):
   - App name: "English Practice"
   - Short name: "EngPractice"
   - Icons: 192x192, 512x512 (generate from logo)
   - Background color: #FFFFFF
   - Theme color: #4CAF50
```

---

#### **Day 14: Deployment & Testing**
- [ ] Run Lighthouse audit (aim for 90+ score)
- [ ] Fix performance issues (code splitting, tree shaking)
- [ ] Setup Firebase Crashlytics (error tracking)
- [ ] Configure Google Analytics events
- [ ] Deploy to production (Firebase Hosting)
- [ ] Test live app on 3 devices (iOS, Android, Desktop)
- [ ] Create privacy policy page (required for Google Auth)
- [ ] Create terms of service page
- [ ] Invite 5 beta testers, gather feedback

**Final Deployment Steps:**
```bash
# 1. Build optimized bundle
quasar build -m pwa

# 2. Deploy to Firebase
firebase deploy --only hosting,functions,firestore

# 3. Setup custom domain (if ready)
firebase hosting:sites:list
firebase target:apply hosting production your-site-name

# 4. Verify deployment
# - Test Google Sign-In
# - Complete full session
# - Make test payment
# - Check Firestore data
# - Verify leaderboard

# 5. Setup monitoring
firebase init performance
firebase init crashlytics

# 6. Create Privacy Policy (use generator):
# https://www.privacypolicygenerator.info/
# Add page: /privacy-policy

# 7. Invite beta testers:
# Share URL + Google Form for feedback
```

---

## 🎯 Technical Success Criteria

### **Functional Completeness**
✅ MVP is complete when ALL of these work:

1. **Authentication:**
   - [ ] User can sign in with Google
   - [ ] User profile created in Firestore
   - [ ] Session persists across page refreshes

2. **Onboarding:**
   - [ ] New user completes 3-step assessment
   - [ ] First conversation session works (voice OR text)
   - [ ] User assigned initial level (B1, B2, etc.)

3. **Conversation Sessions:**
   - [ ] Voice input works in Chrome/Edge (mobile + desktop)
   - [ ] Text input fallback works if voice fails
   - [ ] Transcript displays in real-time
   - [ ] Mistakes highlighted (red underline) without interrupting
   - [ ] Session timer counts down from 10:00
   - [ ] Session auto-ends at 10:00 OR user clicks "End Session"

4. **AI Responses:**
   - [ ] Gemini API returns conversational responses (<3 seconds)
   - [ ] Mistakes detected and logged correctly
   - [ ] New vocabulary words identified

5. **Feedback:**
   - [ ] Post-session scores displayed (fluency, grammar, vocab)
   - [ ] 3 tabs work (Pronunciation, Grammar, Vocabulary)
   - [ ] User can save words to vocabulary bank

6. **Progress Tracking:**
   - [ ] Daily streak increments correctly
   - [ ] Total hours calculated accurately
   - [ ] Weekly chart shows correct session counts
   - [ ] Level progress bar updates

7. **Leaderboard:**
   - [ ] Top 10 users displayed
   - [ ] User's own rank visible (if not in top 10)
   - [ ] Leaderboard resets every Monday (Cloud Scheduler)

8. **Payment:**
   - [ ] Paywall appears after free session
   - [ ] MozPayments checkout flow completes
   - [ ] Webhook updates subscription status
   - [ ] Paid user can start unlimited sessions

9. **Mobile Experience:**
   - [ ] App works on iOS Safari (iPhone 12+)
   - [ ] App works on Android Chrome (Samsung/Pixel)
   - [ ] PWA install prompt appears
   - [ ] App is usable without horizontal scrolling

10. **Error Handling:**
    - [ ] No crashes during 10 consecutive sessions
    - [ ] Graceful degradation if Gemini API fails
    - [ ] Offline state detected and user notified

---

### **Performance Benchmarks**
✅ All must pass:

| **Metric** | **Target** | **How to Test** |
|-----------|-----------|----------------|
| Lighthouse Performance Score | 90+ | Chrome DevTools → Lighthouse |
| First Contentful Paint (FCP) | < 1.5s | Lighthouse report |
| Time to Interactive (TTI) | < 3s | Lighthouse report |
| Voice → Transcript latency | < 500ms | Manual testing (stopwatch) |
| AI response time | < 3s | Firebase Performance Monitoring |
| Session completion rate | 80%+ | Google Analytics (custom event) |
| Payment success rate | 95%+ | Track in Firestore (successfulPayments / totalAttempts) |

---

### **Quality Assurance**
✅ Beta testing checklist (5 testers):

- [ ] All 5 testers complete signup → session → payment flow
- [ ] Zero critical bugs reported (crashes, payment failures)
- [ ] Average session satisfaction: 4/5 stars or higher
- [ ] At least 3 testers use app for 3+ consecutive days (streak test)
- [ ] Leaderboard correctly ranks all testers

---

### **Security & Compliance**
✅ Legal requirements:

- [ ] Privacy Policy page published (includes data retention policy)
- [ ] Terms of Service page published (subscription terms, refunds)
- [ ] Google Auth consent screen approved (if using custom domain)
- [ ] Firestore security rules deployed (users can only read/write own data)
- [ ] Cloud Functions authenticated (require valid Firebase Auth token)
- [ ] Payment webhook signature verified (prevent spoofing)

---

### **Operational Readiness**
✅ Post-launch monitoring:

- [ ] Firebase Crashlytics configured (catches errors)
- [ ] Google Analytics tracking key events:
  - `session_started`
  - `session_completed`
  - `payment_initiated`
  - `payment_success`
  - `level_up`
- [ ] Cost alerts set (Firebase > $50/month, Gemini > $30/month)
- [ ] Error rate alert (Cloud Functions > 5% failure rate)

---

## 🚨 Known Limitations & Workarounds

### **1. Web Speech API Browser Support**
**Issue:** Only works in Chrome/Edge, not Safari/Firefox  
**Workaround:**  
- Show browser compatibility notice on landing page
- Auto-enable text input fallback on unsupported browsers
- Recommend Chrome for best experience

---

### **2. Pronunciation Scoring (Not Real)**
**Issue:** Web Speech API doesn't provide phonetic analysis  
**Workaround:**  
- Gemini guesses likely mispronunciations based on text + language transfer patterns
- Label as "Possible pronunciation issues" (not definitive)
- Post-MVP: Consider integrating Speechmatics or Azure Speech for real scoring

---

### **3. MozPayments Testing**
**Issue:** Might not have sandbox/test environment  
**Workaround:**  
- Use Stripe Test Mode during development
- Switch to MozPayments only for production
- Test with small real payments (10 MZN) before full launch

---

### **4. Offline Sessions**
**Issue:** Cannot start sessions without internet (AI required)  
**Workaround:**  
- Show clear error: "Internet required for conversations"
- Allow offline viewing of past session feedback
- Post-MVP: Pre-download AI responses for common topics

---

### **5. Gemini API Rate Limits**
**Issue:** Free tier caps at 15 RPM, might hit limits at 300+ users  
**Workaround:**  
- Implement queue system (hold requests if rate limited)
- Show user: "High demand, please wait 30 seconds"
- Upgrade to paid tier ($20/mo) before hitting limits
