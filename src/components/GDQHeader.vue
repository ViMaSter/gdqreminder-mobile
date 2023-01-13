<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
    props: {
        currentEventName: {
            type: String,
            required: true,
        },
    }
});
</script>

<template>
  <mwc-top-app-bar-fixed>
      <mwc-icon-button slot="navigationIcon" icon="menu"></mwc-icon-button>
      <div slot="title">{{currentEventName}}</div>
      <mwc-icon-button slot="actionItems" icon="search" @click="$emit('toggleSearch')"></mwc-icon-button>
      <mwc-icon-button slot="actionItems" icon="dark_mode" @click="$emit('toggleDarkMode')"></mwc-icon-button>
  </mwc-top-app-bar-fixed>
  <div class="transition"></div>
</template>

<style lang="scss" scoped>

.dark-mode
{
    .transition
    {
        --mdc-theme-primary: 281, 100%, 10.2%;
        --from: hsla(var(--mdc-theme-primary), 1);
        --to: hsla(var(--mdc-theme-primary), 0);
    }

    .agdq .transition
    {
        --mdc-theme-primary: 180, 100%, 5%;
        --from: hsla(var(--mdc-theme-primary), 1);
        --to: hsla(var(--mdc-theme-primary), 0);
    }

    .sgdq .transition
    {
        --mdc-theme-primary: 347, 89%, 10.4%;
        --from: hsla(var(--mdc-theme-primary), 1);
        --to: hsla(var(--mdc-theme-primary), 0);
    }
}

.transition {
    position: absolute;
    top: 4em;
    left: 0;
    height: 1em;
    width: 100vw;
    background: linear-gradient(180deg, var(--from) 0%, var(--to) 100%);
    z-index: 1000;
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

  .agdq mwc-top-app-bar-fixed
  {
    --mdc-theme-primary: hsl(180deg 100% 15%);
  }

  .sgdq mwc-top-app-bar-fixed
  {
    --mdc-theme-primary: hsl(343deg 49% 19%);
  }
}

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