/**
 * SpeakAI Cloud Functions
 * Region: africa-south1 (matches Firestore database location)
 *
 * Phase 6 scaffold: Sets up global options, secret declarations, and admin SDK init.
 * Active function implementations are added in Phases 8, 9, and 10.
 */

const { setGlobalOptions } = require('firebase-functions')
const { defineSecret } = require('firebase-functions/params')
const { onRequest, onCall, HttpsError } = require('firebase-functions/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const logger = require('firebase-functions/logger')
const OpenAI = require('openai')
const https = require('https')
const crypto = require('crypto')

// All functions run in africa-south1 to minimize latency to the Firestore database.
// maxInstances: 10 prevents runaway scaling costs.
setGlobalOptions({ maxInstances: 10, region: 'africa-south1' })

// ── Secret declarations ──────────────────────────────────────────────────────
// Secrets are stored in Firebase Secret Manager (not .env files).
// Set values via Firebase CLI:
//   firebase functions:secrets:set OPENAI_API_KEY
//   firebase functions:secrets:set MOZPAYMENTS_API_KEY
//
// Access inside a function: OPENAI_API_KEY.value()
// Functions that use a secret must declare it in their options: { secrets: [OPENAI_API_KEY] }
const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY')
const MOZPAYMENTS_API_KEY = defineSecret('MOZPAYMENTS_API_KEY')

// ── Firebase Admin SDK ───────────────────────────────────────────────────────
// Admin SDK is initialized once here. Import admin elsewhere with:
//   const admin = require('firebase-admin')
// (Admin SDK auto-detects credentials in Cloud Functions environment)
const admin = require('firebase-admin')
if (!admin.apps.length) {
  admin.initializeApp()
}
const { FieldValue, Timestamp } = require('firebase-admin/firestore')

// ── Health check (development/testing only) ──────────────────────────────────
// Simple onRequest function to verify deployment works.
// Can be called from the Firebase Console or via curl after deployment.
exports.healthCheck = onRequest((request, response) => {
  logger.info('Health check called', { structuredData: true })
  response.json({
    status: 'ok',
    region: 'africa-south1',
    timestamp: new Date().toISOString()
  })
})

// ── Phase 8: AI Conversation functions ────────────────────────────────────
exports.startConversation = onCall({ region: "africa-south1", secrets: [OPENAI_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required')
  }
  const uid = request.auth.uid
  const { userLevel, sessionNumber } = request.data

  // Subscription gate: session 2+ requires active subscription
  if (sessionNumber > 1) {
    const userSnap = await admin.firestore().doc(`users/${uid}`).get()
    if (!userSnap.exists || userSnap.data().subscriptionStatus !== 'active') {
      throw new HttpsError('permission-denied', 'Active subscription required for session 2+')
    }
  }

  // Instantiate inside handler — OPENAI_API_KEY.value() only works during invocation
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY.value() })

  const topicResponse = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.8,
    max_tokens: 200,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You generate English conversation topics. Always respond with valid JSON only.'
      },
      {
        role: 'user',
        content: `Generate a conversation topic for a ${userLevel} English learner (session #${sessionNumber}).

Level guide: A1-A2=daily life, B1-B2=opinions/travel/work, C1-C2=abstract/debates.

JSON format: {"topic": "specific topic", "openingQuestion": "friendly first question"}`
      }
    ]
  })

  const { topic, openingQuestion } = JSON.parse(topicResponse.choices[0].message.content)

  // Create session document in Firestore
  const sessionRef = await admin.firestore().collection('sessions').add({
    userId: uid,
    sessionNumber,
    topic,
    userLevel,
    transcript: [],
    mistakes: [],
    newVocabulary: [],
    aiModel: 'gpt-4o-mini',
    createdAt: FieldValue.serverTimestamp()
  })
  return {
    sessionId: sessionRef.id,
    topic,
    initialMessage: openingQuestion
  }
})

