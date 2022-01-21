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
  <GDQHeader v-on:eventChanged="echo($event)" />
  <RouterLink to="/">Home</RouterLink>
  <RouterLink to="/about">About</RouterLink>
  <RouterView />
</template>

<style src="halfmoon/css/halfmoon-variables.min.css"></style>