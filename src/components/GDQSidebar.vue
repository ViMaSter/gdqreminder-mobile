<script lang="ts">
import '@material/mwc-list';
import {defineComponent, toRef} from 'vue';
export default defineComponent({
    props: {
        eventsByShorthand: {
            type: Object as () => {[key : string] : any},
            required: true,
        },
        doneLoading: {
            type: Boolean,
            required: true
        }
    },
    async setup(props) {
      const eventByShorthands = toRef(props, "eventsByShorthand");
      const doneLoading = toRef(props, "doneLoading");
      return {
        eventByShorthands
      }
    }
});
</script>

<template>
  <mwc-list>
    <mwc-list-item v-for="[displayName] in (Object.entries(eventByShorthands))" :key="displayName" @click="$emit('onUpdateCurrentEvent', displayName)">{{displayName}}</mwc-list-item>
    <mwc-list-item v-if="!doneLoading" class="rotating">
      <mwc-icon>autorenew</mwc-icon>
    </mwc-list-item>
  </mwc-list>
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
.rotating mwc-icon {
  -webkit-animation: rotating 2s linear infinite;
  -moz-animation: rotating 2s linear infinite;
  -ms-animation: rotating 2s linear infinite;
  -o-animation: rotating 2s linear infinite;
  animation: rotating 2s linear infinite;
}

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