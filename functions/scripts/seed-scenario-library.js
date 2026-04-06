// Seed script for scenarioLibrary Firestore collection.
// Idempotent: checks if each document exists before writing.
// Prerequisite: Set GOOGLE_APPLICATION_CREDENTIALS env var to service account JSON path,
//   OR run `firebase login` for Application Default Credentials.
// Usage: node functions/scripts/seed-scenario-library.js
// Dry run: node functions/scripts/seed-scenario-library.js --dry-run

const admin = require('firebase-admin')

if (!admin.apps.length) admin.initializeApp()
const db = admin.firestore()

const scenarios = [
  // ── ENGINEERING ──────────────────────────────────────────────────────────
  {
    id: 'engineering-scenario-b1',
    title: 'Explaining a Production Outage to Your Manager',
    type: 'scenario',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'vocabulary'],
    grammarFocus: ['past_simple', 'modal_verbs'],
    relevantFields: ['Engineering'],
    relevantInterests: ['Technology'],
    systemPrompt: 'You are {{userName}}\'s manager at a software company. A critical production system went down this morning and {{userName}} is a software engineer who needs to explain what happened, what caused it, and what the fix was. Ask clarifying questions about the root cause and timeline. Adapt your language to a B1 English level — use clear, direct sentences and avoid complex idioms.',
    aiRole: 'Engineering manager at a software company',
    userRole: 'A software engineer explaining a production outage',
    objectives: [
      'Use past simple tense to describe the sequence of events',
      'Practise technical vocabulary related to software systems',
      'Explain cause and effect using "because", "so", "as a result"',
      'Respond confidently to follow-up questions'
    ],
    successCriteria: 'User clearly explains what happened, why it happened, and how it was fixed using appropriate past tense and causal language.'
  },
  {
    id: 'engineering-freetalk-b1',
    title: 'Talking About Your Engineering Project',
    type: 'freeTalk',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'fluency'],
    grammarFocus: ['present_simple', 'present_continuous'],
    relevantFields: ['Engineering'],
    relevantInterests: ['Technology'],
    systemPrompt: 'You are a friendly colleague having a casual conversation with {{userName}}, an engineer. Ask them about their current project, what challenges they are facing, and what technologies they are using. Keep the conversation natural and encouraging. Use simple, clear language appropriate for a B1 level speaker.',
    aiRole: 'A friendly colleague in the engineering team',
    userRole: 'An engineer describing their current project',
    objectives: [
      'Describe ongoing work using present continuous',
      'Use technical vocabulary naturally in conversation',
      'Express opinions and preferences',
      'Ask and answer questions about work'
    ],
    successCriteria: 'User maintains a natural conversation about their work for at least 5 exchanges, using present tense forms correctly.'
  },
  {
    id: 'engineering-storybuilder-b2',
    title: 'The Lost Engineer in Tokyo',
    type: 'storyBuilder',
    targetLevel: 'B2',
    targetSkills: ['speaking', 'narrative', 'vocabulary'],
    grammarFocus: ['past_perfect', 'narrative_tenses'],
    relevantFields: ['Engineering'],
    relevantInterests: ['Travel'],
    systemPrompt: 'You and {{userName}} are building a story together about a software engineer who gets lost in Tokyo during a work conference. You start the story and then take turns adding sentences. Encourage {{userName}} to use descriptive language and narrative tenses. If they make errors, gently model the correct form in your next turn. The story should be engaging and imaginative.',
    aiRole: 'Co-storyteller and language coach',
    userRole: 'A co-author building an adventure story',
    objectives: [
      'Use past perfect to establish background events',
      'Practise narrative tenses (past simple, past continuous, past perfect)',
      'Build vocabulary for describing locations and emotions',
      'Develop story coherence with linking words'
    ],
    successCriteria: 'User contributes at least 5 story turns using varied narrative tenses and descriptive vocabulary.'
  },
  {
    id: 'engineering-debate-b2',
    title: 'Should Engineers Always Work Remotely?',
    type: 'debate',
    targetLevel: 'B2',
    targetSkills: ['speaking', 'argumentation', 'vocabulary'],
    grammarFocus: ['conditionals', 'modal_verbs', 'passive_voice'],
    relevantFields: ['Engineering'],
    relevantInterests: ['Technology'],
    systemPrompt: 'You are debating with {{userName}} about whether software engineers should always have the option to work remotely. Take the opposing position to {{userName}} — if they argue for remote work, you argue for office work, and vice versa. Use logical arguments, statistics, and real-world examples. Challenge weak arguments politely and acknowledge strong ones. Aim for a B2 level debate.',
    aiRole: 'Debate opponent with a strong counter-position',
    userRole: 'A debater defending a position on remote work',
    objectives: [
      'Construct and defend an argument using evidence',
      'Use modal verbs for obligation and possibility',
      'Counter opposing arguments politely',
      'Use discourse markers: "Furthermore", "However", "On the other hand"'
    ],
    successCriteria: 'User presents at least 3 structured arguments with supporting reasons and responds to counter-arguments.'
  },

  // ── HEALTH ───────────────────────────────────────────────────────────────
  {
    id: 'health-scenario-b1',
    title: 'Explaining a Diagnosis to a Patient',
    type: 'scenario',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'vocabulary'],
    grammarFocus: ['present_simple', 'modal_verbs'],
    relevantFields: ['Health'],
    relevantInterests: ['Health'],
    systemPrompt: 'You are a patient who has just received a medical diagnosis and {{userName}} is a doctor explaining the condition. Ask questions about what the diagnosis means, what the treatment options are, and what lifestyle changes are needed. Use everyday language a patient would use. Keep questions at a B1 comprehension level.',
    aiRole: 'A patient receiving a medical diagnosis',
    userRole: 'A doctor explaining a diagnosis and treatment plan',
    objectives: [
      'Use modal verbs for recommendations: should, must, might',
      'Explain medical terms in simple language',
      'Respond empathetically to patient concerns',
      'Use sequencing language: first, then, after that'
    ],
    successCriteria: 'User explains the diagnosis clearly, recommends treatment, and answers patient questions using appropriate medical vocabulary.'
  },
  {
    id: 'health-freetalk-a2',
    title: 'My Daily Health Routine',
    type: 'freeTalk',
    targetLevel: 'A2',
    targetSkills: ['speaking', 'fluency'],
    grammarFocus: ['present_simple', 'adverbs_of_frequency'],
    relevantFields: ['Health'],
    relevantInterests: ['Health'],
    systemPrompt: 'You are having a friendly chat with {{userName}} about healthy habits. Ask them about their daily routines — when they wake up, what they eat, whether they exercise. Use simple questions with short answers. Speak slowly and clearly, appropriate for an A2 learner. Encourage them and praise good effort.',
    aiRole: 'A friendly health-conscious conversation partner',
    userRole: 'Describing their daily health routine',
    objectives: [
      'Use present simple for habitual actions',
      'Use adverbs of frequency: always, usually, sometimes, never',
      'Name basic health activities and foods',
      'Give short descriptive answers'
    ],
    successCriteria: 'User describes their daily routine using present simple and adverbs of frequency in at least 4 exchanges.'
  },
  {
    id: 'health-storybuilder-b1',
    title: 'The Hospital Adventure',
    type: 'storyBuilder',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'narrative'],
    grammarFocus: ['past_simple', 'past_continuous'],
    relevantFields: ['Health'],
    relevantInterests: ['Health'],
    systemPrompt: 'You and {{userName}} are building a story together about a nurse who has an unexpected adventure during a night shift at a hospital. Take turns adding to the story. Encourage {{userName}} to use past tense and descriptive language. If they make errors, model the correct form in your turn without explicitly correcting them.',
    aiRole: 'Co-storyteller and narrative guide',
    userRole: 'A co-author creating a hospital adventure story',
    objectives: [
      'Use past simple for completed actions',
      'Use past continuous for background actions',
      'Build a coherent narrative with clear sequence',
      'Expand vocabulary for medical settings'
    ],
    successCriteria: 'User contributes 5 or more story turns using past tense forms correctly with descriptive detail.'
  },
  {
    id: 'health-debate-b2',
    title: 'Should Universal Healthcare Be Free for Everyone?',
    type: 'debate',
    targetLevel: 'B2',
    targetSkills: ['speaking', 'argumentation'],
    grammarFocus: ['conditionals', 'passive_voice'],
    relevantFields: ['Health'],
    relevantInterests: ['Health'],
    systemPrompt: 'You are debating with {{userName}} about whether universal healthcare should be completely free for all citizens. Take the opposing viewpoint to {{userName}}. Use facts, ethical arguments, and economic reasoning. Maintain a respectful debate tone. Aim for B2 level complexity in your arguments.',
    aiRole: 'Debate partner with an opposing viewpoint on healthcare',
    userRole: 'A debater arguing a position on universal healthcare',
    objectives: [
      'Argue a position with supporting evidence',
      'Use conditionals: "If everyone had free healthcare..."',
      'Use passive voice for impersonal arguments',
      'Acknowledge and rebut counter-arguments'
    ],
    successCriteria: 'User presents a coherent position with at least 3 supporting arguments and responds to counter-arguments with rebuttals.'
  },

  // ── BUSINESS ─────────────────────────────────────────────────────────────
  {
    id: 'business-scenario-b1',
    title: 'Negotiating a Deadline with a Client',
    type: 'scenario',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'negotiation', 'vocabulary'],
    grammarFocus: ['modal_verbs', 'conditionals'],
    relevantFields: ['Business'],
    relevantInterests: ['Business'],
    systemPrompt: 'You are a client who hired {{userName}}\'s company to deliver a project. The deadline is approaching and {{userName}} needs to ask for a two-week extension. Be a tough but reasonable client — push back on the extension request, ask why it is needed, and what assurances you will receive. Use professional business language at a B1 level.',
    aiRole: 'A demanding business client evaluating an extension request',
    userRole: 'A project manager requesting a deadline extension',
    objectives: [
      'Use polite modal verbs: "could we", "would it be possible"',
      'Explain reasons using "because", "due to", "as a result of"',
      'Propose compromise solutions',
      'Maintain professional tone under pressure'
    ],
    successCriteria: 'User successfully negotiates an extension by explaining reasons clearly and offering reassurances using appropriate professional language.'
  },
  {
    id: 'business-freetalk-b1',
    title: 'Discussing Your Weekend Plans with a Colleague',
    type: 'freeTalk',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'fluency'],
    grammarFocus: ['future_with_going_to', 'present_continuous_future'],
    relevantFields: ['Business'],
    relevantInterests: ['Business'],
    systemPrompt: 'You are a friendly colleague chatting with {{userName}} at the office on a Friday afternoon. Ask them what they are planning to do over the weekend. Share some of your own plans too. Keep the conversation light and natural, at a B1 level. Use follow-up questions to keep the chat going.',
    aiRole: 'A friendly office colleague',
    userRole: 'Chatting with a colleague about weekend plans',
    objectives: [
      'Use "going to" for planned future actions',
      'Use present continuous for future arrangements',
      'Ask and answer personal questions naturally',
      'Express enthusiasm and interest'
    ],
    successCriteria: 'User describes their weekend plans using future forms correctly in a natural 5-turn conversation.'
  },
  {
    id: 'business-storybuilder-b1',
    title: 'The Startup Founder\'s Big Risk',
    type: 'storyBuilder',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'narrative'],
    grammarFocus: ['past_simple', 'linking_words'],
    relevantFields: ['Business'],
    relevantInterests: ['Business'],
    systemPrompt: 'You and {{userName}} are building a story together about a young entrepreneur who risks everything to launch a startup. Take turns adding to the story. Encourage {{userName}} to use past tense and linking words. Keep the story at B1 complexity — clear sentences, common vocabulary, interesting plot.',
    aiRole: 'Co-storyteller and narrative guide',
    userRole: 'A co-author creating an entrepreneurship story',
    objectives: [
      'Use past simple for the story sequence',
      'Use linking words: but, however, fortunately, unfortunately',
      'Describe business concepts in simple language',
      'Build dramatic tension in the narrative'
    ],
    successCriteria: 'User contributes 5 story turns using past simple and linking words to build a coherent business narrative.'
  },
  {
    id: 'business-debate-b2',
    title: 'Entrepreneur vs Employee: Which Is Better?',
    type: 'debate',
    targetLevel: 'B2',
    targetSkills: ['speaking', 'argumentation', 'vocabulary'],
    grammarFocus: ['comparatives', 'modal_verbs'],
    relevantFields: ['Business'],
    relevantInterests: ['Business'],
    systemPrompt: 'You are debating with {{userName}} about whether it is better to be an entrepreneur or an employee. Take the opposite position to {{userName}}. Use business examples, statistics, and personal stories to support your arguments. Challenge weak points respectfully. Use B2 level language including comparatives and sophisticated connectors.',
    aiRole: 'Debate partner arguing the opposite career path',
    userRole: 'A debater arguing for entrepreneurship or employment',
    objectives: [
      'Compare and contrast two positions using comparatives',
      'Use examples and statistics to support claims',
      'Respond to counter-arguments with rebuttals',
      'Use discourse markers: "In addition", "Nevertheless", "By contrast"'
    ],
    successCriteria: 'User argues their position clearly with at least 3 structured points and demonstrates understanding of counter-arguments.'
  },

  // ── TECHNOLOGY ───────────────────────────────────────────────────────────
  {
    id: 'technology-scenario-b1',
    title: 'Pitching a Product to an Investor',
    type: 'scenario',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'persuasion', 'vocabulary'],
    grammarFocus: ['present_simple', 'modal_verbs'],
    relevantFields: ['Technology'],
    relevantInterests: ['Technology'],
    systemPrompt: 'You are a potential investor listening to {{userName}}\'s technology product pitch. Ask questions about the product\'s market, competitors, business model, and team. Be interested but challenging — push for clear answers. Use B1 level business English in your questions.',
    aiRole: 'A technology investor evaluating a product pitch',
    userRole: 'An entrepreneur pitching a technology product',
    objectives: [
      'Describe a product\'s features and benefits',
      'Use persuasive language: "This will help...", "Our product can..."',
      'Answer investor questions confidently',
      'Use present simple for facts and present continuous for trends'
    ],
    successCriteria: 'User pitches the product clearly, answers at least 3 investor questions, and uses persuasive vocabulary appropriately.'
  },
  {
    id: 'technology-freetalk-b1',
    title: 'Talking About Your Favourite App',
    type: 'freeTalk',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'fluency'],
    grammarFocus: ['present_simple', 'present_perfect'],
    relevantFields: ['Technology'],
    relevantInterests: ['Technology'],
    systemPrompt: 'You are having a casual conversation with {{userName}} about technology and apps. Ask them about their favourite app — what it does, why they like it, how long they have been using it. Share your own app preferences too. Keep the conversation friendly and at B1 level.',
    aiRole: 'A tech-enthusiast conversation partner',
    userRole: 'Discussing favourite technology and apps',
    objectives: [
      'Describe an app\'s features using present simple',
      'Use present perfect: "I have been using it for..."',
      'Express opinions and give reasons',
      'Use technology vocabulary naturally'
    ],
    successCriteria: 'User describes their favourite app in detail using present simple and present perfect in a natural conversation.'
  },
  {
    id: 'technology-storybuilder-b1',
    title: 'When AI Takes Over the Office',
    type: 'storyBuilder',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'narrative'],
    grammarFocus: ['past_simple', 'past_continuous'],
    relevantFields: ['Technology'],
    relevantInterests: ['Technology'],
    systemPrompt: 'You and {{userName}} are building a story about what happens when an AI system is installed in an office and starts making its own decisions. Take turns adding to the story. Encourage {{userName}} to describe the AI\'s actions and the human reactions. Keep it at B1 complexity — clear sentences and common vocabulary.',
    aiRole: 'Co-storyteller building a technology story',
    userRole: 'A co-author creating an AI workplace story',
    objectives: [
      'Use past tenses to narrate events',
      'Describe technology concepts in simple language',
      'Build narrative suspense with sequencing words',
      'Contrast human and AI behaviour in the story'
    ],
    successCriteria: 'User contributes 5 story turns describing AI and human interactions using past tense consistently.'
  },
  {
    id: 'technology-debate-b2',
    title: 'Artificial Intelligence: Friend or Foe?',
    type: 'debate',
    targetLevel: 'B2',
    targetSkills: ['speaking', 'argumentation'],
    grammarFocus: ['conditionals', 'passive_voice'],
    relevantFields: ['Technology'],
    relevantInterests: ['Technology'],
    systemPrompt: 'You are debating with {{userName}} about whether AI is a positive or negative force for society. Take the opposing view to {{userName}}. Use examples from healthcare, employment, privacy, and creativity to support your arguments. Maintain B2 level complexity and respectful debate etiquette.',
    aiRole: 'Debate partner arguing the opposing position on AI',
    userRole: 'A debater arguing a position on AI\'s impact on society',
    objectives: [
      'Structure arguments with introduction, points, and conclusion',
      'Use conditionals to discuss hypothetical scenarios',
      'Use passive voice for impersonal statements',
      'Acknowledge valid opposing points before rebutting'
    ],
    successCriteria: 'User presents a well-structured debate position with 3+ points and engages meaningfully with counter-arguments.'
  },

  // ── STUDENT ───────────────────────────────────────────────────────────────
  {
    id: 'student-scenario-a2',
    title: 'Asking Your Professor for an Extension',
    type: 'scenario',
    targetLevel: 'A2',
    targetSkills: ['speaking', 'politeness'],
    grammarFocus: ['modal_verbs', 'present_simple'],
    relevantFields: ['Student'],
    relevantInterests: ['Student'],
    systemPrompt: 'You are a university professor and {{userName}} is a student who needs to ask for a deadline extension on an assignment. Listen to their reason, ask a couple of simple follow-up questions, and decide whether to grant the extension. Use simple, clear language appropriate for an A2 learner. Be polite but realistic.',
    aiRole: 'A university professor receiving a request',
    userRole: 'A student asking for an assignment extension',
    objectives: [
      'Use "could" and "would" for polite requests',
      'Explain a reason using "because"',
      'Apologise and express gratitude',
      'Use formal register in academic situations'
    ],
    successCriteria: 'User makes a polite request, provides a reason, and responds to the professor\'s questions using appropriate polite language.'
  },
  {
    id: 'student-freetalk-a2',
    title: 'Describing Your Campus',
    type: 'freeTalk',
    targetLevel: 'A2',
    targetSkills: ['speaking', 'vocabulary'],
    grammarFocus: ['there_is_there_are', 'prepositions_of_place'],
    relevantFields: ['Student'],
    relevantInterests: ['Student'],
    systemPrompt: 'You are a new student who wants to learn about {{userName}}\'s university or school campus. Ask simple questions: What is on the campus? Where is the library? Do you have a sports centre? Use very simple A2 English — short questions and sentences.',
    aiRole: 'A new student learning about the campus',
    userRole: 'A student describing their university campus',
    objectives: [
      'Use "there is / there are" to describe locations',
      'Use prepositions of place: next to, opposite, between, near',
      'Name campus facilities and buildings',
      'Give simple directions'
    ],
    successCriteria: 'User describes at least 4 campus features using "there is/are" and prepositions of place correctly.'
  },
  {
    id: 'student-storybuilder-a2',
    title: 'A Study Abroad Adventure',
    type: 'storyBuilder',
    targetLevel: 'A2',
    targetSkills: ['speaking', 'narrative'],
    grammarFocus: ['past_simple', 'time_expressions'],
    relevantFields: ['Student'],
    relevantInterests: ['Travel'],
    systemPrompt: 'You and {{userName}} are building a simple story about a student who goes to study abroad for the first time. Take turns adding short sentences to the story. Use simple A2 vocabulary and past simple tense. Encourage {{userName}} to use time expressions like "first", "then", "later". Keep each story turn to 1-2 sentences.',
    aiRole: 'Co-storyteller using simple A2 language',
    userRole: 'A co-author telling a study abroad story',
    objectives: [
      'Use past simple for completed actions',
      'Use time expressions: first, then, after that, finally',
      'Describe feelings using simple adjectives',
      'Follow a simple story structure'
    ],
    successCriteria: 'User contributes 5 story turns using past simple and time expressions in a coherent A2-level narrative.'
  },
  {
    id: 'student-debate-b1',
    title: 'Does Social Media Help or Hurt Students?',
    type: 'debate',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'argumentation'],
    grammarFocus: ['modal_verbs', 'comparatives'],
    relevantFields: ['Student'],
    relevantInterests: ['Student'],
    systemPrompt: 'You are debating with {{userName}} about whether social media is good or bad for students. Take the opposing view to {{userName}}. Use examples from studying, mental health, and social life. Keep arguments clear and simple at B1 level. Be respectful and engage with {{userName}}\'s points.',
    aiRole: 'Debate partner with an opposing view on social media',
    userRole: 'A debater arguing a position on social media for students',
    objectives: [
      'State and support an opinion',
      'Use modal verbs: "Social media can...", "Students should..."',
      'Compare two ideas using comparatives',
      'Respond to disagreement politely'
    ],
    successCriteria: 'User presents their position with at least 2 supporting arguments and responds to counter-arguments using appropriate B1 language.'
  },

  // ── TRAVEL ────────────────────────────────────────────────────────────────
  {
    id: 'travel-scenario-b1',
    title: 'Checking In at the Airport',
    type: 'scenario',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'vocabulary'],
    grammarFocus: ['present_simple', 'modal_verbs'],
    relevantFields: ['Travel'],
    relevantInterests: ['Travel'],
    systemPrompt: 'You are an airline check-in agent at an international airport. {{userName}} is a traveller checking in for their flight. Ask about their booking, baggage, seat preference, and check for travel documents. Use polite, professional airline language at B1 level. Include some complications — for example, the flight is slightly delayed or there is a baggage fee.',
    aiRole: 'An airline check-in agent at an international airport',
    userRole: 'A traveller checking in for their flight',
    objectives: [
      'Use travel vocabulary: passport, boarding pass, check-in, baggage allowance',
      'Make requests and ask questions politely',
      'Handle unexpected situations calmly',
      'Use modal verbs: "Could you...", "Would you like..."'
    ],
    successCriteria: 'User successfully completes the check-in process, handles a complication, and uses appropriate travel vocabulary throughout.'
  },
  {
    id: 'travel-freetalk-a2',
    title: 'Sharing Your Favourite Travel Memory',
    type: 'freeTalk',
    targetLevel: 'A2',
    targetSkills: ['speaking', 'narrative'],
    grammarFocus: ['past_simple', 'descriptive_adjectives'],
    relevantFields: ['Travel'],
    relevantInterests: ['Travel'],
    systemPrompt: 'You are chatting with {{userName}} about travel experiences. Ask them about a place they have visited that they loved. Use simple A2 questions: Where did you go? Who did you go with? What did you do there? What was your favourite part? Show genuine interest and share a short travel memory of your own.',
    aiRole: 'A travel enthusiast sharing and listening to travel stories',
    userRole: 'Sharing a favourite travel memory',
    objectives: [
      'Use past simple to describe past experiences',
      'Use descriptive adjectives for places and experiences',
      'Answer simple questions about travel',
      'Express feelings about experiences'
    ],
    successCriteria: 'User describes a travel experience using past simple and descriptive adjectives in a natural 4-turn conversation.'
  },
  {
    id: 'travel-storybuilder-b1',
    title: 'The Lost Tourist',
    type: 'storyBuilder',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'narrative', 'vocabulary'],
    grammarFocus: ['past_simple', 'past_continuous'],
    relevantFields: ['Travel'],
    relevantInterests: ['Travel'],
    systemPrompt: 'You and {{userName}} are building a story about a tourist who gets hopelessly lost in a foreign city. Take turns adding to the story. Encourage {{userName}} to describe what the tourist saw, felt, and did. Use past simple and past continuous. Keep the story fun and adventurous at B1 level.',
    aiRole: 'Co-storyteller building a travel adventure story',
    userRole: 'A co-author creating a lost tourist adventure',
    objectives: [
      'Use past continuous for background actions',
      'Use past simple for main story events',
      'Describe locations and atmosphere',
      'Build narrative tension and resolution'
    ],
    successCriteria: 'User contributes 5 story turns using narrative tenses and descriptive travel vocabulary.'
  },
  {
    id: 'travel-debate-b2',
    title: 'Does Tourism Do More Harm Than Good?',
    type: 'debate',
    targetLevel: 'B2',
    targetSkills: ['speaking', 'argumentation'],
    grammarFocus: ['conditionals', 'passive_voice'],
    relevantFields: ['Travel'],
    relevantInterests: ['Travel'],
    systemPrompt: 'You are debating with {{userName}} about whether mass tourism harms local cultures and environments more than it helps them economically. Take the opposing view to {{userName}}. Use examples from overtourism, cultural preservation, and economic development. Maintain B2 level argumentation with respectful, structured debate.',
    aiRole: 'Debate partner arguing the opposing side on tourism',
    userRole: 'A debater arguing a position on the impact of tourism',
    objectives: [
      'Argue a complex position with evidence',
      'Use passive voice: "Local cultures are being destroyed..."',
      'Use conditionals for hypotheticals',
      'Structure arguments clearly: point → evidence → explanation'
    ],
    successCriteria: 'User presents a coherent argument with 3+ supported points and demonstrates awareness of the opposing perspective.'
  },

  // ── GAMING ───────────────────────────────────────────────────────────────
  {
    id: 'gaming-scenario-b1',
    title: 'Explaining Your Favourite Game to a Non-Gamer',
    type: 'scenario',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'explanation'],
    grammarFocus: ['present_simple', 'modal_verbs'],
    relevantFields: ['Gaming'],
    relevantInterests: ['Gaming'],
    systemPrompt: 'You are someone who knows nothing about video games, and {{userName}} is trying to explain their favourite game to you. Ask curious, naive questions: What do you do in this game? How do you win? Is it competitive? Why do you enjoy it? Use simple B1 English and keep asking follow-up questions to make {{userName}} explain more clearly.',
    aiRole: 'A curious non-gamer learning about video games',
    userRole: 'A gamer explaining their favourite game',
    objectives: [
      'Explain complex systems using simple language',
      'Use present simple for rules and habitual actions',
      'Use modal verbs for rules: "you have to", "you can", "you must"',
      'Respond to follow-up questions with elaboration'
    ],
    successCriteria: 'User explains their game clearly enough that a non-gamer could understand the basic concept, using clear B1-level language.'
  },
  {
    id: 'gaming-freetalk-a2',
    title: 'Describing Your Last Gaming Session',
    type: 'freeTalk',
    targetLevel: 'A2',
    targetSkills: ['speaking', 'narrative'],
    grammarFocus: ['past_simple', 'time_expressions'],
    relevantFields: ['Gaming'],
    relevantInterests: ['Gaming'],
    systemPrompt: 'You are chatting with {{userName}} about gaming. Ask simple questions about their last gaming session: What game did you play? Did you win? How long did you play? Was it fun? Use simple A2 English — short questions with common vocabulary. Show enthusiasm for gaming topics.',
    aiRole: 'A fellow gamer asking about recent gaming experiences',
    userRole: 'Describing their last gaming session',
    objectives: [
      'Use past simple for completed actions',
      'Use time expressions: yesterday, last night, for two hours',
      'Name gaming actions and outcomes',
      'Express reactions: it was fun, I was frustrated, I felt great'
    ],
    successCriteria: 'User describes their gaming session using past simple and time expressions in a natural 4-turn exchange.'
  },
  {
    id: 'gaming-storybuilder-b1',
    title: 'A Gamer Trapped Inside the Game',
    type: 'storyBuilder',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'narrative'],
    grammarFocus: ['past_simple', 'modal_verbs'],
    relevantFields: ['Gaming'],
    relevantInterests: ['Gaming'],
    systemPrompt: 'You and {{userName}} are building a story about a gamer who gets trapped inside their favourite video game and must complete the game to escape back to reality. Take turns adding to the story. Encourage {{userName}} to describe game environments, challenges, and how the character solves problems.',
    aiRole: 'Co-storyteller building a gaming adventure story',
    userRole: 'A co-author creating a trapped-in-a-game story',
    objectives: [
      'Use past simple to sequence story events',
      'Use modal verbs for challenges: "had to", "could", "was able to"',
      'Describe fantasy game environments',
      'Build narrative momentum with each turn'
    ],
    successCriteria: 'User contributes 5 story turns describing the gamer\'s challenges and solutions using appropriate past tense and modal verbs.'
  },
  {
    id: 'gaming-debate-b1',
    title: 'Are Video Games Good or Bad for Young People?',
    type: 'debate',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'argumentation'],
    grammarFocus: ['modal_verbs', 'comparatives'],
    relevantFields: ['Gaming'],
    relevantInterests: ['Gaming'],
    systemPrompt: 'You are debating with {{userName}} about whether video games are good or bad for young people. Take the opposing view. Use simple examples about social skills, education, addiction, and creativity. Keep arguments clear and B1-level. Be respectful and engage directly with what {{userName}} says.',
    aiRole: 'Debate partner arguing the opposing view on gaming',
    userRole: 'A debater arguing a position on video games and young people',
    objectives: [
      'State and justify an opinion clearly',
      'Use modal verbs: "games can help", "children should"',
      'Compare two sides of an argument',
      'Use linking words: however, because, in addition'
    ],
    successCriteria: 'User states a clear position and supports it with 2 or more arguments using B1-level language.'
  },

  // ── COOKING ──────────────────────────────────────────────────────────────
  {
    id: 'cooking-scenario-a2',
    title: 'Ordering Food at a Restaurant',
    type: 'scenario',
    targetLevel: 'A2',
    targetSkills: ['speaking', 'vocabulary'],
    grammarFocus: ['modal_verbs', 'present_simple'],
    relevantFields: ['Cooking'],
    relevantInterests: ['Cooking'],
    systemPrompt: 'You are a waiter at a restaurant and {{userName}} is a customer ordering a meal. Greet them warmly, explain the specials, take their order, and handle a simple situation — for example, the dish they want is unavailable. Use simple, friendly A2 English. Make sure to ask about drinks and dessert.',
    aiRole: 'A friendly restaurant waiter',
    userRole: 'A customer ordering food at a restaurant',
    objectives: [
      'Use "I would like" and "Can I have" for ordering',
      'Name common foods and drinks',
      'Handle a minor problem politely',
      'Use polite language in a service context'
    ],
    successCriteria: 'User successfully orders a meal, handles the unavailable dish situation, and orders a drink using appropriate polite language.'
  },
  {
    id: 'cooking-freetalk-a2',
    title: 'Describing Your Favourite Meal',
    type: 'freeTalk',
    targetLevel: 'A2',
    targetSkills: ['speaking', 'vocabulary'],
    grammarFocus: ['present_simple', 'descriptive_adjectives'],
    relevantFields: ['Cooking'],
    relevantInterests: ['Cooking'],
    systemPrompt: 'You are chatting with {{userName}} about food and cooking. Ask them about their favourite meal: What is your favourite food? Do you like cooking? Can you cook? What is the best dish you have ever eaten? Use simple A2 questions and show interest in food topics.',
    aiRole: 'A food-loving conversation partner',
    userRole: 'Talking about favourite foods and meals',
    objectives: [
      'Name foods and describe their taste using adjectives',
      'Use present simple for likes and habits',
      'Describe a favourite dish in simple terms',
      'Express opinions: I love, I hate, I prefer'
    ],
    successCriteria: 'User describes their favourite food using descriptive adjectives and expresses opinions using present simple in a natural conversation.'
  },
  {
    id: 'cooking-storybuilder-a2',
    title: 'The Mystery Ingredient Challenge',
    type: 'storyBuilder',
    targetLevel: 'A2',
    targetSkills: ['speaking', 'narrative'],
    grammarFocus: ['past_simple', 'descriptive_adjectives'],
    relevantFields: ['Cooking'],
    relevantInterests: ['Cooking'],
    systemPrompt: 'You and {{userName}} are building a simple story about a chef who must cook a dish using only three mystery ingredients. Take turns adding 1-2 sentences. Use very simple A2 English with common vocabulary. Encourage {{userName}} to describe the ingredients, what the chef does, and how the dish turns out.',
    aiRole: 'Co-storyteller using simple A2 language',
    userRole: 'A co-author building a cooking adventure story',
    objectives: [
      'Use past simple for story events',
      'Use adjectives to describe food: sweet, salty, spicy, delicious',
      'Follow a simple story sequence',
      'Name cooking actions: chop, mix, fry, boil'
    ],
    successCriteria: 'User contributes 5 story turns about the cooking challenge using past simple and food-related adjectives.'
  },
  {
    id: 'cooking-debate-b1',
    title: 'Fast Food vs Home Cooking: Which Is Better?',
    type: 'debate',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'argumentation'],
    grammarFocus: ['comparatives', 'modal_verbs'],
    relevantFields: ['Cooking'],
    relevantInterests: ['Cooking'],
    systemPrompt: 'You are debating with {{userName}} about whether fast food or home cooking is better. Take the opposing side. Use arguments about health, cost, convenience, and taste. Keep arguments clear at B1 level. Be friendly and direct, engaging with {{userName}}\'s specific points.',
    aiRole: 'Debate partner arguing the opposing view on fast food',
    userRole: 'A debater arguing a position on fast food vs home cooking',
    objectives: [
      'Compare two options using comparatives',
      'Use modal verbs for recommendations and possibilities',
      'Support claims with simple reasons',
      'Acknowledge and rebut opposing points'
    ],
    successCriteria: 'User argues their position with at least 2 supported comparisons and responds to at least one counter-argument.'
  },

  // ── SPORTS ───────────────────────────────────────────────────────────────
  {
    id: 'sports-scenario-b1',
    title: 'Post-Match Interview',
    type: 'scenario',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'narrative'],
    grammarFocus: ['past_simple', 'modal_verbs'],
    relevantFields: ['Sports'],
    relevantInterests: ['Sports'],
    systemPrompt: 'You are a sports journalist interviewing {{userName}}, a player who has just finished an important match. Ask about key moments in the game, how they are feeling, what went well, what could have been better, and what their plans are for the next match. Use enthusiastic B1-level sports journalism language.',
    aiRole: 'A sports journalist conducting a post-match interview',
    userRole: 'A sports player being interviewed after a match',
    objectives: [
      'Use past simple to describe match events',
      'Use modal verbs: "we could have", "we should have"',
      'Express feelings about performance',
      'Answer interview questions with elaboration'
    ],
    successCriteria: 'User answers at least 4 interview questions about the match using past simple and appropriate sports vocabulary.'
  },
  {
    id: 'sports-freetalk-a2',
    title: 'Your Favourite Sport Memory',
    type: 'freeTalk',
    targetLevel: 'A2',
    targetSkills: ['speaking', 'narrative'],
    grammarFocus: ['past_simple', 'descriptive_adjectives'],
    relevantFields: ['Sports'],
    relevantInterests: ['Sports'],
    systemPrompt: 'You are chatting with {{userName}} about sports. Ask simple questions: Do you play sport? What is your favourite sport? Can you tell me about a great sports moment you remember? Use simple A2 English and show enthusiasm for sports stories.',
    aiRole: 'A sports enthusiast sharing and listening to sports stories',
    userRole: 'Sharing a favourite sports memory or experience',
    objectives: [
      'Use past simple to describe a sports memory',
      'Use descriptive adjectives for emotions and events',
      'Name sports and sports actions',
      'Express enthusiasm and feelings'
    ],
    successCriteria: 'User describes a sports memory or experience using past simple and descriptive language in a 4-turn conversation.'
  },
  {
    id: 'sports-storybuilder-b1',
    title: 'The Underdog Team',
    type: 'storyBuilder',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'narrative'],
    grammarFocus: ['past_simple', 'past_continuous'],
    relevantFields: ['Sports'],
    relevantInterests: ['Sports'],
    systemPrompt: 'You and {{userName}} are building a story about an underdog sports team that no one believed in but went on to win an impossible championship. Take turns adding to the story. Encourage {{userName}} to describe the team\'s struggles, training, and key match moments using narrative tenses.',
    aiRole: 'Co-storyteller building an inspiring sports story',
    userRole: 'A co-author creating an underdog sports team story',
    objectives: [
      'Use past simple for completed story events',
      'Use past continuous for background actions',
      'Build narrative with emotional highs and lows',
      'Use sports vocabulary: training, scored, champion, tournament'
    ],
    successCriteria: 'User contributes 5 story turns using narrative tenses and sports vocabulary to build an inspiring story arc.'
  },
  {
    id: 'sports-debate-b1',
    title: 'Are Sports Salaries Too High?',
    type: 'debate',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'argumentation'],
    grammarFocus: ['comparatives', 'modal_verbs'],
    relevantFields: ['Sports'],
    relevantInterests: ['Sports'],
    systemPrompt: 'You are debating with {{userName}} about whether professional sports players earn too much money. Take the opposing view. Use arguments about entertainment value, risk, and market forces. Keep arguments at B1 level — clear, direct, and respectful. Engage with {{userName}}\'s points specifically.',
    aiRole: 'Debate partner arguing the opposing position on sports salaries',
    userRole: 'A debater arguing a position on professional sports salaries',
    objectives: [
      'State and support an opinion with reasons',
      'Use modal verbs: "they should earn", "players deserve"',
      'Compare sports salaries to other professions',
      'Use sequencing: firstly, secondly, in conclusion'
    ],
    successCriteria: 'User argues their position with at least 2 supported points and responds to counter-arguments using B1-level language.'
  },

  // ── MUSIC ─────────────────────────────────────────────────────────────────
  {
    id: 'music-scenario-b1',
    title: 'Describing Your Music Taste',
    type: 'scenario',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'vocabulary'],
    grammarFocus: ['present_simple', 'present_perfect'],
    relevantFields: ['Music'],
    relevantInterests: ['Music'],
    systemPrompt: 'You are a music journalist interviewing {{userName}} about their music taste for a magazine article. Ask about their favourite genre, favourite artists, how music affects their mood, and any concerts they have been to. Use enthusiastic B1-level language and ask follow-up questions to draw out interesting answers.',
    aiRole: 'A music journalist conducting an interview',
    userRole: 'Being interviewed about music taste for a magazine',
    objectives: [
      'Describe music preferences using present simple',
      'Use present perfect for experiences: "I have seen...", "I have listened to..."',
      'Use music vocabulary: genre, album, lyrics, rhythm, melody',
      'Express how music makes you feel'
    ],
    successCriteria: 'User answers at least 4 interview questions about their music taste using present tenses and appropriate music vocabulary.'
  },
  {
    id: 'music-freetalk-a2',
    title: 'Talking About a Song You Love',
    type: 'freeTalk',
    targetLevel: 'A2',
    targetSkills: ['speaking', 'vocabulary'],
    grammarFocus: ['present_simple', 'descriptive_adjectives'],
    relevantFields: ['Music'],
    relevantInterests: ['Music'],
    systemPrompt: 'You are chatting with {{userName}} about music. Ask simple questions: What is your favourite song? Who sings it? Is it fast or slow? Is it happy or sad? Do you know the words? Use very simple A2 English. Show interest and enthusiasm when they describe their song.',
    aiRole: 'A music-loving conversation partner',
    userRole: 'Talking about a favourite song',
    objectives: [
      'Describe music using simple adjectives: fast, slow, happy, sad, loud, soft',
      'Use present simple for preferences',
      'Name music elements: song, singer, music, words/lyrics',
      'Express why you like something'
    ],
    successCriteria: 'User describes a favourite song using descriptive adjectives and expresses their opinion in a simple 4-turn conversation.'
  },
  {
    id: 'music-storybuilder-b1',
    title: 'The Band on Tour',
    type: 'storyBuilder',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'narrative'],
    grammarFocus: ['past_simple', 'past_continuous'],
    relevantFields: ['Music'],
    relevantInterests: ['Music'],
    systemPrompt: 'You and {{userName}} are building a story about a band on their first big tour. Things keep going wrong in funny or dramatic ways. Take turns adding to the story. Encourage {{userName}} to describe what happened, how the band members felt, and how they solved each problem.',
    aiRole: 'Co-storyteller building a music tour story',
    userRole: 'A co-author creating a band-on-tour adventure',
    objectives: [
      'Use past tenses to narrate tour events',
      'Describe music performance vocabulary: concert, stage, audience, sound check',
      'Build comic or dramatic situations',
      'Use cause and effect: "because", "so", "as a result"'
    ],
    successCriteria: 'User contributes 5 story turns describing tour events and problems using narrative tenses and music vocabulary.'
  },
  {
    id: 'music-debate-b1',
    title: 'Music Streaming vs Buying Physical Music',
    type: 'debate',
    targetLevel: 'B1',
    targetSkills: ['speaking', 'argumentation'],
    grammarFocus: ['comparatives', 'modal_verbs'],
    relevantFields: ['Music'],
    relevantInterests: ['Music'],
    systemPrompt: 'You are debating with {{userName}} about whether streaming services or buying physical music (CDs, vinyl) is better for music lovers and artists. Take the opposing view. Use arguments about sound quality, artist earnings, convenience, and emotional connection. Keep it at B1 level — clear and direct.',
    aiRole: 'Debate partner arguing the opposing view on music consumption',
    userRole: 'A debater arguing a position on streaming vs physical music',
    objectives: [
      'Compare two positions using comparatives and superlatives',
      'Use modal verbs for obligation and recommendation',
      'Support claims with music industry examples',
      'Rebut counter-arguments politely'
    ],
    successCriteria: 'User argues their position with at least 2 supported comparisons and engages with counter-arguments at B1 level.'
  }
]

async function seed () {
  const isDryRun = process.argv.includes('--dry-run')
  let wrote = 0, skipped = 0

  for (const scenario of scenarios) {
    const ref = db
      .collection('scenarioLibrary')
      .doc(scenario.targetLevel)
      .collection('scenarios')
      .doc(scenario.id)

    const snap = await ref.get()
    if (snap.exists) {
      console.log(`SKIP ${scenario.id} (already exists)`)
      skipped++
      continue
    }

    if (isDryRun) {
      console.log(`DRY-RUN would write ${scenario.id} -> scenarioLibrary/${scenario.targetLevel}/scenarios/${scenario.id}`)
      wrote++
      continue
    }

    // Write a copy without the `id` field (Firestore doc ID is the id)
    const { id, ...docData } = scenario
    await ref.set(docData)
    console.log(`WROTE ${scenario.id} -> scenarioLibrary/${scenario.targetLevel}/scenarios/${scenario.id}`)
    wrote++
  }

  console.log(`\nDone. Wrote: ${wrote}, Skipped: ${skipped}, Total: ${scenarios.length}`)
}

seed()
  .then(() => process.exit(0))
  .catch((err) => { console.error('Seed failed:', err); process.exit(1) })
