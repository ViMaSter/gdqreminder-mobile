<script lang="ts">
import {defineComponent} from 'vue';
import '@material/mwc-top-app-bar-fixed';

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
    <md-icon-button slot="navigationIcon"><md-icon>menu</md-icon></md-icon-button>
    <div slot="title">{{currentEventName}}</div>
    <md-icon-button slot="actionItems" @click="$emit('toggleFilter')"><md-icon>filter_list</md-icon></md-icon-button>
    <md-icon-button slot="actionItems" @click="$emit('toggleDarkMode')"><md-icon>dark_mode</md-icon></md-icon-button>
  </mwc-top-app-bar-fixed>
</template>

<style lang="scss" scoped>
md-icon-button
{
  --_icon-color: white;
  --_focus-icon-color: white;
  --_hover-icon-color: white;
  --_pressed-icon-color: white;
}
mwc-top-app-bar-fixed
{
 --mdc-theme-primary: hsl(272deg 95% 40%);
  --md-sys-color-primary: hsl(272deg 95% 40%);
}

.agdq mwc-top-app-bar-fixed
{
 --mdc-theme-primary: hsl(180deg 95% 40%);
  --md-sys-color-primary: hsl(180deg 95% 40%);
}

.sgdq mwc-top-app-bar-fixed
{
 --mdc-theme-primary: hsl(343deg 95% 40%);
  --md-sys-color-primary: hsl(343deg 95% 40%);
}

.dark-mode
{
  mwc-top-app-bar-fixed
  {
   --mdc-theme-primary: hsl(272deg 68% 26%);
  --md-sys-color-primary: hsl(272deg 68% 26%);
  }

  .agdq mwc-top-app-bar-fixed
  {
   --mdc-theme-primary: hsl(180deg 100% 15%);
  --md-sys-color-primary: hsl(180deg 100% 15%);
  }

  .sgdq mwc-top-app-bar-fixed
  {
   --mdc-theme-primary: hsl(343deg 49% 19%);
  --md-sys-color-primary: hsl(343deg 49% 19%);
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

md-list-item
{
  justify-content: right;
  font-size: 1.5em;
}
md-list-item span
{
  color: #00aeef !important;
}
</style>