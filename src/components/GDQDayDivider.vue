<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
    props: {
        day: {
            type: String,
            required: true,
        },
    },
    async setup(props: {}) {
    }
});
</script>

<template>
  <mwc-list-item noninteractive>
    <span>{{ day }}</span>
  </mwc-list-item>
  <li divider role="separator" padded></li>
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