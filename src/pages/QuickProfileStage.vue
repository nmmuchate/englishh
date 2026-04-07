<template>
  <div class="quick-profile-stage column full-width">

    <!-- ────────── Sub-step 1: What do you do? ────────── -->
    <div v-if="profileSubStep === 1">
      <h2 class="text-h5 text-weight-bold q-mb-md">What do you do?</h2>
      <p class="text-body2 text-grey-7 q-mb-lg">This helps us personalise your sessions.</p>

      <div class="row q-gutter-sm q-mb-lg">
        <q-btn
          v-for="opt in occupationOptions"
          :key="opt.value"
          :label="opt.label"
          :color="occupation === opt.value ? 'primary' : 'grey-3'"
          :text-color="occupation === opt.value ? 'white' : 'grey-8'"
          unelevated
          no-caps
          rounded
          class="q-mb-sm"
          @click="occupation = opt.value"
        />
      </div>

      <div v-if="occupation === 'professional'" class="q-mt-md">
        <h3 class="text-subtitle1 text-weight-semibold q-mb-sm">What field?</h3>
        <div class="row q-gutter-sm q-mb-lg">
          <q-btn
            v-for="opt in fieldOptions"
            :key="opt.value"
            :label="opt.label"
            :color="occupationField === opt.value ? 'primary' : 'grey-3'"
            :text-color="occupationField === opt.value ? 'white' : 'grey-8'"
            unelevated
            no-caps
            rounded
            class="q-mb-sm"
            @click="occupationField = opt.value"
          />
        </div>
      </div>
    </div>

    <!-- ────────── Sub-step 2: What are your interests? ────────── -->
    <div v-if="profileSubStep === 2">
      <h2 class="text-h5 text-weight-bold q-mb-md">What are your interests?</h2>
      <p class="text-body2 text-grey-7 q-mb-lg">Pick up to 3.</p>

      <div class="row q-gutter-sm q-mb-md">
        <q-btn
          v-for="interest in interestOptions"
          :key="interest"
          :label="interest"
          :color="interests.includes(interest) ? 'primary' : 'grey-3'"
          :text-color="interests.includes(interest) ? 'white' : 'grey-8'"
          unelevated
          no-caps
          rounded
          :disable="!interests.includes(interest) && interests.length >= 3"
          @click="toggleInterest(interest)"
        />
      </div>

      <q-input
        v-if="interests.includes('Other')"
        v-model="otherInterest"
        outlined
        dense
        label="Tell us what else interests you"
        maxlength="60"
        class="q-mb-md"
      />

      <p class="text-caption text-grey-6">{{ interests.length }} / 3 selected</p>
    </div>

    <!-- ────────── Sub-step 3: Why are you learning English? ────────── -->
    <div v-if="profileSubStep === 3">
      <h2 class="text-h5 text-weight-bold q-mb-md">Why are you learning English?</h2>

      <q-item
        v-for="option in goalOptions"
        :key="option.value"
        tag="label"
        clickable
        class="option-card q-mb-md"
        :class="{ 'option-card--selected': goal === option.value }"
      >
        <q-item-section>
          <q-item-label class="text-weight-semibold">{{ option.label }}</q-item-label>
          <q-item-label caption>{{ option.description }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-radio v-model="goal" :val="option.value" color="primary" />
        </q-item-section>
      </q-item>
    </div>

    <!-- ────────── Sub-step 4: Have you studied English before? ────────── -->
    <div v-if="profileSubStep === 4">
      <h2 class="text-h5 text-weight-bold q-mb-md">Have you studied English before?</h2>

      <q-item
        v-for="option in priorExperienceOptions"
        :key="option.value"
        tag="label"
        clickable
        class="option-card q-mb-md"
        :class="{ 'option-card--selected': priorExperience === option.value }"
      >
        <q-item-section>
          <q-item-label class="text-weight-semibold">{{ option.label }}</q-item-label>
          <q-item-label caption>{{ option.description }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-radio v-model="priorExperience" :val="option.value" color="primary" />
        </q-item-section>
      </q-item>
    </div>

    <!-- ────────── Footer (all sub-steps) ────────── -->
    <div class="row q-mt-xl q-gutter-sm">
      <q-btn
        v-if="profileSubStep > 1"
        flat
        no-caps
        icon="arrow_back"
        label="Back"
        color="grey-7"
        @click="handleBack"
      />
      <q-space />
      <q-btn
        unelevated
        no-caps
        rounded
        color="primary"
        label="Continue"
        :disable="!canContinue"
        @click="handleContinue"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const emit = defineEmits(['complete', 'back'])

// Sub-step state
const profileSubStep = ref(1) // 1..4

// Form fields
const occupation      = ref(null) // 'student' | 'professional' | 'entrepreneur' | 'other'
const occupationField = ref(null) // 'engineering' | 'health' | 'business' | 'education' | 'tech' | 'other' | null
const interests       = ref([])   // string[], max 3 (may include 'Other')
const otherInterest   = ref('')   // free text when 'Other' chip selected
const goal            = ref(null) // 'work' | 'travel' | 'education' | 'personal_growth' | 'immigration' | 'fun'
const priorExperience = ref(null) // 'never' | 'school' | 'years' | 'daily'

// Option lists (per D-02 + PRD §2.2)
const occupationOptions = [
  { value: 'student',      label: 'Student' },
  { value: 'professional', label: 'Professional' },
  { value: 'entrepreneur', label: 'Entrepreneur' },
  { value: 'other',        label: 'Other' }
]

const fieldOptions = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'health',      label: 'Health' },
  { value: 'business',    label: 'Business' },
  { value: 'education',   label: 'Education' },
  { value: 'tech',        label: 'Tech' },
  { value: 'other',       label: 'Other' }
]

