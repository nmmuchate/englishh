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
const { GoogleGenAI } = require('@google/genai')
const https = require('https')
const crypto = require('crypto')

// All functions run in africa-south1 to minimize latency to the Firestore database.
// maxInstances: 10 prevents runaway scaling costs.
setGlobalOptions({ maxInstances: 10, region: 'africa-south1' })

// ── Secret declarations ──────────────────────────────────────────────────────
// Secrets are stored in Firebase Secret Manager (not .env files).
// Set values via Firebase CLI:
//   firebase functions:secrets:set GEMINI_API_KEY
//   firebase functions:secrets:set MOZPAYMENTS_API_KEY
//
// Access inside a function: GEMINI_API_KEY.value()
// Functions that use a secret must declare it in their options: { secrets: [GEMINI_API_KEY] }
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY')
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
exports.startConversation = onCall({ region: "africa-south1", secrets: [GEMINI_API_KEY] }, async (request) => {
  // Auth gate
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

  // Gemini topic assignment
  // Instantiate inside handler — GEMINI_API_KEY.value() only works during invocation
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() })

  const topicPrompt = `Generate an engaging conversation topic for a ${userLevel} English learner.

LEVEL GUIDELINES:
- A1-A2 (Beginner): Daily routines, family, hobbies, food, weather
- B1-B2 (Intermediate): Work, travel experiences, opinions on current events, hypothetical scenarios
- C1-C2 (Advanced): Abstract concepts, debates, professional discussions, cultural analysis

SESSION NUMBER: ${sessionNumber}

OUTPUT (JSON only):
{"topic": "Clear specific topic statement", "openingQuestion": "Friendly first question to start conversation"}`

  const topicResult = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: topicPrompt,
    config: { responseMimeType: 'application/json' }
  })
  const { topic, openingQuestion } = JSON.parse(topicResult.text)

  // Create session document in Firestore
  const sessionRef = await admin.firestore().collection('sessions').add({
    userId: uid,
    sessionNumber: sessionNumber,
    topic: topic,
    userLevel: userLevel,
    transcript: [],
    mistakes: [],
    newVocabulary: [],
    aiModel: 'gemini-1.5-flash',
    createdAt: FieldValue.serverTimestamp()
  })
  console.log("Created session:", sessionRef.id)
  return {
    sessionId: sessionRef.id,
    topic: topic,
    initialMessage: openingQuestion
  }
})

exports.sendMessage = onCall({ region: "africa-south1", secrets: [GEMINI_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required')
  }

  const { sessionId, userMessage, conversationHistory, userLevel, topic } = request.data

  // Validate session exists
  const sessionSnap = await admin.firestore().doc(`sessions/${sessionId}`).get()
  if (!sessionSnap.exists) {
    throw new HttpsError('not-found', 'Session not found')
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() })

  // Build conversation prompt from TRD template
  const history = (conversationHistory || []).slice(-10)
  const systemPrompt = `You are an encouraging English conversation teacher named Alex. You are having a 5-10 minute spoken conversation with a ${userLevel} English learner.

TOPIC: ${topic || 'General English conversation'}

RULES:
1. Ask engaging follow-up questions about the topic
2. Respond naturally to their answers like a friend would
3. Adapt vocabulary to ${userLevel} level
4. If they make a grammar mistake, continue naturally - do NOT correct mid-conversation
5. Track mistakes silently and include them in response metadata
6. Introduce 1-2 new useful words during conversation when natural
7. Keep responses short (2-3 sentences) to encourage more speaking
8. Be warm, patient, and positive

OUTPUT FORMAT (JSON only, no markdown):
{
  "response": "Your conversational reply here",
  "mistakes": [
    {
      "type": "grammar",
      "original": "what user said incorrectly",
      "correction": "correct version",
      "explanation": "brief explanation"
    }
  ],
  "newVocabulary": [
    {
      "word": "word",
      "definition": "definition",
      "example": "example sentence"
    }
  ]
}

CONVERSATION HISTORY:
${JSON.stringify(history)}

USER'S LATEST MESSAGE: "${userMessage}"

Your response (JSON only):`

  const result = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: systemPrompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  })

  let parsed
  try {
    parsed = JSON.parse(result.text)
  } catch {
    // Fallback if parsing fails (should not happen with responseMimeType: json)
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
exports.endSession = onCall({ region: 'africa-south1', secrets: [GEMINI_API_KEY] }, async (request) => {
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

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() })

  const scoringPrompt = `You are an English language assessment expert. Analyze this conversation transcript and provide objective scores.

TRANSCRIPT:
${JSON.stringify(finalTranscript)}

Score each dimension 0-100 based on:
- fluency: Flow, pace, natural expression, lack of hesitation
- grammar: Correctness of grammar, verb tenses, articles, prepositions
- vocabulary: Range of words used, appropriate complexity for topic
- overall: Weighted average (fluency 30%, grammar 40%, vocabulary 30%)

OUTPUT (JSON only, no markdown):
{
  "scores": {
    "fluency": number,
    "grammar": number,
    "vocabulary": number,
    "overall": number
  },
  "feedback": {
    "pronunciationIssues": [],
    "grammarMistakes": [],
    "vocabularySuggestions": []
  }
}`

  let parsed
  try {
    const result = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: scoringPrompt,
      config: { responseMimeType: 'application/json' }
    })
    parsed = JSON.parse(result.text)
  } catch (err) {
    logger.warn('endSession: Gemini parse failed, using fallback scores', err)
    parsed = {
      scores: { fluency: 70, grammar: 70, vocabulary: 70, overall: 70 },
      feedback: { pronunciationIssues: [], grammarMistakes: [], vocabularySuggestions: [] }
    }
  }

  const scores = parsed.scores
  const now = Timestamp.now()
  const durationMinutes = Math.round((durationSeconds ?? 0) / 60)

  // Update session document with scores + completedAt + durationSeconds
  await sessionRef.update({
    scores: scores,
    completedAt: now,
    durationSeconds: durationSeconds ?? 0
  })

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

  await admin.firestore().doc(`users/${uid}`).update({
    totalSessionsCompleted: FieldValue.increment(1),
    totalMinutesPracticed: FieldValue.increment(durationMinutes),
    averageScore: newAvg,
    dailyStreak: newStreak,
    lastSessionDate: now,
    freeSessionUsed: true,
    updatedAt: now
  })

  // Update leaderboard entry for current week
  const weekId = getWeekId()
  await admin.firestore()
    .doc(`leaderboard/${weekId}/users/${uid}`)
    .set({
      displayName: userData.displayName ?? '',
      photoURL: userData.photoURL ?? '',
      weeklySessionTime: FieldValue.increment(durationMinutes),
      weeklySessionCount: FieldValue.increment(1),
      currentStreak: newStreak,
      lastUpdated: now
    }, { merge: true })

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