exports.sendMessage = onCall({ region: "africa-south1", secrets: [OPENAI_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required')
  }

  const { sessionId, userMessage, conversationHistory, userLevel, topic } = request.data

  if (!sessionId || !userMessage) {
    throw new HttpsError('invalid-argument', 'sessionId and userMessage are required')
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY.value() })

  const history = (conversationHistory || []).slice(-10)
  const chatMessages = [
    {
      role: 'system',
      content: `You are Alex, a friendly English conversation teacher. Level: ${userLevel}. Topic: ${topic || 'General'}.

Rules: Ask follow-up questions. Keep replies short (2-3 sentences). Don't correct mistakes mid-conversation — track them silently. Introduce 1-2 new words naturally.

Always respond with JSON: {"response":"your reply","mistakes":[{"type":"grammar","original":"wrong","correction":"right","explanation":"why"}],"newVocabulary":[{"word":"w","definition":"d","example":"e"}]}`
    }
  ]

  for (const msg of history) {
    chatMessages.push({
      role: msg.speaker === 'user' ? 'user' : 'assistant',
      content: msg.speaker === 'ai'
        ? JSON.stringify({ response: msg.text, mistakes: [], newVocabulary: [] })
        : msg.text
    })
  }
  chatMessages.push({ role: 'user', content: userMessage })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 512,
    response_format: { type: 'json_object' },
    messages: chatMessages
  })

  let parsed
  try {
    parsed = JSON.parse(completion.choices[0].message.content)
  } catch {
    parsed = {
      response: "That's interesting! Tell me more about that.",
      mistakes: [],
      newVocabulary: []
    }
  }

  // Append transcript entries and accumulate mistakes/vocabulary atomically
  const now = Date.now()
  await admin.firestore().doc(`sessions/${sessionId}`).update({
    transcript: FieldValue.arrayUnion(
      { speaker: 'user', text: userMessage, timestamp: now },
      { speaker: 'ai', text: parsed.response, timestamp: now + 1 }
    ),
    ...(parsed.mistakes?.length ? { mistakes: FieldValue.arrayUnion(...parsed.mistakes) } : {}),
    ...(parsed.newVocabulary?.length ? { newVocabulary: FieldValue.arrayUnion(...parsed.newVocabulary) } : {})
  })

  return {
    aiResponse: parsed.response,
    mistakes: parsed.mistakes || [],
    newVocabulary: parsed.newVocabulary || []
  }
})

// ── Phase 9: Session scoring ────────────────────────────────────────────────
exports.endSession = onCall({ region: 'africa-south1', secrets: [OPENAI_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required')
  }

  const uid = request.auth.uid
  const { sessionId, finalTranscript, durationSeconds } = request.data

  if (!sessionId) {
    throw new HttpsError('invalid-argument', 'sessionId is required')
  }

  // Validate session belongs to this user
  const sessionRef = admin.firestore().doc(`sessions/${sessionId}`)
  const sessionSnap = await sessionRef.get()
  if (!sessionSnap.exists) {
    throw new HttpsError('not-found', 'Session not found')
  }
  if (sessionSnap.data().userId !== uid) {
    throw new HttpsError('permission-denied', 'Session does not belong to user')
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY.value() })

  let parsed
  try {
    const scoringResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 512,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an English language assessment expert. Analyze transcripts and provide objective scores. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: `Score this conversation (0-100 each):

${JSON.stringify(finalTranscript)}

JSON format: {"scores":{"fluency":N,"grammar":N,"vocabulary":N,"overall":N},"feedback":{"pronunciationIssues":[],"grammarMistakes":[],"vocabularySuggestions":[]}}`
        }
      ]
    })
    parsed = JSON.parse(scoringResponse.choices[0].message.content)
  } catch (err) {
    logger.warn('endSession: OpenAI scoring failed, using fallback scores', err)
    parsed = {
      scores: { fluency: 70, grammar: 70, vocabulary: 70, overall: 70 },
      feedback: { pronunciationIssues: [], grammarMistakes: [], vocabularySuggestions: [] }
    }
  }

  const scores = parsed.scores
  const now = Timestamp.now()
  const durationMinutes = Math.round((durationSeconds ?? 0) / 60)
  // BUG FIX: store hours (not raw minutes) in totalHoursPracticed
  const durationHours = Math.round(((durationSeconds ?? 0) / 3600) * 100) / 100

  // Update user stats with rolling average (last 10 sessions window)
  const userSnap = await admin.firestore().doc(`users/${uid}`).get()
  const userData = userSnap.data() ?? {}
  const prevTotal = userData.totalSessionsCompleted ?? 0
  const newTotal = prevTotal + 1
  const newAvg = Math.round(
    ((userData.averageScore ?? 0) * Math.min(prevTotal, 9) + scores.overall)
    / Math.min(newTotal, 10)
  )
  // Streak uses calendar-day comparison in UTC+2 (Mozambique)
  // to avoid midnight-boundary issues when server runs in UTC.
  const MZT_OFFSET_MS = 2 * 60 * 60 * 1000
  const toMZTDay = ts => {
    const d = new Date(ts.getTime() + MZT_OFFSET_MS)
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
  }
  const today = new Date()
  const todayDay = toMZTDay(today)
  const prevDay  = toMZTDay(new Date(today.getTime() - 24 * 60 * 60 * 1000))
  const lastDate = userData.lastSessionDate?.toDate?.()
  const lastDay  = lastDate ? toMZTDay(lastDate) : null

  let newStreak
  if (!lastDay || lastDay < prevDay) {
    newStreak = 1                              // first session or streak broken
  } else if (lastDay === prevDay) {
    newStreak = (userData.dailyStreak ?? 0) + 1  // consecutive calendar day
  } else {
    newStreak = userData.dailyStreak ?? 1      // already played today — keep streak
  }

  // OPTIMIZATION: run all 3 Firestore writes in parallel
  const weekId = getWeekId()
  await Promise.all([
    sessionRef.update({
      scores,
      completedAt: now,
      durationSeconds: durationSeconds ?? 0
    }),
    admin.firestore().doc(`users/${uid}`).update({
      totalSessionsCompleted: FieldValue.increment(1),
      totalHoursPracticed: FieldValue.increment(durationHours),
      averageScore: newAvg,
      dailyStreak: newStreak,
      lastSessionDate: now,
      freeSessionUsed: true,
      updatedAt: now
    }),
    admin.firestore()
      .doc(`leaderboard/${weekId}/users/${uid}`)
      .set({
        displayName: userData.displayName ?? '',
        photoURL: userData.photoURL ?? '',
        weeklySessionTime: FieldValue.increment(durationMinutes),
        weeklySessionCount: FieldValue.increment(1),
        currentStreak: newStreak,
        lastUpdated: now
      }, { merge: true })
  ])

  logger.info('endSession complete', { uid, sessionId, scores })
  return { scores, feedback: parsed.feedback }
})

