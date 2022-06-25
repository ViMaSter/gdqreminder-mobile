<script lang="ts">
import { DateProvider } from "@/interfaces/DateProvider";
import { GDQRunDataFields } from "@/interfaces/GDQRun";
import "@material/mwc-list";
import { defineComponent, inject, ref, Ref, watch } from "vue";
export default defineComponent({
  async setup() {
    const currentRun : Ref<[HTMLDivElement, GDQRunDataFields]> = inject("currentRun")!;
    const now = inject<DateProvider>("dateProvider")!;

    const visibilityClasses = ref("");
    const offset = ref(0);

    const inverseLerp = (a : number, b : number, n : number) => {
        return ( n - a ) / ( b - a );
    }

    watch(currentRun, (newValue) => {
        if (newValue)
        {
            const [runElement, runData] = newValue;
            visibilityClasses.value = "timeIndicator shown";
            const progress = inverseLerp(
                new Date(runData.starttime).getTime(),
                new Date(runData.endtime).getTime(), 
                now.getCurrent().getTime()
            );

            offset.value = runElement.offsetTop + (runElement.clientHeight * progress);
            return;
        }
        visibilityClasses.value = "timeIndicator";
    });

    return {
        visibilityClasses,
        offset
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
  width: calc(100vw - 75px);

  display: none;

    &.shown
    {
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
