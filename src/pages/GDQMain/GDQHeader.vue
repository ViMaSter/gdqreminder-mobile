<script lang="ts">
import { defineComponent, nextTick, ref, watch } from "vue";
import "@m3e/web/app-bar";
import "@m3e/web/icon";
import "@m3e/web/icon-button";

export default defineComponent({
  props: {
    currentEventName: {
      type: String,
      required: true,
    },
    searchQuery: {
      type: String,
      required: false,
      default: "",
    },
    searchPlaceholder: {
      type: String,
      required: false,
      default: "",
    },
    searchActive: {
      type: Boolean,
      required: false,
      default: false,
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
  <m3e-app-bar data-test-selector="main" size="small">
    <m3e-icon-button slot="leading" @click="$emit('toggleDrawer')" data-test="toggle-drawer">
      <m3e-icon name="menu"></m3e-icon>
    </m3e-icon-button>
    <div v-if="searchActive" slot="title" class="searchWrapper" data-test="main-title">
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
    <div v-else slot="title" data-test="main-title">{{ currentEventName }}</div>
    <m3e-icon-button slot="trailing" @click="$emit('toggleSearch')" data-test="toggle-search">
      <m3e-icon :name="searchActive ? 'close' : 'search'"></m3e-icon>
    </m3e-icon-button>
    <m3e-icon-button slot="trailing" @click="$emit('openFriendMenu')" data-test="open-friend-menu">
      <m3e-icon name="group"></m3e-icon>
    </m3e-icon-button>
    <m3e-icon-button slot="trailing" @click="$emit('toggleFilter')" data-test="toggle-filter">
      <m3e-icon name="filter_list"></m3e-icon>
    </m3e-icon-button>
    <m3e-icon-button slot="trailing" @click="$emit('toggleDarkMode')" data-test="toggle-dark-mode">
      <m3e-icon name="dark_mode"></m3e-icon>
    </m3e-icon-button>
    <m3e-icon-button slot="trailing" @click="$emit('showSettings')" data-test="settings">
      <m3e-icon name="settings"></m3e-icon>
    </m3e-icon-button>
  </m3e-app-bar>
</template>

<style lang="scss" scoped>
m3e-app-bar {
  --m3e-app-bar-small-title-text-font-size: 1.25rem;
  --m3e-app-bar-padding-left: 0.25rem;
  --m3e-app-bar-padding-right: 0.75rem;
  --m3e-app-bar-container-color: var(--mdc-theme-primary);
  --m3e-icon-button-icon-color: var(--md-sys-color-on-surface-variant);
  padding-top: var(--safe-area-inset-top);
  margin-top: calc(var(--safe-area-inset-top) * -1);
}

m3e-icon-button[slot="leading"] {
  min-width: 4rem;
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
