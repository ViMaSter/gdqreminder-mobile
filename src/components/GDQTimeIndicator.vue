<script lang="ts">
import { DateProvider } from "@/interfaces/DateProvider";
import { GDQRunData } from "@/interfaces/GDQRun";
import { defineComponent, inject, ref, Ref, watch } from "vue";
export default defineComponent({
  async setup() {
    const currentRun: Ref<[HTMLDivElement, GDQRunData]> =
      inject("currentRun")!;
    const now = inject<DateProvider>("dateProvider")!;

    const visibilityClasses = ref("");
    const offset = ref(0);

    const inverseLerp = (a: number, b: number, n: number) => {
      return (n - a) / (b - a);
    };

    const update = (newRun: [HTMLDivElement, GDQRunData]) => {
      if (newRun && newRun[0]) {
        const [runElement, runData] = newRun;
        visibilityClasses.value = "timeIndicator shown";
        const progress = inverseLerp(
          new Date(runData.starttime).getTime(),
          new Date(runData.endtime).getTime(),
          now.getCurrent().getTime(),
        );
        offset.value = Math.round(
          runElement.offsetTop + runElement.clientHeight * progress,
        );
        return;
      }
      visibilityClasses.value = "timeIndicator";
    };

    setInterval(() => {
      update(currentRun.value);
    }, 60000);

    watch(currentRun, update);

    return {
      visibilityClasses,
      offset,
    };
  },
});
</script>

<template>
  <div :class="visibilityClasses" :style="`top: ${offset}px`">
    <div class="circle"></div>
    <div class="line"></div>
  </div>
</template>

<style lang="scss" scoped>
.timeIndicator {
  position: absolute;
  left: 50px;
  width: 100vw;
  margin-top: -5px;

  display: none;

  &.shown {
    display: block;
  }

  .circle {
    width: 12px;
    height: 12px;
    background: white;
    border-radius: 12px;
  }

  .line {
    position: absolute;
    left: 6px;
    top: 5px;
    width: 100%;
    border-top: 2px solid white;
    opacity: 0.5;
  }
}
</style>