function getWeekId() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7)
  return `${now.getFullYear()}-${week.toString().padStart(2, '0')}`
}

// ── Phase 10: Payments and cron jobs ──────────────────────────────────────

// ── MozPayments helper ────────────────────────────────────────────────────
// NOTE: hostname and path are ASSUMED from TRD spec — no public MozPayments docs found.
// Replace api.mozpayments.co.mz and /v1/checkout when real endpoint is confirmed.
// plan: 'monthly' = 400 MZN/month, 'annual' = 3360 MZN/year (30% discount off 4800)
const PLAN_AMOUNTS = { monthly: 400, annual: 3360 }
const PLAN_IDS     = { monthly: 'monthly_unlimited', annual: 'annual_unlimited' }

function mozPaymentsCreateCheckout({ apiKey, userId, phoneNumber, paymentMethod, plan }) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      userId,
      phoneNumber,
      paymentMethod,
      plan: PLAN_IDS[plan] ?? PLAN_IDS.monthly,
      currency: 'MZN',
      amount: PLAN_AMOUNTS[plan] ?? PLAN_AMOUNTS.monthly,
      webhookUrl: `https://africa-south1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/handlePaymentWebhook`
    })
    const options = {
      hostname: 'api.mozpayments.co.mz',
      path: '/v1/checkout',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(new Error(`MozPayments parse error: ${e.message} — body: ${data}`)) }
      })
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

// ── createSubscription (onCall) ───────────────────────────────────────────
exports.createSubscription = onCall({ region: 'africa-south1', secrets: [MOZPAYMENTS_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required')
  }

  const uid = request.auth.uid
  const { phoneNumber = '', paymentMethod = 'mpesa', plan = 'monthly' } = request.data

  try {
    const response = await mozPaymentsCreateCheckout({
      apiKey: MOZPAYMENTS_API_KEY.value(),
      userId: uid,
      phoneNumber,
      paymentMethod,
      plan
    })

    // Write pending subscription doc — store externalSubscriptionId so webhook can reverse-lookup userId
    await admin.firestore().doc(`subscriptions/${uid}`).set({
      status: 'pending',
      plan: 'monthly_unlimited',
      paymentProvider: 'mozpayments',
      externalSubscriptionId: response.subscriptionId,
      priceId: '',
      startedAt: null,
      expiresAt: null,
      renewsAt: null,
      cancelledAt: null,
      paymentHistory: [],
      createdAt: FieldValue.serverTimestamp()
    })

    logger.info('createSubscription: pending subscription created', { uid, subscriptionId: response.subscriptionId })

    return {
      checkoutUrl: response.checkoutUrl,
      subscriptionId: response.subscriptionId,
      expiresIn: response.expiresIn ?? 900
    }
  } catch (err) {
    logger.error('createSubscription: failed', { uid, error: err.message })
    throw new HttpsError('internal', err.message)
  }
})

// ── verifyMozPaymentsSignature helper ─────────────────────────────────────
// rawBody is a Buffer in deployed Cloud Functions (Firebase PR #420 confirmed).
// Fallback to Buffer.from(JSON.stringify(req.body)) allows emulator testing
// but is NOT production-safe (JSON serialization may differ from raw bytes).
function verifyMozPaymentsSignature(req, secret) {
  const signature = req.headers['x-mozpayments-signature'] || ''
  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body))
  const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const sigBuf = Buffer.from(signature, 'utf8')
  const calcBuf = Buffer.from(computed, 'utf8')
  if (sigBuf.length !== calcBuf.length) return false
  return crypto.timingSafeEqual(sigBuf, calcBuf)
}

