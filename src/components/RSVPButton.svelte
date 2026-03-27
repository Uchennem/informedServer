<script>
  let going = false;
  let animating = false;

  function handleClick() {
    animating = true;
    setTimeout(() => { animating = false; }, 300);
    going = !going;
  }
</script>

<button
  type="button"
  onclick={handleClick}
  class={`rsvp-btn ${going ? 'rsvp-btn--going' : 'rsvp-btn--default'} ${animating ? 'rsvp-btn--pulse' : ''}`}
  aria-pressed={going}
>
  {#if going}
    <svg class="rsvp-btn__icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
    Going
  {:else}
    <svg class="rsvp-btn__icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>
    RSVP
  {/if}
</button>

<style>
  .rsvp-btn {
    display: inline-flex;
    align-items: center;
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
  }

  .rsvp-btn__icon {
    width: 0.875rem;
    height: 0.875rem;
    flex-shrink: 0;
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
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

  .rsvp-btn:active {
    transform: scale(0.97);
  }
</style>