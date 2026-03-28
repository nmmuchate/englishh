<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <div class="paywall-outer row items-end justify-center" @click.self="$emit('update:modelValue', false)">
      <div class="paywall-card">

        <!-- Header -->
        <div class="row items-center justify-between q-px-lg q-pt-lg q-pb-sm">
          <span class="text-h6 text-weight-bold">Upgrade to Pro</span>
          <q-btn
            flat
            round
            dense
            icon="sym_o_close"
            class="close-btn"
            @click="$emit('update:modelValue', false)"
          />
        </div>

        <!-- Hero illustration -->
        <div class="q-px-lg q-pb-sm">
          <div class="hero-gradient row items-center justify-center">
            <!-- Decorative background icon -->
            <div class="hero-bg-icon row items-center justify-center">
              <q-icon name="sym_o_forum" size="120px" class="text-primary" style="opacity: 0.2;" />
            </div>
            <!-- Center content -->
            <div class="hero-center column items-center q-gutter-xs">
              <div class="hero-icon-circle row items-center justify-center">
                <q-icon name="sym_o_auto_awesome" size="30px" color="primary" />
              </div>
              <span class="text-caption text-weight-bold text-primary" style="letter-spacing: 0.1em; text-transform: uppercase;">Master English Faster</span>
            </div>
          </div>
        </div>

        <!-- Headline -->
        <div class="text-center q-px-lg q-pt-md q-pb-sm">
          <div class="text-h5 text-weight-bold">Go Pro for Faster Growth</div>
        </div>

        <!-- Feature checklist -->
        <div class="q-px-lg q-py-sm">
          <div v-for="feature in features" :key="feature" class="row items-center no-wrap q-py-sm q-gutter-sm">
            <div class="check-circle row items-center justify-center flex-shrink-0">
              <q-icon name="sym_o_check" size="14px" color="primary" />
            </div>
            <span class="text-body2 text-weight-medium">{{ feature }}</span>
          </div>
        </div>

        <!-- Pricing options -->
        <div class="q-px-lg q-py-sm q-gutter-y-sm">
          <!-- Annual -->
          <div
            class="pricing-card cursor-pointer"
            :class="selectedPlan === 'annual' ? 'pricing-card--selected' : 'pricing-card--unselected'"
            @click="selectedPlan = 'annual'"
          >
            <div class="col">
              <div class="row items-center q-gutter-sm">
                <span class="text-weight-bold">3.360 MZN / ano</span>
                <span class="save-badge text-caption text-weight-bold">Save 30%</span>
              </div>
              <div class="text-caption text-primary text-weight-bold q-mt-xs">Best Value</div>
            </div>
            <q-radio
              :model-value="selectedPlan"
              val="annual"
              color="primary"
              @update:model-value="selectedPlan = 'annual'"
            />
          </div>

          <!-- Monthly -->
          <div
            class="pricing-card cursor-pointer"
            :class="selectedPlan === 'monthly' ? 'pricing-card--selected' : 'pricing-card--unselected'"
            @click="selectedPlan = 'monthly'"
          >
            <div class="col">
              <div class="text-weight-medium">400 MZN / mês</div>
              <div class="text-caption text-grey-6 q-mt-xs">Cobrado mensalmente</div>
            </div>
            <q-radio
              :model-value="selectedPlan"
              val="monthly"
              color="primary"
              @update:model-value="selectedPlan = 'monthly'"
            />
          </div>
        </div>

        <!-- Phone number input -->
        <div class="q-px-lg q-pt-sm q-pb-xs">
          <q-input
            v-model="phoneNumber"
            outlined
            dense
            color="primary"
            label="Phone number (M-Pesa / e-Mola)"
            placeholder="+258 8X XXX XXXX"
            class="phone-input"
            input-class="text-white"
          />
        </div>

        <!-- Subscribe button -->
        <div class="q-px-lg q-pt-md q-pb-sm">
          <q-btn
            unelevated
            no-caps
            rounded
            color="primary"
            label="Subscribe Now"
            class="full-width subscribe-btn"
            :loading="isSubscribing"
            :disable="isSubscribing"
            @click="handleSubscribe"
          />
          <div class="row justify-center q-gutter-md q-mt-md">
            <span class="text-caption text-grey-6 cursor-pointer link-text">RESTORE PURCHASE</span>
            <span class="text-caption text-grey-6 cursor-pointer link-text">TERMS OF SERVICE</span>
          </div>
        </div>

        <!-- iOS home indicator stub -->
        <div class="row justify-center q-pb-md">
          <div class="home-bar"></div>
        </div>

      </div>
    </div>
  </q-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { httpsCallable } from 'firebase/functions'
