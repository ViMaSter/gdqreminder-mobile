<script lang="ts">
import { defineComponent, nextTick, ref, watch } from "vue";
import "@material/mwc-top-app-bar-fixed";

export default defineComponent({
  props: {
    currentEventName: {
      type: String,
      required: true,
    },
    searchQuery: {
      type: String,
      required: true,
    },
    searchPlaceholder: {
      type: String,
      required: true,
    },
    searchActive: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    const searchInput = ref<HTMLInputElement>();

    watch(
      () => props.searchActive,
      async (isActive) => {
        if (!isActive) {
          return;
        }
        await nextTick();
        searchInput.value?.focus();
      },
    );

    return {
      searchInput,
    };
  },
});
</script>

<template>
  <!-- eslint-disable vue/no-deprecated-slot-attribute false positive: -->
  <!-- google uses 'slot' as a prop name, so we need to disable this rule, as it's a false positive -->
  <mwc-top-app-bar-fixed data-test-selector="main">
    <md-icon-button slot="navigationIcon"
      ><md-icon>menu</md-icon></md-icon-button
    >
    <div v-if="searchActive" slot="title" class="searchWrapper">
      <input
        ref="searchInput"
        class="searchInput"
        type="text"
        :placeholder="searchPlaceholder"
        :value="searchQuery"
        @input="$emit('updateSearchQuery', ($event.target as HTMLInputElement).value)"
        @blur="$emit('searchInputBlurred', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <div v-else slot="title">{{ currentEventName }}</div>
    <md-icon-button slot="actionItems" @click="$emit('toggleSearch')"
      ><md-icon>{{ searchActive ? 'close' : 'search' }}</md-icon></md-icon-button
    >
    <md-icon-button slot="actionItems" @click="$emit('openFriendMenu')"
      data-test="open-friend-menu"
      ><md-icon>group</md-icon></md-icon-button
    >
    <md-icon-button slot="actionItems" @click="$emit('toggleFilter')"
      ><md-icon>filter_list</md-icon></md-icon-button
    >
    <md-icon-button slot="actionItems" @click="$emit('toggleDarkMode')"
      ><md-icon>dark_mode</md-icon></md-icon-button
    >
    <md-icon-button slot="actionItems" @click="$emit('showSettings')"
      data-test="settings"
      ><md-icon>settings</md-icon></md-icon-button
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

.searchWrapper {
  min-width: 0;
  max-width: 100%;
  padding-right: 0.5rem;
  overflow: hidden;
}

.searchInput {
  box-sizing: border-box;
  width: 100%;
  height: 2rem;
  border: 0;
  border-radius: 0.5rem;
  padding: 0 0.6rem;
  font-size: 0.9rem;
  background-color: color-mix(in srgb, var(--md-sys-color-on-primary) 20%, transparent);
  color: var(--mdc-theme-on-surface);
  outline: transparent !important;
}

.searchInput::placeholder {
  color: rgba(255, 255, 255, 0.8);
}

.searchInput:focus {
  outline: 2px solid rgba(255, 255, 255, 0.45);
  outline-offset: 1px;
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
