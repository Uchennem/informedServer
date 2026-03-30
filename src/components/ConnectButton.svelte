<script lang="ts">
  type Props = {
    userId: string;
    mode?: 'view' | 'connect';
  };

  let { userId, mode = 'view' }: Props = $props();
  let isPending = $state(false);
  let animating = $state(false);

  function goToProfile() {
    if (!userId) return;

    if (mode === 'connect') {
      animating = true;
      setTimeout(() => { animating = false; }, 300);
      isPending = !isPending;
      return;
    }

    window.location.href = `/profile/${userId}`;
  }
</script>

<button
  type="button"
  onclick={goToProfile}
  class={`connect-btn ${mode === 'connect' && isPending ? 'connect-btn--pending' : 'connect-btn--default'} ${animating ? 'connect-btn--pulse' : ''}`}
>
  {#if mode === 'connect'}
    {#if isPending}
      <svg class="connect-btn__icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
      Requested
    {:else}
      <svg class="connect-btn__icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
      Connect
    {/if}
  {:else}
    <svg class="connect-btn__icon" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
    View Profile
  {/if}
</button>

<style>
  .connect-btn {
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
    .connect-btn {
      width: auto;
    }
  }

  .connect-btn__icon {
    width: 0.875rem;
    height: 0.875rem;
    flex-shrink: 0;
  }

  .connect-btn--default {
    background: linear-gradient(135deg, var(--nc-accent-primary), #5B52EE);
    color: white;
    box-shadow: 0 4px 14px rgba(108, 99, 255, 0.35);
  }

  .connect-btn--default:hover {
    box-shadow: 0 8px 22px rgba(108, 99, 255, 0.45);
    transform: translateY(-2px);
  }

  .connect-btn--pending {
    background: transparent;
    border: 1.5px solid var(--nc-border-subtle);
    color: var(--nc-text-primary);
  }

  .connect-btn--pending:hover {
    border-color: var(--nc-accent-primary);
    color: var(--nc-accent-primary);
    background: rgba(108, 99, 255, 0.08);
  }

  .connect-btn--pulse {
    animation: connectPulse 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .connect-btn:active {
    transform: scale(0.97);
  }

  @keyframes connectPulse {
    0% { transform: scale(1); }
    40% { transform: scale(0.93); }
    100% { transform: scale(1); }
  }
</style>