import { functions } from 'boot/firebase'

defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:modelValue'])

// Callable reference — created at module level (same pattern as session.js)
const createSubscriptionFn = httpsCallable(functions, 'createSubscription')

const selectedPlan = ref('annual')
const phoneNumber = ref('')
const isSubscribing = ref(false)

const features = [
  'Unlimited AI sessions',
  'Advanced Grammar Analysis',
  'Priority Support',
]

async function handleSubscribe() {
  if (isSubscribing.value) return
  isSubscribing.value = true
  try {
    const result = await createSubscriptionFn({
      plan: selectedPlan.value,
      paymentMethod: selectedPlan.value === 'monthly' ? 'mpesa' : 'emola',
      phoneNumber: phoneNumber.value
    })
    // Redirect to MozPayments hosted checkout page
    window.location.href = result.data.checkoutUrl
  } catch (err) {
    console.error('createSubscription failed:', err)
    // On error: keep dialog open, do NOT close it — user can retry
  } finally {
    isSubscribing.value = false
  }
}
</script>

<style scoped>
/* Full-screen overlay with bottom-sheet feel */
.paywall-outer {
  width: 100%;
  min-height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  align-items: flex-end;
}

/* Modal card */
.paywall-card {
  width: 100%;
  max-width: 400px;
  background: var(--bg-dark, #151d15);
  border-radius: 24px 24px 0 0;
  overflow: hidden;
}

/* Close button */
.close-btn {
  color: rgba(255, 255, 255, 0.7);
}

/* Hero gradient area */
.hero-gradient {
  background: linear-gradient(135deg, rgba(76, 174, 79, 0.2) 0%, rgba(76, 174, 79, 0.05) 100%);
  border-radius: 16px;
  min-height: 160px;
  position: relative;
  overflow: hidden;
}

.hero-bg-icon {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-center {
  position: relative;
  z-index: 1;
  text-align: center;
}

.hero-icon-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

/* Feature check circles */
.check-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(76, 174, 79, 0.12);
  flex-shrink: 0;
}

/* Pricing cards */
.pricing-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 16px;
  padding: 16px;
  transition: border-color 0.15s ease;
  background: rgba(255, 255, 255, 0.04);
}

.pricing-card--selected {
  border: 2px solid var(--q-primary, #4cae4f);
}

.pricing-card--unselected {
  border: 1px solid rgba(255, 255, 255, 0.15);
}

/* Orange "Save 30%" badge */
.save-badge {
  background: #FF9800;
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 10px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Subscribe button height */
.subscribe-btn {
  height: 56px;
  font-size: 16px;
  font-weight: 700;
}

/* Footer text links */
.link-text {
  font-size: 11px;
  letter-spacing: 0.05em;
}

/* Phone input */
:deep(.phone-input .q-field__control) {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
}

/* iOS home indicator */
.home-bar {
  width: 64px;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
}

/* Light mode overrides */
.body--light .paywall-card {
  background: #f6f7f6;
}

.body--light .close-btn {
  color: rgba(0, 0, 0, 0.6);
}

.body--light .pricing-card {
  background: #ffffff;
}

.body--light .pricing-card--unselected {
  border-color: rgba(0, 0, 0, 0.12);
}

.body--light .hero-icon-circle {
  background: #ffffff;
}

.body--light .home-bar {
  background: rgba(0, 0, 0, 0.12);
}
</style>
