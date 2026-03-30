<script lang="ts">
  import { buildClientApiUrl } from '../lib/api';

  export let postId = '';

  let saved = false;
  let animating = false;
  let isLoading = false;

  async function handleClick() {
    if (!postId || isLoading) return;

    isLoading = true;
    animating = true;
    setTimeout(() => { animating = false; }, 300);

    try {
      const response = await fetch(buildClientApiUrl(`/api/posts/${postId}/save`), {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to save post');
      }

      const payload = await response.json();
      saved = Boolean(payload?.saved);
    } catch (error) {
      console.error('Unable to save post', error);
    } finally {
      isLoading = false;
    }
  }
</script>

<button
  type="button"
  onclick={handleClick}
  disabled={isLoading}
  class={`save-btn ${saved ? 'save-btn--saved' : 'save-btn--default'} ${animating ? 'save-btn--pulse' : ''}`}
  aria-pressed={saved}
  aria-label={saved ? 'Remove from saved' : 'Save for later'}
  title={saved ? 'Saved' : 'Save'}
>
  {#if saved}
    <svg class="save-btn__icon" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/></svg>
  {:else}
    <svg class="save-btn__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/></svg>
  {/if}
</button>

<style>
  .save-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 9999px;
    border: 1.5px solid var(--nc-border-subtle);
    background: transparent;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    flex-shrink: 0;
  }

  .save-btn__icon {
    width: 1rem;
    height: 1rem;
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .save-btn:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  .save-btn--default {
    color: var(--nc-text-subtle);
  }

  .save-btn--default:hover {
    border-color: var(--nc-accent-secondary);
    color: var(--nc-accent-secondary);
    background: rgba(255, 138, 92, 0.08);
    transform: translateY(-1px);
  }

  .save-btn--saved {
    border-color: var(--nc-accent-secondary);
    color: var(--nc-accent-secondary);
    background: rgba(255, 138, 92, 0.12);
  }

  .save-btn--saved:hover {
    background: rgba(255, 138, 92, 0.18);
    transform: translateY(-1px);
  }

  .save-btn--pulse {
    animation: savePulse 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .save-btn--pulse .save-btn__icon {
    animation: saveIconPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .save-btn:active {
    transform: scale(0.93);
  }

  @keyframes savePulse {
    0% { transform: scale(1); }
    40% { transform: scale(0.88); }
    100% { transform: scale(1); }
  }

  @keyframes saveIconPop {
    0% { transform: scale(1); }
    40% { transform: scale(1.3); }
    100% { transform: scale(1); }
  }
</style>