// D-02: 12 fixed interests + 13th 'Other' free-text chip
const interestOptions = [
  'Travel', 'Music', 'Sports', 'Cooking', 'Technology', 'Movies/TV',
  'Reading', 'Gaming', 'Business', 'Health/Fitness', 'Art', 'Nature',
  'Other'
]

const goalOptions = [
  { value: 'work',            label: 'Work',            description: 'Advance my career' },
  { value: 'travel',          label: 'Travel',          description: 'Communicate while traveling' },
  { value: 'education',       label: 'Education',       description: 'Study or take exams' },
  { value: 'personal_growth', label: 'Personal Growth', description: 'Improve myself' },
  { value: 'immigration',     label: 'Immigration',     description: 'Move to an English-speaking country' },
  { value: 'fun',             label: 'Fun',             description: 'Enjoy media and culture' }
]

const priorExperienceOptions = [
  { value: 'never',  label: 'Never',                              description: 'I am a complete beginner' },
  { value: 'school', label: 'A little in school',                 description: 'Basic classroom exposure' },
  { value: 'years',  label: 'Several years',                      description: 'Studied formally for years' },
  { value: 'daily',  label: 'I use it daily but want to improve', description: 'Already conversational' }
]

// Pitfall 1: clear field when switching away from professional
watch(occupation, (val) => {
  if (val !== 'professional') occupationField.value = null
})

// Clear otherInterest free text when 'Other' is deselected
watch(interests, (val) => {
  if (!val.includes('Other')) otherInterest.value = ''
}, { deep: true })

// Pitfall 3: toggleInterest must always allow deselection
function toggleInterest(interest) {
  const idx = interests.value.indexOf(interest)
  if (idx !== -1) {
    interests.value.splice(idx, 1)
  } else if (interests.value.length < 3) {
    interests.value.push(interest)
  }
}

// Pitfall 2: gate Continue button per sub-step
const canContinue = computed(() => {
  if (profileSubStep.value === 1) {
    if (!occupation.value) return false
    if (occupation.value === 'professional' && !occupationField.value) return false
    return true
  }
  if (profileSubStep.value === 2) {
    if (interests.value.length < 1) return false
    // If 'Other' is chosen, free-text must not be empty
    if (interests.value.includes('Other') && !otherInterest.value.trim()) return false
    return true
  }
  if (profileSubStep.value === 3) return !!goal.value
  if (profileSubStep.value === 4) return !!priorExperience.value
  return false
})

function handleContinue() {
  if (!canContinue.value) return
  if (profileSubStep.value < 4) {
    profileSubStep.value++
  } else {
    emit('complete', {
      occupation: occupation.value,
      field: occupationField.value,
      interests: [...interests.value],
      otherInterest: interests.value.includes('Other') ? otherInterest.value.trim() : '',
      goal: goal.value,
      priorExperience: priorExperience.value
    })
  }
}

function handleBack() {
  if (profileSubStep.value > 1) {
    profileSubStep.value--
  } else {
    emit('back')
  }
}
</script>

<style scoped>
.quick-profile-stage {
  padding: 24px 16px;
}

.option-card {
  border: 2px solid var(--q-grey-3, #e0e0e0);
  border-radius: var(--radius-md, 12px);
  padding: 16px;
  background: var(--card-bg, white);
  transition: all 0.2s ease;
}

.option-card--selected {
  border-color: var(--q-primary);
  background: rgba(76, 174, 79, 0.08);
}

.option-card:hover {
  border-color: var(--q-primary);
}
</style>
