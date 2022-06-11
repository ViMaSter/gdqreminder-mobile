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
    <span>{{dayNumber}}</span>
    <span>{{dayName}}</span>
  </div>
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