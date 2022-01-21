<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import GDQHeader from './components/GDQHeader.vue'

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-mode');
}

const echo = (msg: string) => {
    console.log(msg);
}
</script>

<template>

  <Suspense>
    <GDQHeader v-on:eventChanged="echo($event)" />
  </Suspense>
  <RouterLink to="/">Home</RouterLink>
  <RouterLink to="/about">About</RouterLink>
  <RouterView />
  <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css?family=Material+Icons&display=block" rel="stylesheet">
</template>
<style>
body.dark-mode
{
  margin: 0;
  background: black;
  color: white;
}
</style>