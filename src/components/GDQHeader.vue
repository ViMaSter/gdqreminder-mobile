<script lang="ts">
import {defineComponent, watch, toRefs, ref} from 'vue';
import {TopAppBarFixed} from '@material/mwc-top-app-bar-fixed';

export default defineComponent({
    props: {
        currentEventName: {
            type: String,
            required: true,
        },
    },
    async setup(props) {
      const item = toRefs(props).currentEventName;
      const bar = ref<TopAppBarFixed>()!;
      watch(item, () => {
        let a = getComputedStyle(document.body).getPropertyValue('--vote-red');
        const regex = /\((\d+)/m;
        let currentValue = regex.exec(getComputedStyle(bar.value!).getPropertyValue('--mdc-theme-primary'));
        let newValue = regex.exec(a);
        let currentHue = currentValue![1];
        let newHue = newValue![1];
        (async () => {
          
          bar.value!.style.setProperty("--mdc-theme-primary", a);
        })();
      });
      return {
        bar
      };
    }
});
</script>

<template>
  <mwc-top-app-bar-fixed ref="bar">
      <mwc-icon-button slot="navigationIcon" icon="menu"></mwc-icon-button>
      <div slot="title">{{currentEventName}}</div>
      <mwc-icon-button slot="actionItems" icon="search" @click="$emit('toggleSearch')"></mwc-icon-button>
      <mwc-icon-button slot="actionItems" icon="dark_mode" @click="$emit('toggleDarkMode')"></mwc-icon-button>
  </mwc-top-app-bar-fixed>
</template>

<style lang="scss">
.mdc-top-app-bar--fixed
{
  transition: 1s --mdc-theme-primary cubic-bezier(0.25, 1, 0.5, 1);
}
mwc-top-app-bar-fixed
{
  transform: translateY(-100%);
  transition: 0.20s transform cubic-bezier(0.25, 1, 0.5, 1);

  .loaded &
  {
      transform: translateY(0%);
  }
}

mwc-top-app-bar-fixed
{
  --mdc-theme-primary: hsl(272deg 95% 40%);
}

.agdq mwc-top-app-bar-fixed
{
  --mdc-theme-primary: hsl(180deg 95% 40%);
}

.sgdq mwc-top-app-bar-fixed
{
  --mdc-theme-primary: hsl(343deg 95% 40%);
}

.dark-mode
{
  mwc-top-app-bar-fixed
  {
    --mdc-theme-primary: hsl(272deg 68% 26%);
  }

  &.agdq mwc-top-app-bar-fixed
  {
    --mdc-theme-primary: hsl(180deg 100% 15%);
  }

  &.sgdq mwc-top-app-bar-fixed
  {
    --mdc-theme-primary: hsl(343deg 49% 19%);
  }
}
</style>
<style lang="scss" scoped>
.dark-mode
{
  span
  {
    color: hsl(0deg 0% 89%);
  }
  li[divider]
  {
    border-bottom-color: rgba(255, 255, 255, 0.45) !important;
  }
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