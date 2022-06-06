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
  <mwc-list-item>
    <span>{{ day }}</span>
  </mwc-list-item>
</template>

<style lang="css" scoped>
.dark-mode span
{
    color: hsl(0deg 0% 89%);
}
</style>