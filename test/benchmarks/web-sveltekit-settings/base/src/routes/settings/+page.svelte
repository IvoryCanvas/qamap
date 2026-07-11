<script lang="ts">
  let displayName = "";
</script>

<main>
  <h1>Settings</h1>
  <input aria-label="Display name" bind:value={displayName} />
  <button type="button">Review settings</button>
</main>
