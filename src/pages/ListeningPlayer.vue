<template>
  <div class="listening-player column items-center q-gutter-sm">
    <!-- TTS unavailable fallback -->
    <template v-if="!ttsAvailable">
      <q-banner class="bg-orange-1 text-orange-9 full-width q-mb-sm" rounded>
        Audio playback is not available in this browser.
      </q-banner>
    </template>

    <!-- Play / Replay button -->
    <q-btn
      v-if="ttsAvailable"
      :icon="isPlaying ? 'volume_up' : 'play_circle'"
      :label="playLabel"
      :color="isPlaying ? 'grey' : 'primary'"
      :disable="isPlaying || (!canPlay && !canReplay)"
      unelevated
      rounded
      no-caps
      size="lg"
      class="listening-play-btn"
      @click="play"
    />

    <!-- Replay count hint -->
    <span v-if="playCount > 0 && ttsAvailable" class="text-caption text-grey-5">
      {{ playCount > maxReplays ? 'No replays remaining' : `${maxReplays - playCount + 1} play(s) remaining` }}
    </span>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  text: { type: String, required: true },
  maxReplays: { type: Number, default: 1 },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['played', 'ended'])

const isPlaying = ref(false)
const playCount = ref(0)
const ttsAvailable = ref(true)

const canPlay = computed(() => !isPlaying.value && playCount.value === 0 && ttsAvailable.value && !props.disabled)
const canReplay = computed(() => !isPlaying.value && playCount.value > 0 && playCount.value <= props.maxReplays && ttsAvailable.value && !props.disabled)
const playLabel = computed(() => isPlaying.value ? 'Playing...' : playCount.value === 0 ? 'Play Audio' : 'Replay')

function play () {
  if (isPlaying.value || props.disabled) return
  if (playCount.value > props.maxReplays) return

  window.speechSynthesis.cancel() // clear any in-progress utterance (Pitfall 1 prevention)

  const utterance = new SpeechSynthesisUtterance(props.text)
  utterance.lang = 'en-US'
  utterance.rate = 0.9 // slightly slower for comprehension
  utterance.onstart = () => { isPlaying.value = true }
  utterance.onend = () => { isPlaying.value = false; playCount.value++; emit('ended') }
  utterance.onerror = () => { isPlaying.value = false } // Pitfall 1 safety

  window.speechSynthesis.speak(utterance)
  emit('played')
}

onMounted(() => {
  ttsAvailable.value = 'speechSynthesis' in window
})

onUnmounted(() => {
  window.speechSynthesis.cancel() // Pitfall 3 prevention — cancel on unmount to avoid audio bleed
})

watch(() => props.text, () => {
  playCount.value = 0
  window.speechSynthesis.cancel()
})
</script>

<style scoped>
.listening-player {
  padding: 16px 0;
}
.listening-play-btn {
  min-width: 200px;
}
</style>
