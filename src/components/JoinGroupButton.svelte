<script>
  import { buildClientApiUrl } from '../lib/api';

  export let groupId;

  let isSubmitting = false;
  let joined = false;
  let errorMessage = '';

  async function joinGroup() {
    if (isSubmitting || joined) return;

    isSubmitting = true;
    errorMessage = '';

    try {
      const response = await fetch(buildClientApiUrl(`/api/groups/${groupId}/join`), {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to join group');
      }

      joined = true;
    } catch {
      errorMessage = 'Unable to join right now';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="join-group-button">
  <button type="button" on:click={joinGroup} disabled={isSubmitting || joined}>
    {#if joined}
      Joined
    {:else if isSubmitting}
      Joining...
    {:else}
      Join
    {/if}
  </button>

  {#if errorMessage}
    <p>{errorMessage}</p>
  {/if}
</div>

<style>
  .join-group-button {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    align-items: flex-end;
  }

  button {
    border: 1px solid #d1d5db;
    background: #ffffff;
    border-radius: 0.5rem;
    padding: 0.45rem 0.75rem;
    cursor: pointer;
    font-size: 0.875rem;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.75;
  }

  p {
    margin: 0;
    font-size: 0.8rem;
    color: #b91c1c;
  }
</style>