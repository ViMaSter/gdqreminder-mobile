<script lang="ts">
import { defineComponent, toRef } from "vue";
import "@material/web/all.js";
export default defineComponent({
  props: {
    eventsByShorthand: {
      type: Object as () => { [key: string]: any },
      required: true,
    },
    doneLoading: {
      type: Boolean,
      required: true,
    },
  },
  async setup(props) {
    const eventByShorthands = toRef(props, "eventsByShorthand");

    return {
      eventByShorthands,
    };
  },
});
</script>

<template>
  <md-list>
    <md-list-item
      v-for="[displayName] in Object.entries(eventByShorthands)"
      :key="displayName"
      @click="$emit('onUpdateCurrentEvent', displayName)"
      >{{ displayName }}</md-list-item
    >
    <md-list-item v-if="!doneLoading" class="rotating">
      <md-icon>autorenew</md-icon>
    </md-list-item>
  </md-list>
</template>

<style lang="scss">
.mdc-drawer__header {
  padding-top: var(--safe-area-inset-top);
}
</style>
<style lang="scss" scoped>
@-webkit-keyframes rotating {
  from {
    -webkit-transform: rotate(0deg);
    -o-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  to {
    -webkit-transform: rotate(360deg);
    -o-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
@keyframes rotating {
  from {
    -ms-transform: rotate(0deg);
    -moz-transform: rotate(0deg);
    -webkit-transform: rotate(0deg);
    -o-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  to {
    -ms-transform: rotate(360deg);
    -moz-transform: rotate(360deg);
    -webkit-transform: rotate(360deg);
    -o-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
.rotating md-icon {
  -webkit-animation: rotating 2s linear infinite;
  -moz-animation: rotating 2s linear infinite;
  -ms-animation: rotating 2s linear infinite;
  -o-animation: rotating 2s linear infinite;
  animation: rotating 2s linear infinite;
}
</style>
