<script lang="ts">
  let displayName = "";
  let saved = false;

  function saveSettings() {
    saved = true;
  }
</script>

<main>
  <h1>Settings</h1>
  <input aria-label="Display name" bind:value={displayName} />
  <button data-testid="settings-save" type="button" on:click={saveSettings}>Save settings</button>
  {#if saved}<p>Settings saved</p>{/if}
</main>
