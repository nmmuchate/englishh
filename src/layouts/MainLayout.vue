<template>
  <q-layout view="hHh lpr fFf">
    <q-page-container class="app-container">
      <router-view />
    </q-page-container>

    <q-footer>
      <q-tabs
        active-color="primary"
        indicator-color="transparent"
        align="justify"
        dense
      >
        <q-route-tab
          :to="{ name: 'dashboard' }"
          icon="sym_o_home"
          label="Home"
          no-caps
          exact
        />
        <q-route-tab
          :to="{ name: 'progress' }"
          icon="sym_o_bar_chart"
          label="Progress"
          no-caps
          exact
        />
        <q-route-tab
          :to="{ name: 'profile' }"
          icon="sym_o_person"
          label="Profile"
          no-caps
          exact
        />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup>
// MainLayout: mobile container + bottom navigation
// No imports needed — layout only, no reactive state
</script>