// ── handlePaymentWebhook (onRequest) ─────────────────────────────────────
exports.handlePaymentWebhook = onRequest({ region: 'africa-south1', secrets: [MOZPAYMENTS_API_KEY] }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed')
    return
  }

  if (!verifyMozPaymentsSignature(req, MOZPAYMENTS_API_KEY.value())) {
    logger.warn('handlePaymentWebhook: invalid signature')
    res.status(401).send('Invalid signature')
    return
  }

  const { event, subscriptionId, amount, phoneNumber, receiptId } = req.body
  logger.info('handlePaymentWebhook', { event, subscriptionId })

  try {
    if (event === 'payment.success') {
      // Reverse-lookup userId from externalSubscriptionId stored during createSubscription
      const subQuery = await admin.firestore()
        .collection('subscriptions')
        .where('externalSubscriptionId', '==', subscriptionId)
        .limit(1)
        .get()

      if (subQuery.empty) {
        logger.error('handlePaymentWebhook: subscription not found', { subscriptionId })
        // Return 200 to prevent MozPayments retry loop for unknown subscriptions
        res.status(200).json({ received: true })
        return
      }

      const subDoc = subQuery.docs[0]
      const userId = subDoc.id  // subscriptions collection is keyed by userId per TRD schema

      const now = Timestamp.now()
      const expiresAt = Timestamp.fromDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      )

      await Promise.all([
        subDoc.ref.update({
          status: 'active',
          expiresAt: expiresAt,
          paymentHistory: FieldValue.arrayUnion({
            amount: amount,
            currency: 'MZN',
            paymentMethod: 'mpesa',
            status: 'success',
            paidAt: now,
            receiptId: receiptId || ''
          })
        }),
        admin.firestore().doc(`users/${userId}`).update({
          subscriptionStatus: 'active',
          subscriptionExpiresAt: expiresAt,
          updatedAt: now
        })
      ])

      logger.info('handlePaymentWebhook: subscription activated', { userId, subscriptionId })
    }

    res.status(200).json({ received: true })
  } catch (err) {
    logger.error('handlePaymentWebhook: error', { error: err.message })
    res.status(500).send('Internal error')
  }
})

// ── Phase 10: Cron jobs ───────────────────────────────────────────────────

// ── deleteOldTranscripts (daily 02:00 UTC) ────────────────────────────────
// Removes the transcript field from sessions older than 30 days.
// Sessions retain scores, mistakes, newVocabulary, and all metadata.
// Processes in batches of 500 to respect the Firestore write-per-batch limit.
exports.deleteOldTranscripts = onSchedule(
  { schedule: '0 2 * * *', timeZone: 'UTC', region: 'africa-south1' },
  async (event) => {
    try {
      logger.info('deleteOldTranscripts: starting daily cleanup')

      const cutoff = Timestamp.fromDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      )

      const snap = await admin.firestore()
        .collection('sessions')
        .where('createdAt', '<', cutoff)
        .get()

      if (snap.empty) {
        logger.info('deleteOldTranscripts: no sessions to clean')
        return
      }

      const batchSize = 500
      const docs = snap.docs

      for (let i = 0; i < docs.length; i += batchSize) {
        const chunk = docs.slice(i, i + batchSize)
        const batch = admin.firestore().batch()
        let writeCount = 0
        for (const doc of chunk) {
          // Skip docs where transcript was already removed — avoids wasted writes
          if (doc.data().transcript === undefined) continue
          batch.update(doc.ref, { transcript: FieldValue.delete() })
          writeCount++
        }
        if (writeCount > 0) await batch.commit()
      }

      logger.info(`deleteOldTranscripts: cleaned ${snap.size} sessions`)
    } catch (err) {
      logger.error('deleteOldTranscripts: error', { error: err.message })
      throw err
    }
  }
)

