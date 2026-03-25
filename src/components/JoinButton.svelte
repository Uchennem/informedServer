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

<div class="flex flex-col gap-2 items-end">
  <button
    type="button"
    on:click={toggleMembership}
    disabled={isSubmitting}
    class="btn-primary disabled:opacity-75 disabled:cursor-not-allowed"
  >
    {#if isSubmitting}
      Saving...
    {:else if joined}
      Leave Group
    {:else}
      Join Group
    {/if}
  </button>

  <p class="text-xs text-slate-400">{count} members</p>

  {#if errorMessage}
    <p class="text-xs text-red-400">{errorMessage}</p>
  {/if}
</div>