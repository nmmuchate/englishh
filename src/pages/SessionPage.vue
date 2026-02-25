<template>
  <q-page class="session-page">

    <!-- Sticky Header (SESS-01) -->
    <div class="session-header">
      <div class="row items-center no-wrap q-px-md q-py-sm">
        <!-- Back arrow — decorative in session (no real back nav mid-session) -->
        <q-btn
          flat
          round
          dense
          icon="sym_o_arrow_back"
          class="header-icon-btn"
          @click="handleBack"
        />
        <!-- Center: subtitle + title -->
        <div class="col text-center">
          <div class="text-caption text-weight-bold text-grey-5 session-subtitle">ACTIVE SESSION</div>
          <div class="text-subtitle1 text-weight-bold">{{ session.topic || 'Starting...' }}</div>
        </div>
        <!-- Info icon — decorative -->
        <q-btn
          flat
          round
          dense
          icon="sym_o_info"
          class="header-icon-btn"
        />
      </div>
      <!-- Progress bar (SESS-01) -->
      <q-linear-progress :value="0.45" color="primary" track-color="grey-9" size="4px" />
    </div>

    <!-- Scrollable content -->
    <div class="session-scroll q-pb-xl">

      <!-- Timer pill (SESS-03) -->
      <div class="row justify-center q-pt-lg q-pb-sm">
        <div class="timer-pill row items-center no-wrap q-px-lg q-py-sm">
          <q-icon name="sym_o_timer" color="primary" size="20px" class="q-mr-sm" />
          <span class="text-h6 text-weight-bold timer-digits">{{ formattedTime }}</span>
        </div>
      </div>

      <!-- Mistake counter pill (SESS-04) -->
      <div class="row justify-center q-mb-md">
        <div class="mistake-pill row items-center no-wrap q-px-md q-py-xs">
          <q-icon name="sym_o_error_outline" size="14px" class="q-mr-xs" />
          <span class="text-caption text-weight-bold">{{ session.mistakeCount }} mistake{{ session.mistakeCount !== 1 ? 's' : '' }}</span>
        </div>
      </div>

      <!-- Live chat transcript (SESS-01) -->
      <div class="q-px-md chat-transcript">

        <div
          v-for="(msg, index) in session.transcript"
          :key="index"
          class="q-mb-lg"
          :class="msg.speaker === 'ai' ? 'chat-row chat-row--ai' : 'chat-row chat-row--user'"
        >
          <!-- AI avatar (only for ai messages) -->
          <div v-if="msg.speaker === 'ai'" class="ai-avatar">
            <q-icon name="sym_o_smart_toy" color="primary" size="18px" />
          </div>
          <!-- Bubble wrapper -->
          <div :class="msg.speaker === 'ai' ? 'chat-bubble-wrap' : 'chat-bubble-wrap chat-bubble-wrap--user'">
            <div class="text-caption text-weight-bold text-grey-5 q-mb-xs chat-sender" :class="{ 'text-right': msg.speaker === 'user' }">
              {{ msg.speaker === 'ai' ? 'ALEX (AI)' : 'YOU' }}
            </div>
            <div :class="msg.speaker === 'ai' ? 'chat-bubble chat-bubble--ai' : 'chat-bubble chat-bubble--user'">
              <span class="text-body2">{{ msg.text }}</span>
            </div>
          </div>
          <!-- User avatar (only for user messages) -->
          <div v-if="msg.speaker === 'user'" class="user-avatar">
            <q-icon name="sym_o_person" color="white" size="18px" />
          </div>
        </div>

        <!-- Interim text while speaking -->
        <div v-if="interimText" class="chat-row chat-row--user q-mb-lg">
          <div class="chat-bubble-wrap chat-bubble-wrap--user">
            <div class="text-caption text-weight-bold text-grey-5 q-mb-xs chat-sender text-right">YOU</div>
            <div class="chat-bubble chat-bubble--user" style="opacity: 0.6;">
              <span class="text-body2">{{ interimText }}...</span>
            </div>
          </div>
          <div class="user-avatar">
            <q-icon name="sym_o_person" color="white" size="18px" />
          </div>
        </div>

        <!-- Sending indicator -->
        <div v-if="session.isSending" class="chat-row chat-row--ai q-mb-lg">
          <div class="ai-avatar">
            <q-icon name="sym_o_smart_toy" color="primary" size="18px" />
          </div>
          <div class="chat-bubble-wrap">
            <div class="text-caption text-weight-bold text-grey-5 q-mb-xs chat-sender">ALEX (AI)</div>
            <div class="chat-bubble chat-bubble--ai">
              <span class="text-body2 text-grey-5">thinking...</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Fixed bottom footer (SESS-02) -->
    <div class="session-footer">
      <!-- Waveform bars (decorative) -->
      <div class="waveform-row row justify-center items-end q-mb-sm">
        <div class="waveform-bar" style="height: 8px;"></div>
        <div class="waveform-bar" style="height: 16px;"></div>
        <div class="waveform-bar" style="height: 24px;"></div>
        <div class="waveform-bar" style="height: 12px;"></div>
        <div class="waveform-bar" style="height: 20px;"></div>
        <div class="waveform-bar" style="height: 8px;"></div>
        <div class="waveform-bar" style="height: 16px;"></div>
        <div class="waveform-bar" style="height: 12px;"></div>
      </div>

      <!-- Text input fallback (CONV-02) -->
      <div v-if="showTextInput" class="q-px-md q-pb-sm row items-center gap-sm">
        <q-input
          v-model="textInput"
          dense
          outlined
          rounded
          placeholder="Type your message..."
          class="col text-input-field"
          :disable="session.isSending"
          @keyup.enter="sendUserMessage(textInput)"
        />
        <q-btn
          round
          unelevated
          color="primary"
          icon="sym_o_send"
          :disable="!textInput.trim() || session.isSending"
          @click="sendUserMessage(textInput)"
        />
      </div>

      <!-- Button row -->
      <div class="row items-center justify-between q-px-lg q-mb-xs">
        <!-- Keyboard/Mic toggle icon button (CONV-02) -->
        <q-btn
          flat
          round
          class="footer-side-btn"
          :icon="showTextInput ? 'sym_o_mic' : 'sym_o_keyboard'"
          @click="showTextInput = !showTextInput"
        />

        <!-- Mic FAB (SESS-02) — toggles active/inactive visual state -->
        <div class="mic-fab-wrap" :class="{ 'mic-fab-wrap--active': isMicActive }">
          <q-btn
            round
            unelevated
            :color="isMicActive ? 'primary' : 'primary'"
            icon="sym_o_mic"
            class="mic-fab"
            :class="{ 'mic-fab--active': isMicActive }"
            @click="toggleMic"
          />
        </div>

        <!-- Monitoring / stats button — opens end-session confirmation (SESS-05) -->
        <q-btn
          flat
          round
          class="footer-side-btn"
          icon="sym_o_monitoring"
          @click="confirmEndSession"
        />
      </div>

      <!-- Tap to speak caption -->
      <div class="text-center q-mb-sm">
        <span class="tap-caption">{{ isMicActive ? 'LISTENING...' : 'TAP TO SPEAK' }}</span>
      </div>

      <!-- End Session button -->
      <div class="q-px-md q-pb-md">
        <q-btn
          unelevated
          no-caps
          rounded
          color="negative"
          label="End Session"
          icon="sym_o_stop_circle"
          class="full-width"
          size="md"
          @click="confirmEndSession"
        />
      </div>
    </div>

    <!-- End session confirmation dialog (SESS-05) -->
    <q-dialog v-model="showEndDialog" persistent>
      <q-card class="end-dialog-card">
        <q-card-section class="text-center q-pt-lg">
          <q-icon name="sym_o_stop_circle" size="48px" color="negative" />
          <div class="text-h6 text-weight-bold q-mt-sm">End Session?</div>
          <div class="text-body2 text-grey-5 q-mt-xs">You've had a great session. Ready to see your feedback?</div>
        </q-card-section>
        <q-card-actions align="center" class="q-pb-lg q-px-lg column q-gutter-sm">
          <q-btn
            unelevated
            no-caps
            rounded
            color="primary"
            label="Yes, end session"
            class="full-width"
            @click="doEndSession"
          />
          <q-btn
            flat
            no-caps
            rounded
            color="grey-5"
            label="Keep going"
            class="full-width"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Paywall dialog (CONV-05) -->
    <PaywallDialog v-model="showPaywallDialog" />

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from 'src/stores/session'
import { useProfileStore } from 'src/stores/profile'
import PaywallDialog from 'src/components/PaywallDialog.vue'