// ── updateWeeklyLeaderboard (every Monday 00:00 UTC) ─────────────────────
// Archives the current week's top 100 leaderboard to leaderboard_archive/{weekId}
// with final ranks computed, then creates a placeholder doc for next week.
exports.updateWeeklyLeaderboard = onSchedule(
  { schedule: '0 0 * * 1', timeZone: 'UTC', region: 'africa-south1' },
  async (event) => {
    try {
      logger.info('updateWeeklyLeaderboard: starting weekly reset')

      const currentWeekId = getWeekId()

      const snap = await admin.firestore()
        .collection(`leaderboard/${currentWeekId}/users`)
        .orderBy('weeklySessionTime', 'desc')
        .limit(100)
        .get()

      if (snap.empty) {
        logger.info('updateWeeklyLeaderboard: no users to archive for', { currentWeekId })
        return
      }

      // Archive top 100 with final ranks
      const batchSize = 500
      const docs = snap.docs
      const archiveRef = admin.firestore().collection(`leaderboard_archive/${currentWeekId}/users`)

      for (let i = 0; i < docs.length; i += batchSize) {
        const chunk = docs.slice(i, i + batchSize)
        const batch = admin.firestore().batch()
        for (let j = 0; j < chunk.length; j++) {
          const userDoc = chunk[j]
          const rank = i + j + 1
          batch.set(archiveRef.doc(userDoc.id), {
            ...userDoc.data(),
            rank
          })
        }
        await batch.commit()
      }

      // Write archive week summary document
      await admin.firestore()
        .doc(`leaderboard_archive/${currentWeekId}`)
        .set(
          {
            weekId: currentWeekId,
            archivedAt: Timestamp.now(),
            totalParticipants: snap.size
          },
          { merge: true }
        )

      // Create placeholder for next week
      // Compute nextWeekId by duplicating getWeekId logic with a future date
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const futureStart = new Date(futureDate.getFullYear(), 0, 1)
      const futureWeek = Math.ceil(
        ((futureDate - futureStart) / 86400000 + futureStart.getDay() + 1) / 7
      )
      const nextWeekId = `${futureDate.getFullYear()}-${futureWeek.toString().padStart(2, '0')}`

      await admin.firestore()
        .doc(`leaderboard/${nextWeekId}`)
        .set({
          weekId: nextWeekId,
          createdAt: Timestamp.now(),
          totalParticipants: 0
        })

      logger.info(`updateWeeklyLeaderboard: archived ${snap.size} users for ${currentWeekId}`)
    } catch (err) {
      logger.error('updateWeeklyLeaderboard: error', { error: err.message })
      throw err
    }
  }
)

// ── Phase 13: Placement test question generation ──────────────────────────

// ── generateTestQuestions (onCall) ────────────────────────────────────────
// Generates AI-powered adaptive test questions for the placement test.
// Accepts { type, level, userProfile } and returns structured question payloads
// for VocabularyStage (type='vocabulary'), GrammarStage (type='grammar'), and ListeningStage (type='listening').
exports.generateTestQuestions = onCall({ region: 'africa-south1', secrets: [OPENAI_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required')
  }

  const { type, level = 'B1', userProfile = {} } = request.data

  if (!['vocabulary', 'grammar', 'listening'].includes(type)) {
    throw new HttpsError('invalid-argument', 'type must be vocabulary, grammar, or listening')
  }

  // Instantiate inside handler body — OPENAI_API_KEY.value() only resolves during invocation
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY.value() })

  let result
  if (type === 'vocabulary') {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an English language test generator. Always respond with valid JSON only. Generate questions appropriate for the CEFR level specified.'
        },
        {
          role: 'user',
          content: `Generate a vocabulary and reading comprehension test for CEFR level ${level}.
User context: ${JSON.stringify(userProfile)} — use topics relevant to the user's interests/occupation when possible.

Return JSON with exactly this structure:
{
  "type": "vocabulary",
  "level": "${level}",
  "questions": [
    {
      "id": "v1",
      "kind": "mcq",
      "sentence": "sentence with _______ for the target word",
      "options": ["option1", "option2", "option3", "option4"],
      "correctIndex": 0,
      "cefrLevel": "${level}"
    }
  ],
  "passage": {
    "text": "50-80 word paragraph",
    "questions": [
      {
        "id": "p1",
        "kind": "comprehension",
        "question": "question text",
        "options": ["A", "B", "C", "D"],
        "correctIndex": 0,
        "cefrLevel": "${level}"
      }
    ]
  }
}

Rules:
- Include exactly 6 vocabulary MCQ questions (id: v1..v6) — start at ${level} then vary by ±1 CEFR level
- Include exactly 1 passage with exactly 2 comprehension questions (id: p1, p2)
- Each MCQ must have exactly 4 options with exactly one correct answer
- options array must contain strings only, no null values
- correctIndex must be 0, 1, 2, or 3`
        }
      ]
    })

    try {
      result = JSON.parse(response.choices[0].message.content)
    } catch {
      throw new HttpsError('internal', 'Question generation failed — please retry')
    }
  } else if (type === 'grammar') {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an English language test generator. Always respond with valid JSON only. Generate questions appropriate for the CEFR level specified.'
        },
        {
          role: 'user',
          content: `Generate a grammar test for CEFR level ${level}.
User context: ${JSON.stringify(userProfile)} — use topics relevant to the user's interests/occupation when possible.

Return JSON with exactly this structure:
{
  "type": "grammar",
  "level": "${level}",
  "questions": [
    {
      "id": "g1",
      "kind": "error-spot",
      "sentence": "full sentence with ONE grammatical error",
      "errorWord": "the incorrect word or phrase",
      "correction": "the correct replacement",
      "explanation": "brief explanation of the rule",
      "cefrLevel": "${level}"
    },
    {
      "id": "g5",
      "kind": "sentence-completion",
      "stem": "sentence with _______ blank",
      "answer": "correct answer",
      "cefrLevel": "${level}"
    }
  ]
}

Rules:
- Include exactly 4 error-spot questions (id: g1..g4) — start at ${level}
- Include exactly 2 sentence-completion questions (id: g5..g6)
- error-spot: each sentence has exactly ONE error; errorWord must appear verbatim in sentence
- sentence-completion: stem must contain exactly one _______`
        }
      ]
    })

    try {
      result = JSON.parse(response.choices[0].message.content)
    } catch {
      throw new HttpsError('internal', 'Question generation failed — please retry')
    }
  } else {
    // type === 'listening'
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an English language test generator. Always respond with valid JSON only. Generate listening comprehension tasks appropriate for the CEFR level specified.'
        },
        {
          role: 'user',
          content: `Generate a listening comprehension test for CEFR level ${level}.
User context: ${JSON.stringify(userProfile)} — use topics relevant to the user's interests/occupation when possible.

Return JSON with exactly this structure:
{
  "type": "listening",
  "level": "${level}",
  "tasks": [
    {
      "id": "l1",
      "kind": "sentence",
      "prompt": "A single statement to listen to.",
      "question": "What did the speaker say?",
      "options": ["option1", "option2", "option3"],
      "correctIndex": 0,
      "cefrLevel": "${level}"
    },
    {
      "id": "l2",
      "kind": "dialogue",
      "prompt": "A manager tells her colleague she needs the budget report by Friday. Her colleague says he will have it ready by Thursday.",
      "question": "When will the report be ready?",
      "options": ["Friday", "Thursday", "Wednesday", "Next week"],
      "correctIndex": 1,
      "cefrLevel": "${level}"
    },
    {
      "id": "l3",
      "kind": "monologue",
      "prompt": "A short informational passage spoken aloud.",
      "question": "What is the main idea?",
      "options": ["option1", "option2", "option3", "option4"],
      "correctIndex": 0,
      "cefrLevel": "${level}"
    }
  ]
}

Rules:
- Include exactly 3 tasks: task 1 is kind "sentence" (simple statement), task 2 is kind "dialogue" (short exchange), task 3 is kind "monologue" (informational)
- IDs must be l1, l2, l3
- CRITICAL: Keep ALL prompt text under 140 characters. Browser TTS truncates long text on Android Chrome.
- For dialogue prompts, write as narrative ("A manager tells her team...") — do NOT use speaker labels with colons ("Sarah: ...")
- Each task has exactly 1 question with 3-4 options and exactly one correct answer
- correctIndex must be valid for the options array length
- Vary difficulty: task 1 at ${level}, task 2 at same or +1 CEFR, task 3 at same or +1 CEFR
- ${level === 'A1' || level === 'A2' ? 'Use simple everyday vocabulary and short sentences.' : level === 'B1' || level === 'B2' ? 'Use workplace and social vocabulary with compound sentences.' : 'Use academic or professional vocabulary with complex structures.'}`
        }
      ]
    })

    try {
      result = JSON.parse(response.choices[0].message.content)
    } catch {
      throw new HttpsError('internal', 'Question generation failed — please retry')
    }
  }

  logger.info('generateTestQuestions complete', { type, level, uid: request.auth.uid })
  return result
})

