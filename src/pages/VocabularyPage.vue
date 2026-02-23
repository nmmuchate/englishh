<template>
  <q-page class="vocab-page">

    <!-- Sticky header -->
    <div class="vocab-header q-px-md q-py-sm row items-center no-wrap">
      <div class="col">
        <span class="text-subtitle1 text-weight-bold">Vocabulary Bank</span>
      </div>
      <div class="row items-center justify-center header-icon-wrap">
        <q-icon name="sym_o_search" size="22px" class="text-grey-5" />
      </div>
    </div>

    <!-- Scrollable content -->
    <div class="q-px-md q-pb-xl">

      <!-- Stats row -->
      <div class="stats-row row items-center q-gutter-sm q-mt-md q-mb-lg">
        <div class="row items-center no-wrap">
          <q-icon name="sym_o_auto_stories" size="18px" color="primary" class="q-mr-xs" />
          <span class="text-body2 text-weight-bold text-primary">183 words learned</span>
        </div>
        <div class="level-badge q-px-sm q-py-xs">
          <span class="text-caption text-weight-bold text-primary">B1 Level</span>
        </div>
      </div>

      <!-- Word list -->
      <div class="column q-gutter-md q-pb-lg">
        <div
          v-for="word in vocabWords"
          :key="word.word"
          class="word-card q-pa-md"
        >
          <!-- Top row: word + difficulty badge -->
          <div class="row items-center justify-between no-wrap q-mb-xs">
            <div class="row items-center no-wrap q-gutter-sm">
              <span class="text-subtitle1 text-weight-bold word-name">{{ word.word }}</span>
              <span class="text-caption text-grey-5 phonetic">{{ word.phonetic }}</span>
            </div>
            <div
              class="difficulty-badge q-px-sm q-py-xs text-caption text-weight-bold"
              :class="`difficulty-badge--${word.difficulty}`"
            >
              {{ word.difficulty }}
            </div>
          </div>

          <!-- Part of speech badge -->
          <div class="q-mb-sm">
            <span
              class="pos-badge q-px-sm q-py-xs text-caption text-weight-bold"
              :class="`pos-badge--${word.pos}`"
            >
              {{ word.pos }}
            </span>
          </div>

          <!-- Definition -->
          <div class="text-body2 text-grey-5 q-mb-sm definition">{{ word.definition }}</div>

          <!-- Example sentence -->
          <div class="text-caption text-grey-6 example-sentence">"{{ word.example }}"</div>
        </div>
      </div>

    </div>

  </q-page>
</template>

<script setup>
// Mock vocabulary word list — 8 entries matching planning spec
const vocabWords = [
  {
    word: 'Eloquent',
    phonetic: '/ˈɛləkwənt/',
    pos: 'adj',
    definition: 'Fluent or persuasive in speaking or writing; clearly expressing ideas.',
    example: 'She gave an eloquent speech that moved the entire audience.',
    difficulty: 'B2',
  },
  {
    word: 'Ambience',
    phonetic: '/ˈæmbiəns/',
    pos: 'noun',
    definition: 'The character and atmosphere of a place.',
    example: 'The restaurant had a warm, cosy ambience perfect for a date.',
    difficulty: 'B1',
  },
  {
    word: 'Resilient',
    phonetic: '/rɪˈzɪliənt/',
    pos: 'adj',
    definition: 'Able to withstand or recover quickly from difficult conditions.',
    example: 'Children are often more resilient than we give them credit for.',
    difficulty: 'B1',
  },
  {
    word: 'Pragmatic',
    phonetic: '/præɡˈmætɪk/',
    pos: 'adj',
    definition: 'Dealing with things sensibly and realistically.',
    example: 'We need a pragmatic approach to solve this problem.',
    difficulty: 'B2',
  },
  {
    word: 'Profound',
    phonetic: '/prəˈfaʊnd/',
    pos: 'adj',
    definition: 'Very great or intense; having or showing great knowledge.',
    example: 'Reading that book had a profound effect on my worldview.',
    difficulty: 'B2',
  },
  {
    word: 'Articulate',
    phonetic: '/ɑːrˈtɪkjʊlɪt/',
    pos: 'adj',
    definition: 'Having or showing the ability to speak fluently and coherently.',
    example: 'She was articulate and confident during the job interview.',
    difficulty: 'B1',
  },
  {
    word: 'Tenacious',
    phonetic: '/tɪˈneɪʃəs/',
    pos: 'adj',
    definition: 'Tending to keep a firm hold; persistent; not easily discouraged.',
    example: 'His tenacious spirit helped him overcome every obstacle.',
    difficulty: 'B2',
  },
  {
    word: 'Candid',
    phonetic: '/ˈkændɪd/',
    pos: 'adj',
    definition: 'Truthful and straightforward; frank and open.',
    example: 'I appreciate your candid feedback — it helps me improve.',
    difficulty: 'A2',
  },
]
</script>

<style scoped>
/* ---- Page ---- */
.vocab-page {
  background: var(--bg-dark, #151d15);
  min-height: 100vh;
}

/* ---- Sticky header ---- */
.vocab-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg-dark, #151d15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.header-icon-wrap {
  width: 40px;
  height: 40px;
}

/* ---- Stats row ---- */
.stats-row {
  flex-wrap: wrap;
}

.level-badge {
  background: rgba(76, 174, 79, 0.12);
  border-radius: 9999px;
  border: 1px solid rgba(76, 174, 79, 0.25);
}

/* ---- Word card ---- */
.word-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.word-name {
  font-size: 18px;
}

.phonetic {
  font-size: 12px;
}

/* ---- Definition & example ---- */
.definition {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.example-sentence {
  font-style: italic;
  line-height: 1.4;
}

/* ---- Difficulty badges ---- */
.difficulty-badge {
  border-radius: 9999px;
  font-size: 10px;
  letter-spacing: 0.04em;
}

.difficulty-badge--A1 {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
}

.difficulty-badge--A2 {
  background: rgba(33, 150, 243, 0.15);
  color: #2196F3;
}

.difficulty-badge--B1 {
  background: rgba(255, 152, 0, 0.15);
  color: #FF9800;
}

.difficulty-badge--B2 {
  background: rgba(76, 174, 79, 0.15);
  color: #4cae4f;
}

/* ---- Part-of-speech badges ---- */
.pos-badge {
  border-radius: 6px;
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: lowercase;
}

.pos-badge--noun {
  background: rgba(33, 150, 243, 0.12);
  color: #64b5f6;
}

.pos-badge--verb {
  background: rgba(156, 39, 176, 0.12);
  color: #ce93d8;
}

.pos-badge--adj {
  background: rgba(76, 174, 79, 0.12);
  color: #81c784;
}

/* ---- Light mode overrides ---- */
.body--light .vocab-page {
  background: #f6f7f6;
}

.body--light .vocab-header {
  background: #f6f7f6;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.body--light .word-card {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
}

.body--light .difficulty-badge--A1 {
  background: rgba(0, 0, 0, 0.07);
  color: rgba(0, 0, 0, 0.5);
}
</style>
