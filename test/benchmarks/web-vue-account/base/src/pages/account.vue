<script setup lang="ts">
import { ref } from "vue";

const email = ref("");
</script>

<template>
  <main>
    <h1>Account</h1>
    <input v-model="email" aria-label="Email" />
    <button type="button">Review account</button>
  </main>
</template>
