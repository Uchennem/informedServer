<script lang="ts">
  import { onDestroy } from 'svelte';
  import { initializeRsvpCount, rsvpCounts, setRsvpCount } from '../stores/rsvp';

  export let postId = '';
  export let initialCount = 0;

  let going = false;
  let animating = false;
  let isLoading = false;
  let count = initialCount;

  initializeRsvpCount(postId, initialCount);
  count = rsvpCounts.get()[postId] ?? initialCount;

  const unsubscribe = rsvpCounts.subscribe((counts) => {
    if (!postId) return;
    count = counts[postId] ?? initialCount;
  });

  onDestroy(() => {
    unsubscribe();
  });

  async function handleClick() {
    if (!postId || isLoading) return;

    isLoading = true;

    try {
      const response = await fetch(
        `${import.meta.env.PUBLIC_API_BASE_URL}/api/posts/${postId}/rsvp`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error('RSVP request failed');
      }

      const payload = await response.json();
      const nextCount = Number(payload?.rsvpCount ?? count);

      setRsvpCount(postId, nextCount);
      going = Boolean(payload?.isRsvped ?? !going);
      animating = true;
      setTimeout(() => {
        animating = false;
      }, 300);
    } catch (error) {
      console.error('Unable to update RSVP', error);
    } finally {
      isLoading = false;
    }
  }
</script>

<button
  type="button"
  onclick={handleClick}
  disabled={isLoading}
  class={`rsvp-btn ${going ? 'rsvp-btn--going' : 'rsvp-btn--default'} ${animating ? 'rsvp-btn--pulse' : ''}`}
  aria-pressed={going}
>
  {#if isLoading}
    <svg class="rsvp-btn__icon rsvp-btn__icon--spin" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="2" opacity="0.25"></circle>
      <path d="M17 10a7 7 0 00-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
    </svg>
    Saving...
  {:else if going}
    <svg class="rsvp-btn__icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
    Going ({count})
  {:else}
    <svg class="rsvp-btn__icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
    RSVP ({count})
  {/if}
</button>

<style>
  .rsvp-btn {
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
    min-height: 2.25rem;
    border: none;
    width: 100%;
  }

  .rsvp-btn:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  .rsvp-btn__icon {
    width: 0.875rem;
    height: 0.875rem;
    flex-shrink: 0;
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .rsvp-btn__icon--spin {
    animation: spin 0.9s linear infinite;
  }

  .rsvp-btn--default {
    background: transparent;
    border: 1.5px solid var(--nc-border-subtle);
    color: var(--nc-text-primary);
  }

  .rsvp-btn--default:hover {
    border-color: var(--nc-accent-primary);
    color: var(--nc-accent-primary);
    background: rgba(108, 99, 255, 0.08);
    transform: translateY(-1px);
  }

  .rsvp-btn--going {
    background: var(--nc-accent-primary);
    color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .rsvp-btn--going:hover {
    filter: brightness(1.08);
    transform: translateY(-1px);
  }

  .rsvp-btn--pulse {
    animation: kineticPulse 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .rsvp-btn--pulse .rsvp-btn__icon {
    animation: iconPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes kineticPulse {
    0% { transform: scale(1); }
    40% { transform: scale(0.93); }
    100% { transform: scale(1); }
  }

  @keyframes iconPop {
    0% { transform: scale(1) rotate(0deg); }
    40% { transform: scale(0.8) rotate(-10deg); }
    100% { transform: scale(1) rotate(0deg); }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .rsvp-btn:active {
    transform: scale(0.97);
  }

  @media (min-width: 640px) {
    .rsvp-btn {
      width: auto;
    }
  }
</style>
