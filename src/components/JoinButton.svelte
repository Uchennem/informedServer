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
  let animating = $state(false);

  async function toggleMembership() {
    if (isSubmitting) return;

    animating = true;
    setTimeout(() => { animating = false; }, 300);

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

<div class="flex w-full flex-col gap-2 items-stretch sm:items-end">
  <button
    type="button"
    onclick={toggleMembership}
    disabled={isSubmitting}
    class={`join-btn ${joined ? 'join-btn--joined' : 'join-btn--default'} ${animating ? 'join-btn--pulse' : ''}`}
  >
    {#if isSubmitting}
      <svg class="join-btn__icon animate-spin" viewBox="0 0 20 20" fill="none" stroke="currentColor"><circle cx="10" cy="10" r="7" stroke-width="2" stroke-dasharray="30" stroke-dashoffset="10"/></svg>
      Saving...
    {:else if joined}
      <svg class="join-btn__icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
      Joined
    {:else}
      <svg class="join-btn__icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
      Join
    {/if}
  </button>

  {#if errorMessage}
    <p class="text-xs mb-0" style="color: var(--nc-destructive);">{errorMessage}</p>
  {/if}
</div>

<style>
  .join-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-family: 'Clash Grotesk', 'Work Sans', system-ui, sans-serif;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    min-height: 2.5rem;
    border: none;
    width: 100%;
  }

  @media (min-width: 640px) {
    .join-btn {
      width: auto;
    }
  }

  .join-btn__icon {
    width: 0.875rem;
    height: 0.875rem;
    flex-shrink: 0;
  }

  .join-btn--default {
    background: linear-gradient(135deg, var(--nc-accent-primary), #5B52EE);
    color: white;
    box-shadow: 0 4px 14px rgba(108, 99, 255, 0.35);
  }

  .join-btn--default:hover {
    box-shadow: 0 8px 22px rgba(108, 99, 255, 0.45);
    transform: translateY(-2px);
  }

  .join-btn--joined {
    background: transparent;
    border: 1.5px solid var(--nc-border-subtle);
    color: var(--nc-text-primary);
  }

  .join-btn--joined:hover {
    border-color: var(--nc-accent-primary);
    color: var(--nc-accent-primary);
    background: rgba(108, 99, 255, 0.08);
  }

  .join-btn--pulse {
    animation: joinPulse 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .join-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .join-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  @keyframes joinPulse {
    0% { transform: scale(1); }
    40% { transform: scale(0.93); }
    100% { transform: scale(1); }
  }
</style>
