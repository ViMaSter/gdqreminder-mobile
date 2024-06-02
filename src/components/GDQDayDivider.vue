<script lang="ts">
import {defineComponent, inject} from 'vue';
import { DateProvider } from "@/interfaces/DateProvider"

export default defineComponent({
    props: {
        day: {
            type: String,
            required: true,
        },
    },
    setup(props) {
        const dayDate = new Date(parseInt(props.day));
        const now = inject<DateProvider>("dateProvider")!.getCurrent();
        const endOfDay = new Date(dayDate.getTime() + 1 * 1000 * 60 * 60 * 24);
        const generateIsOverClassName = () => {
          const isInThePast = endOfDay < now;
          if (isInThePast)
          {
            return "day-divider is-over";
          }
          return "day-divider ";
        };
        return {
          dayName: dayDate.toLocaleDateString(undefined, { weekday: 'long' }).slice(0, 2),
          dayNumber: dayDate.getDate(),
          generateIsOverClassName,
        };
    },
});
</script>

<template>
  <div :class="generateIsOverClassName()" :id="'day-divider-'+day">
    <span class="dayName">{{dayName}}</span>
    <span class="dayNumber">{{dayNumber}}</span>
  </div>
</template>

<style lang="scss" scoped>
div
{
    color: var(--md-sys-color-on-background);
    position: sticky;
    top: 1.25em;
    margin: 0.25em 0 0.55em;

    &.is-over
    {
      text-decoration: line-through;
      opacity: 0.5;
    }
}
span
{
    display: block;
    text-align: center;
    line-height: 1;
}

.dayName
{
  font-size: 15px;
}
.dayNumber
{
  font-size: 24px;
}
</style>