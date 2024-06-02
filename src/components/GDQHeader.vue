<script lang="ts">
import {defineComponent} from 'vue';
import '@material/mwc-top-app-bar-fixed';

export default defineComponent({
    props: {
        currentEventName: {
            type: String,
            required: true,
        },
    }
});
</script>

<template>
  <mwc-top-app-bar-fixed>
    <md-icon-button slot="navigationIcon"><md-icon>menu</md-icon></md-icon-button>
    <div slot="title">{{currentEventName}}</div>
    <md-icon-button slot="actionItems" @click="$emit('toggleFilter')"><md-icon>filter_list</md-icon></md-icon-button>
    <md-icon-button slot="actionItems" @click="$emit('toggleDarkMode')"><md-icon>dark_mode</md-icon></md-icon-button>
  </mwc-top-app-bar-fixed>
</template>

<style lang="scss" scoped>
.dark-mode
{
  span
  {
    color: var(--md-sys-on-surface);
  }
  li[divider]
  {
    // neutral
    border-bottom-color: var(--md-sys-color-background);
  }
}
</style>