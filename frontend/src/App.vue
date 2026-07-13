<template>
  <router-view />
</template>

<script setup lang="ts">
// No script needed here unless you want global layout wrappers
</script>

<style>
/* Global styles to ensure full width and height */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden; /* Prevent scrollbars on the body */
}

body {
  background-color: #121212;
  color: #ffffff;
}
</style>
