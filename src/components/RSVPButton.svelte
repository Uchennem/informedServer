<script lang="ts">
  import { onDestroy } from 'svelte';
  import { scale } from 'svelte/transition';
  import { elasticOut } from 'svelte/easing';
  import { buildClientApiUrl } from '../lib/api';
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
      const response = await fetch(buildClientApiUrl(`/api/posts/${postId}/rsvp`), {
        method: 'POST',
        credentials: 'include',
      });

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

<div class="relative w-full">
  <button
    type="button"
    onclick={handleClick}
    disabled={isLoading}
    class={`rsvp-btn ${going ? 'rsvp-btn--going' : 'rsvp-btn--default'} ${animating ? 'rsvp-btn--pulse' : ''}`}
    aria-pressed={going}
  >
    {#if isLoading}
      WAITING...
    {:else if going}
      GOING ({count})
    {:else}
      RSVP ({count})
    {/if}
  </button>

  {#if going}
    <div 
      class="stamp pointer-events-none"
      transition:scale="{{ duration: 600, easing: elasticOut, start: 3.5, opacity: 0 }}"
    >
      RSVP'D
    </div>
  {/if}
</div>

<style>
  .rsvp-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 0.5rem 1.25rem;
    font-family: 'Bricolage Grotesque', system-ui, sans-serif;
    font-weight: 800;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    cursor: cell !important;
    transition: all 150ms ease;
    min-height: 2.5rem;
    width: 100%;
    border-radius: 0;
    border: 2px solid #000;
    box-shadow: 4px 4px 0px 0px var(--nc-border-subtle);
    background: var(--nc-text-primary);
    color: #000;
  }

  .rsvp-btn:hover {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0px 0px var(--nc-accent-primary);
  }

  .rsvp-btn:disabled {
    opacity: 0.7;
    cursor: wait !important;
  }

  .rsvp-btn--going {
    background: var(--nc-accent-primary);
    box-shadow: 4px 4px 0px 0px #FF3E00;
  }

  .rsvp-btn--going:hover {
    box-shadow: 6px 6px 0px 0px #FF3E00;
  }

  .stamp {
    position: absolute;
    top: -4.5rem;
    right: -1rem;
    z-index: 50;
    border: 4px solid #CCFF00;
    color: #CCFF00;
    font-family: 'Bricolage Grotesque', system-ui, sans-serif;
    font-weight: 900;
    font-size: 2.5rem;
    padding: 0.25rem 1rem;
    transform: rotate(-15deg);
    box-shadow: 4px 4px 0px 0px #000;
    background: rgba(0, 0, 0, 0.9);
    white-space: nowrap;
    text-shadow: 2px 2px 0px #000;
  }
</style>