const router = useRouter()
const session = useSessionStore()
const profile = useProfileStore()

// Speech API detection (CONV-01, CONV-02)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const speechAvailable = !!SpeechRecognition
let recognition = null

// Text input fallback state (CONV-02)
const showTextInput = ref(!speechAvailable)  // show immediately if no speech API
const textInput = ref('')
const interimText = ref('')   // shows live transcript while speaking

// Track whether we need to show paywall
const showPaywallDialog = ref(false)

// Mic toggle state (SESS-02)
const isMicActive = ref(false)

function toggleMic() {
  if (!speechAvailable) {
    showTextInput.value = !showTextInput.value
    return
  }
  if (isMicActive.value) {
    recognition.stop()
    isMicActive.value = false
  } else {
    recognition.start()
    isMicActive.value = true
  }
}

async function sendUserMessage(text) {
  if (!text || !text.trim() || session.isSending) return
  textInput.value = ''
  await session.sendMessage(text)
  // Scroll to bottom after AI response
  nextTick(() => {
    const el = document.querySelector('.session-scroll')
    if (el) el.scrollTop = el.scrollHeight
  })
}

// End session dialog (SESS-05)
const showEndDialog = ref(false)
function confirmEndSession() {
  showEndDialog.value = true
}
function doEndSession() {
  clearInterval(timerInterval)
  session.endSession(82)
  router.push({ name: 'feedback' })
}

