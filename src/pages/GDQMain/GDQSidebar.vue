<script lang="ts">
import { defineComponent, toRef } from "vue";
import "@material/web/all.js";
import { GDQEventData } from "@/interfaces/GDQEvent";
export default defineComponent({
  props: {
    eventsByIDs: {
      type: Object as () => { [id: number]: GDQEventData },
      required: true,
    },
    doneLoading: {
      type: Boolean,
      required: true,
    },
  },
  async setup(props) {
    const eventsByIDs = toRef(props, "eventsByIDs");

    return {
      eventsByIDs,
    };
  },
});
</script>

<template>
  <md-list>
    <md-list-item
      v-for="event in Object.values(eventsByIDs).sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())"
      :key="event.short"
      @click="$emit('onUpdateCurrentEvent', event)"
      >{{ event.short.toUpperCase() }}</md-list-item
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
