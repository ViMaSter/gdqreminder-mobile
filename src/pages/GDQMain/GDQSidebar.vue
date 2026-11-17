<script lang="ts">
import { defineComponent, toRef } from "vue";
import "@m3e/web/list";
import "@m3e/web/icon";
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
  <m3e-list>
    <m3e-list-item
      v-for="event in Object.values(eventsByIDs).sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())"
      :key="event.short"
      class="event-item"
      data-test="event-item"
      @click="$emit('onUpdateCurrentEvent', event)"
      >{{ event.short.toUpperCase() }}</m3e-list-item
    >
    <m3e-list-item v-if="!doneLoading" class="rotating loading-item" data-test="event-loading-item">
      <m3e-icon name="autorenew"></m3e-icon>
    </m3e-list-item>
  </m3e-list>
</template>

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
.rotating m3e-icon {
  -webkit-animation: rotating 2s linear infinite;
  -moz-animation: rotating 2s linear infinite;
  -ms-animation: rotating 2s linear infinite;
  -o-animation: rotating 2s linear infinite;
  animation: rotating 2s linear infinite;
}

.event-item,
.loading-item {
  cursor: pointer;
}
</style>
