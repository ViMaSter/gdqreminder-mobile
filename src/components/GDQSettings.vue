<script setup lang="ts">
const emit = defineEmits(['setVisibility']);

function handleButtonClick() {
  emit('setVisibility', "settings", false);
  emit('setVisibility', "main", true);
}
</script>
<template>
  <div class="container">
    <br />
    <br />
    <br />
    <br />
    <br />
    <button @click="handleButtonClick">Go to Main</button>
    <p>Settings View</p>
    <!-- Add your settings content here -->
    <p>This is the settings view. Click the button to go back to the main view.</p>
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