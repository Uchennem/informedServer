<script lang="ts">
  type Props = {
    groupId: string;
    isMember?: boolean;
    memberCount?: number;
  };

  let { groupId, isMember = false, memberCount = 0 }: Props = $props();

  let isSubmitting = $state(false);
  let joined = $state(Boolean(isMember));
  let count = $state(Math.max(0, Number(memberCount) || 0));
  let errorMessage = $state('');

  async function toggleMembership() {
    if (isSubmitting) return;

    const nextJoined = !joined;
    const previousJoined = joined;
    const previousCount = count;

    isSubmitting = true;
    errorMessage = '';
    joined = nextJoined;
    count = nextJoined ? previousCount + 1 : Math.max(0, previousCount - 1);

    try {
      const baseUrl = import.meta.env.PUBLIC_API_BASE_URL;

      if (!baseUrl) {
        throw new Error('Missing PUBLIC_API_BASE_URL');
      }

      const action = nextJoined ? 'join' : 'leave';
      const method = nextJoined ? 'POST' : 'DELETE';

      const response = await fetch(`${baseUrl}/api/groups/${groupId}/${action}`, {
        method,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Membership request failed');
      }
    } catch {
      joined = previousJoined;
      count = previousCount;
      errorMessage = 'Unable to update membership right now';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="join-button">
  <button type="button" on:click={toggleMembership} disabled={isSubmitting}>
    {#if isSubmitting}
      Saving...
    {:else if joined}
      Leave Group
    {:else}
      Join Group
    {/if}
  </button>

  <p class="count">{count} members</p>

  {#if errorMessage}
    <p class="error">{errorMessage}</p>
  {/if}
</div>

<style>
  .join-button {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
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

  .count {
    margin: 0;
    font-size: 0.8rem;
    color: #4b5563;
  }

  .error {
    margin: 0;
    font-size: 0.8rem;
    color: #b91c1c;
  }
</style>