// Back button — in active session just go back to dashboard
function handleBack() {
  clearInterval(timerInterval)
  session.endSession(null)
  router.push({ name: 'dashboard' })
}

// Live timer (SESS-03)
let timerInterval = null
const formattedTime = computed(() => {
  const m = Math.floor(session.durationSeconds / 60).toString().padStart(2, '0')
  const s = (session.durationSeconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

onMounted(async () => {
  // Set up Web Speech API if available (CONV-01)
  if (speechAvailable) {
    recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1]
      interimText.value = lastResult[0].transcript
      if (lastResult.isFinal) {
        isMicActive.value = false
        interimText.value = ''
        sendUserMessage(lastResult[0].transcript)
      }
    }
    recognition.onend = () => { isMicActive.value = false }
    recognition.onerror = (e) => { isMicActive.value = false; console.error('Speech error:', e.error) }
  }

  const result = await session.startSession()
  if (result?.paywallRequired) {
    showPaywallDialog.value = true
    return
  }
  timerInterval = setInterval(() => {
    session.durationSeconds++
  }, 1000)
})

onUnmounted(() => {
  clearInterval(timerInterval)
})
</script>

<style scoped>
/* ---- Page ---- */
.session-page {
  background: var(--bg-dark, #151d15);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ---- Header ---- */
.session-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(21, 29, 21, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.header-icon-btn {
  color: rgba(255, 255, 255, 0.75);
}

.session-subtitle {
  letter-spacing: 0.12em;
  font-size: 10px;
}

/* ---- Timer pill (SESS-03) ---- */
.timer-pill {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.timer-digits {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
}

/* ---- Mistake pill (SESS-04) ---- */
.mistake-pill {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 9999px;
  color: #ef4444;
}

/* ---- Scrollable area ---- */
.session-scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 260px; /* clear fixed footer */
}

/* ---- Chat transcript (SESS-01) ---- */
.chat-transcript {
  display: flex;
  flex-direction: column;
}

.chat-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  max-width: 85%;
}

.chat-row--ai {
  align-self: flex-start;
}

.chat-row--user {
  align-self: flex-end;
  flex-direction: row-reverse;
  max-width: 85%;
}

/* AI avatar circle */
.ai-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(76, 174, 79, 0.12);
  border: 2px solid rgba(76, 174, 79, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* User avatar circle */
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(76, 174, 79, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chat-bubble-wrap {
  display: flex;
  flex-direction: column;
}

.chat-bubble-wrap--user {
  align-items: flex-end;
}

.chat-sender {
  letter-spacing: 0.08em;
  font-size: 10px;
}

/* AI bubble: white bg, rounded-2xl rounded-bl-none */
.chat-bubble--ai {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px 16px 16px 4px;
  padding: 12px 16px;
  color: rgba(255, 255, 255, 0.92);
}

/* User bubble: primary green bg, rounded-2xl rounded-br-none */
.chat-bubble--user {
  background: var(--q-primary, #4cae4f);
  border-radius: 16px 16px 4px 16px;
  padding: 12px 16px;
  color: #ffffff;
}

/* Mistake underline in user bubble */
.mistake-underline {
  text-decoration: underline;
  text-decoration-color: #fca5a5;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}

/* Feedback tooltip (red tip below user message) */
.mistake-tip {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #fca5a5;
  font-size: 11px;
}

.tip-icon {
  color: #fca5a5;
  flex-shrink: 0;
}

/* ---- Fixed footer (SESS-02) ---- */
.session-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(21, 29, 21, 1) 70%, transparent);
  padding-top: 16px;
  z-index: 20;
}

/* Waveform bars */
.waveform-row {
  gap: 4px;
}

.waveform-bar {
  width: 3px;
  background: var(--q-primary, #4cae4f);
  border-radius: 2px;
  opacity: 0.6;
}

/* Footer side icon buttons */
.footer-side-btn {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
}

/* Mic FAB — 80px, primary green, glow ring */
.mic-fab-wrap {
  position: relative;
}

.mic-fab-wrap--active::before {
  content: '';
  position: absolute;
  inset: -12px;
  border-radius: 50%;
  background: rgba(76, 174, 79, 0.25);
  filter: blur(12px);
}

.mic-fab {
  width: 80px !important;
  height: 80px !important;
  font-size: 36px;
  box-shadow: 0 8px 24px rgba(76, 174, 79, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.mic-fab--active {
  transform: scale(1.05);
  box-shadow: 0 12px 32px rgba(76, 174, 79, 0.55);
}

/* Tap to speak caption */
.tap-caption {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.4);
}

/* ---- End session dialog ---- */
.end-dialog-card {
  background: #1e271e;
  border-radius: 16px;
  min-width: 300px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* ---- Light mode overrides ---- */
.body--light .session-page {
  background: #f6f7f6;
}

.body--light .session-header {
  background: rgba(246, 247, 246, 0.85);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.body--light .header-icon-btn {
  color: rgba(0, 0, 0, 0.6);
}

.body--light .timer-pill {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.1);
}

.body--light .chat-bubble--ai {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
  color: #131613;
}

.body--light .session-footer {
  background: linear-gradient(to top, #f6f7f6 70%, transparent);
}

.body--light .footer-side-btn {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.1);
  color: rgba(0, 0, 0, 0.5);
}

.body--light .end-dialog-card {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
}

.body--light .tap-caption {
  color: rgba(0, 0, 0, 0.35);
}
</style>
