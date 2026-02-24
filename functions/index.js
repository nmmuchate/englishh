/**
 * SpeakAI Cloud Functions
 * Region: africa-south1 (matches Firestore database location)
 *
 * Phase 6 scaffold: Sets up global options, secret declarations, and admin SDK init.
 * Active function implementations are added in Phases 8, 9, and 10.
 */

const { setGlobalOptions }  = require('firebase-functions')
const { defineSecret }      = require('firebase-functions/params')
const { onRequest }         = require('firebase-functions/https')
const logger                = require('firebase-functions/logger')

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
const GEMINI_API_KEY      = defineSecret('GEMINI_API_KEY')
const MOZPAYMENTS_API_KEY = defineSecret('MOZPAYMENTS_API_KEY')

// ── Firebase Admin SDK ───────────────────────────────────────────────────────
// Admin SDK is initialized once here. Import admin elsewhere with:
//   const admin = require('firebase-admin')
// (Admin SDK auto-detects credentials in Cloud Functions environment)
const admin = require('firebase-admin')
if (!admin.apps.length) {
  admin.initializeApp()
}

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

// ── Phase 8: AI Conversation functions (added in Phase 8) ──────────────────
// exports.startConversation = onCall({ secrets: [GEMINI_API_KEY] }, async (request) => { ... })
// exports.sendMessage       = onCall({ secrets: [GEMINI_API_KEY] }, async (request) => { ... })

// ── Phase 9: Session scoring (added in Phase 9) ────────────────────────────
// exports.endSession = onCall({ secrets: [GEMINI_API_KEY] }, async (request) => { ... })

// ── Phase 10: Payments and cron jobs (added in Phase 10) ──────────────────
// exports.createSubscription    = onCall({ secrets: [MOZPAYMENTS_API_KEY] }, async (req) => { ... })
// exports.handlePaymentWebhook  = onRequest({ secrets: [MOZPAYMENTS_API_KEY] }, (req, res) => { ... })
// exports.deleteOldTranscripts  = onSchedule('every 24 hours', async () => { ... })
// exports.updateWeeklyLeaderboard = onSchedule('every monday 00:00', async () => { ... })