exports.evaluateSpeakingTest = onCall({ region: 'africa-south1', secrets: [OPENAI_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required')
  }

  const { exchanges = [], level = 'B1' } = request.data
  if (!Array.isArray(exchanges) || exchanges.length === 0) {
    throw new HttpsError('invalid-argument', 'exchanges must be a non-empty array')
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY.value() })

  const transcript = exchanges.map(e => `User: ${e.userText}\nAI: ${e.aiText}`).join('\n\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 400,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are an English language examiner. Evaluate the user\'s speaking transcript and return a JSON score object.'
      },
      {
        role: 'user',
        content: `Evaluate this CEFR ${level} placement speaking test transcript:\n\n${transcript}\n\nReturn JSON:\n{\n  "score": 75,\n  "level": "B1",\n  "fluency": 70,\n  "vocabulary": 80,\n  "grammar": 75,\n  "feedback": "Brief 1-2 sentence examiner note"\n}\n\nRules:\n- score 0-100 overall\n- level must be one of: A1, A2, B1, B2, C1, C2\n- fluency/vocabulary/grammar each 0-100\n- feedback max 120 characters`
      }
    ]
  })

  let result
  try {
    result = JSON.parse(response.choices[0].message.content)
  } catch {
    throw new HttpsError('internal', 'Speaking evaluation failed — please retry')
  }

  logger.info('evaluateSpeakingTest complete', { uid: request.auth.uid, score: result.score })
  return result
})

