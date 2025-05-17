<script lang="ts">
import { defineComponent } from "vue";
import "@material/mwc-top-app-bar-fixed";

export default defineComponent({
  props: {
    currentEventName: {
      type: String,
      required: true,
    },
  },
});
</script>

<template>
  <!-- eslint-disable vue/no-deprecated-slot-attribute false positive: -->
  <!-- google uses 'slot' as a prop name, so we need to disable this rule, as it's a false positive -->
  <mwc-top-app-bar-fixed>
    <md-icon-button slot="navigationIcon"
      ><md-icon>menu</md-icon></md-icon-button
    >
    <div slot="title">{{ currentEventName }}</div>
    <md-icon-button slot="actionItems" @click="$emit('toggleFilter')"
      ><md-icon>filter_list</md-icon></md-icon-button
    >
    <md-icon-button slot="actionItems" @click="$emit('toggleDarkMode')"
      ><md-icon>dark_mode</md-icon></md-icon-button
    >
  </mwc-top-app-bar-fixed>
    <!-- eslint-enable vue/no-deprecated-slot-attribute false positive: -->
</template>

<style lang="scss" scoped>
mwc-top-app-bar-fixed {
  background-color: var(--mdc-theme-primary);
  padding-top: var(--safe-area-inset-top);
  margin-top: calc(var(--safe-area-inset-top) * -1);
}

.dark-mode {
  span {
    color: var(--md-sys-on-surface);
  }
  li[divider] {
    border-bottom-color: var(--md-sys-color-background);
  }
}
</style>
