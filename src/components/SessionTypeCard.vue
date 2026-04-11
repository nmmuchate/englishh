<template>
  <div
    class="session-type-card-wrapper"
    :class="{ 'session-type-card--locked': locked }"
    role="button"
    tabindex="0"
    :aria-disabled="locked ? 'true' : undefined"
    :aria-label="locked ? `${name} — locked, available at B1` : name"
    @click="handleClick"
    @keyup.enter="handleClick"
  >
    <q-card flat class="session-type-card q-pa-md" :class="{ 'session-type-card--unlocked': !locked }">
      <!-- Lock icon overlay for locked cards -->
      <q-icon
        v-if="locked"
        name="lock"
        size="20px"
        color="grey-6"
        class="lock-overlay"
      />

      <q-icon :name="icon" size="28px" :color="locked ? 'grey-6' : 'primary'" class="q-mb-xs" />
      <p class="text-subtitle1 text-weight-bold q-mb-xs q-mt-xs" style="margin: 0;">{{ name }}</p>
      <p class="text-body2 text-grey-6 q-mb-sm card-description" style="margin: 0;">{{ description }}</p>

      <div v-if="locked" class="q-mt-xs">
        <p class="text-caption text-grey-5" style="margin: 0;">Available at B1</p>
      </div>
      <div v-else>
        <q-chip dense color="primary" text-color="white" size="sm">{{ duration }}</q-chip>
      </div>
    </q-card>
  </div>
</template>

<script setup>
const props = defineProps({
  type: { type: String, required: true },
  icon: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: String, required: true },
  locked: { type: Boolean, default: false }
})

const emit = defineEmits(['select'])

function handleClick() {
  if (!props.locked) {
    emit('select', props.type)
  }
}
</script>

<style scoped>
.session-type-card-wrapper {
  cursor: pointer;
  position: relative;
}

.session-type-card--locked {
  opacity: 0.5;
}

.session-type-card {
  position: relative;
  border-radius: 16px;
  min-height: 88px;
  border: 2px solid transparent;
}

.session-type-card--unlocked .session-type-card {
  border: 2px solid var(--q-primary);
}

.lock-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
}

.card-description {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