exports.calculatePlacement = onCall({ region: 'africa-south1', secrets: [OPENAI_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required')
  }

  const { stageResults = {}, userProfile = {} } = request.data

  // CEFR to numeric mapping
  const CEFR_VALUE = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 }
  const VALUE_CEFR = { 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2', 5: 'C1', 6: 'C2' }

  // Skill stages and their weights (equal 20% each)
  const SKILL_MAP = {
    vocabulary: { weight: 0.20, skill: 'Vocabulary' },
    listening:  { weight: 0.20, skill: 'Listening' },
    grammar:    { weight: 0.20, skill: 'Grammar' },
    speaking:   { weight: 0.20, skill: 'Speaking' },
    writing:    { weight: 0.20, skill: 'Writing' }
  }

  const skillBreakdown = {}
  let weightedSum = 0
  let totalWeight = 0

  for (const [key, cfg] of Object.entries(SKILL_MAP)) {
    const r = stageResults[key]
    const rawLevel = r?.level ?? 'B1'
    const numeric = CEFR_VALUE[rawLevel] ?? 3
    skillBreakdown[cfg.skill] = rawLevel
    weightedSum += numeric * cfg.weight
    totalWeight += cfg.weight
  }

  const avgNumeric = totalWeight > 0 ? weightedSum / totalWeight : 3
  const overallNumeric = Math.min(6, Math.max(1, Math.round(avgNumeric)))
  const overallLevel = VALUE_CEFR[overallNumeric] ?? 'B1'

  // Derive strengths (top 2) and weaknesses (bottom 2) from skill breakdown
  const sorted = Object.entries(skillBreakdown).sort(
    (a, b) => (CEFR_VALUE[b[1]] ?? 3) - (CEFR_VALUE[a[1]] ?? 3)
  )
  const strengths = sorted.slice(0, 2).map(([s]) => s)
  const weaknesses = sorted.slice(-2).map(([s]) => s)

  const LEVEL_NAMES = {
    A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate',
    B2: 'Upper Intermediate', C1: 'Advanced', C2: 'Proficient'
  }

  const result = {
    overallLevel,
    levelName: LEVEL_NAMES[overallLevel] ?? 'Intermediate',
    skillBreakdown,
    strengths,
    weaknesses,
    confidence: 0.85
  }

  // Persist finalResult to placementTests/{uid} and users/{uid}.placement
  const uid = request.auth.uid
  try {
    const { getFirestore } = require('firebase-admin/firestore')
    const adminDb = getFirestore()
    await adminDb.collection('placementTests').doc(uid).set(
      { finalResult: result, completedAt: new Date() },
      { merge: true }
    )
    await adminDb.collection('users').doc(uid).set(
      { placement: result },
      { merge: true }
    )
  } catch (err) {
    logger.error('calculatePlacement persist failed', { uid, err: err.message })
    // Don't throw — still return result to client even if persist fails
  }

  logger.info('calculatePlacement complete', { uid, overallLevel })
  return result
})

// ── Phase 16: Session plan generation ────────────────────────────────────

