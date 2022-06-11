<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
    props: {
        day: {
            type: String,
            required: true,
        },
    },
    setup(props) {
        const dayDate = new Date(parseInt(props.day));
        return {
          dayName: dayDate.toLocaleDateString(undefined, { weekday: 'long' }).slice(0, 2),
          dayNumber: dayDate.getDate(),
        };
    },
});
</script>

<template>
  <div :id="'day-divider-'+day">
    <span class="dayName">{{dayName}}</span>
    <span class="dayNumber">{{dayNumber}}</span>
  </div>
</template>

<style lang="css" scoped>
div
{
    margin-top: .45em;
}
span
{
    color: var(--calendar-day);
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