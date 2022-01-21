<script setup lang="ts">
import GDQHeader from './components/GDQHeader.vue'

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
}

const echo = (msg: string) => {
    console.log(msg);
}
</script>

<template>

  <Suspense>
    <GDQHeader v-on:eventChanged="echo($event)" />
  </Suspense>
  <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css?family=Material+Icons&display=block" rel="stylesheet">
</template>
<style>
body
{
  margin: 0;
}
body.dark-mode
{
  background: black;
  color: white;
}
</style>