// ── generateSessionPlan (onCall) ──────────────────────────────────────────
// Builds a personalised session plan for a given session type.
// Takes { type, userProfile, skillGaps, sessionHistory } and returns
// { sessionId, topic, initialMessage, systemPrompt, role, context, objectives }.
// Creates the Firestore session doc (replaces startConversation).
exports.generateSessionPlan = onCall({ region: 'africa-south1', secrets: [OPENAI_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required')
  }

  const uid = request.auth.uid
  const { type, userProfile = {}, skillGaps = {}, sessionHistory = {} } = request.data

  // Validate session type
  const VALID_TYPES = ['free-talk', 'scenario', 'story-builder', 'debate']
  if (!VALID_TYPES.includes(type)) {
    throw new HttpsError('invalid-argument', `type must be one of: ${VALID_TYPES.join(', ')}`)
  }

  // ── CEFR gate (SESSION-07) ─────────────────────────────────────────────
  // Read user doc to get CEFR level (prefer placement.overallLevel, fallback to currentLevel, then 'B1')
  const userSnap = await admin.firestore().doc(`users/${uid}`).get()
  const userData = userSnap.exists ? userSnap.data() : {}
  const level = userData.placement?.overallLevel || userData.currentLevel || 'B1'

  const CEFR_VALUE = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 }

  if ((type === 'story-builder' || type === 'debate') && (CEFR_VALUE[level] ?? 3) < 3) {
    throw new HttpsError('permission-denied', `${type} requires B1 or higher`)
  }

  // ── Subscription gate ─────────────────────────────────────────────────
  const totalSessionsCompleted = userData.totalSessionsCompleted ?? 0
  const subscriptionStatus = userData.subscriptionStatus ?? 'none'
  if (totalSessionsCompleted >= 1 && subscriptionStatus !== 'active') {
    throw new HttpsError('permission-denied', 'Active subscription required for session 2+')
  }

  // ── System prompt builder (PRD §5.3 architecture) ─────────────────────
  const skills = skillGaps.skillBreakdown || {}

  // Part 1: Base persona
  const basePersona = `You are Alex, a friendly English conversation partner. You're having a natural conversation with a ${userProfile.occupation || 'person'} from Mozambique.`

  // Part 2: Session type rules (switch on type)
  let sessionTypeRules
  switch (type) {
    case 'free-talk':
      sessionTypeRules = 'SESSION TYPE: Free Talk — open conversation. Let the user guide the topic. Ask follow-up questions about their life, work, and interests. Keep it relaxed and natural.'
      break
    case 'scenario':
      sessionTypeRules = 'SESSION TYPE: Scenario — role-play.\nYOUR ROLE: [generated by GPT below]\nThe user must navigate this real-world situation using appropriate English.'
      break
    case 'story-builder':
      sessionTypeRules = 'SESSION TYPE: Story Builder — collaborative storytelling. Start a story with 2-3 sentences, then let the user continue. Take turns adding to the story. Gently guide toward using target grammar structures.'
      break
    case 'debate':
      sessionTypeRules = 'SESSION TYPE: Debate — you take the OPPOSING view on every topic. Challenge the user\'s arguments respectfully. Push them to justify their position with evidence and complex language structures.'
      break
  }

  // Part 3: User context
  const userContext = `USER'S LEVEL: ${level}\n- Vocabulary: ${skills.Vocabulary || level}\n- Grammar: ${skills.Grammar || level}\n- Speaking: ${skills.Speaking || level}\n\nUser's interests: ${(userProfile.interests || []).join(', ') || 'general topics'}\nUser's goal: ${userProfile.goal || 'improve English'}`

  // Part 4: Skill focus — derive from weaknesses (up to 3), fallback to generic
  const weaknesses = skillGaps.weaknesses || []
  const skillFocusItems = weaknesses.length > 0
    ? weaknesses.slice(0, 3).map(w => `- ${w}`)
    : ['- Natural conversation flow', '- Vocabulary expansion', '- Grammar accuracy']
  const skillFocus = `FOCUS THIS SESSION ON:\n${skillFocusItems.join('\n')}`

  // Part 5: Mistake recycling — only if recentMistakes is non-empty
  const recentMistakes = sessionHistory.recentMistakes || []
  const mistakeRecycling = recentMistakes.length > 0
    ? `RECYCLE THESE PAST MISTAKES:\n${recentMistakes.slice(0, 3).map(m => '- ' + m).join('\n')}`
    : null

  // Concatenate all parts
  const systemPromptParts = [basePersona, sessionTypeRules, userContext, skillFocus]
  if (mistakeRecycling) systemPromptParts.push(mistakeRecycling)
  const systemPrompt = systemPromptParts.join('\n\n')

  // ── GPT call for topic + opening message ──────────────────────────────
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY.value() })

  const userPrompt = `Generate a personalised ${type} session plan for a ${level} English learner.
User profile: ${JSON.stringify(userProfile)}
Skill gaps: ${JSON.stringify(skillGaps)}

Return JSON:
{
  "topic": "specific session topic/title",
  "role": "the user's role in this session (e.g., 'You are an employee explaining...')",
  "context": "1-2 sentence setting/situation description",
  "objectives": ["objective 1", "objective 2", "objective 3"],
  "openingMessage": "Alex's first message to start the conversation"
}

Rules:
- topic must be specific and relevant to user's occupation/interests
- For free-talk: role is just "yourself", context is casual
- For scenario: create a realistic workplace/life situation for a ${userProfile.occupation || 'professional'}
- For story-builder: role is "narrator", context sets the opening scene
- For debate: pick a topic the user would have opinions on based on their interests
- openingMessage should be warm, 2-3 sentences, and naturally start the session
- objectives must be 2-3 specific language goals for this session`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.8,
    max_tokens: 600,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You generate personalised English session plans. Always respond with valid JSON.' },
      { role: 'user', content: userPrompt }
    ]
  })

  // JSON parse with fallback
  let parsed
  try {
    parsed = JSON.parse(response.choices[0].message.content)
  } catch {
    parsed = {
      topic: `${type} practice session`,
      role: 'Yourself',
      context: 'A casual English practice conversation.',
      objectives: ['Practice natural conversation', 'Expand vocabulary', 'Improve fluency'],
      openingMessage: "Hi! I'm Alex, your conversation partner. What would you like to talk about today?"
    }
  }

  // ── Firestore session doc creation ────────────────────────────────────
  const sessionRef = await admin.firestore().collection('sessions').add({
    userId: uid,
    sessionType: type,
    topic: parsed.topic,
    userLevel: level,
    systemPrompt: systemPrompt,
    transcript: [],
    mistakes: [],
    newVocabulary: [],
    aiModel: 'gpt-4o-mini',
    createdAt: FieldValue.serverTimestamp()
  })

  logger.info('generateSessionPlan complete', { uid, type, level, sessionId: sessionRef.id })

  return {
    sessionId: sessionRef.id,
    topic: parsed.topic,
    initialMessage: parsed.openingMessage,
    systemPrompt: systemPrompt,
    role: parsed.role,
    context: parsed.context,
    objectives: parsed.objectives
  }
})
