<script lang="ts">
import '@material/mwc-list';
import {defineComponent, ref} from 'vue';
export default defineComponent({
    props: {
        eventsByShorthand: {
            type: Object as () => {[key : string] : any},
            required: true,
        },
    },
    async setup(props) {
      const eventByShorthands = ref(props.eventsByShorthand);
      return {
        eventByShorthands
      }
    }
});
</script>

<template>
  <mwc-list>
    <mwc-list-item v-for="[displayName] in (Object.entries(eventByShorthands))" :key="displayName" @click="$emit('onUpdateCurrentEvent', displayName)">{{displayName}}</mwc-list-item>
  </mwc-list>
</template>

<style lang="scss" scoped>
mwc-list
{
    margin: initial !important;
}
.dark-mode
{
  mwc-list-item
  {
    color: hsl(0deg 0% 87%);
  }
}
</style>