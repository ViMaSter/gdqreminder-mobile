<script setup lang="ts">
  const emit = defineEmits(['setVisibility']);

  const handleButtonClick = () => {
    emit('setVisibility', "settings", false);
    emit('setVisibility', "main", true);
  }
</script>
<template>
  <div class="container">
    <mwc-top-app-bar-fixed>
      <md-icon-button slot="navigationIcon" @click="handleButtonClick"><md-icon>arrow_back</md-icon></md-icon-button>
      <div slot="title">{{$t('settings.title')}}</div>
    </mwc-top-app-bar-fixed>
    <main class="mdc-top-app-bar--fixed-adjust">
      App content
    </main>
  </div>
</template>
<style lang="scss" scoped>
/* make div take up full scren */
.container {
  background-color: rebeccapurple;
  height: 100vh;
  width: 100vw;
}
</style>