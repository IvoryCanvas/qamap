<script setup lang="ts">
import { ref } from "vue";

const email = ref("");
const saved = ref(false);

function saveAccount() {
  saved.value = true;
}
</script>

<template>
  <main>
    <h1>Account</h1>
    <input v-model="email" aria-label="Email" />
    <button data-testid="account-save" type="button" @click="saveAccount">Save account</button>
    <p v-if="saved">Account saved</p>
  </main>
</template>
