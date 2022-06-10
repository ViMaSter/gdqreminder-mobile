<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
    props: {
        currentEvent: {
            type: String,
            required: true,
        },
    }
});
</script>

<template>
  <mwc-top-app-bar-fixed>
      <mwc-icon-button slot="navigationIcon" icon="menu"></mwc-icon-button>
      <div slot="title">{{currentEvent}}</div>
      <mwc-icon-button slot="actionItems" icon="dark_mode" @click="$emit('toggleDarkMode')"></mwc-icon-button>
  </mwc-top-app-bar-fixed>
</template>

<style lang="css" scoped>
.dark-mode span
{
    color: hsl(0deg 0% 89%);
}
.dark-mode li[divider]
{
  border-bottom-color: rgba(255, 255, 255, 0.45) !important;
}
mwc-list-item
{
  justify-content: right;
  font-size: 1.5em;
}
mwc-list-item span
{
  color: #00aeef !important;
}
</style>