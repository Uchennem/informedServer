<script lang="ts">
  import { buildClientApiUrl } from '../lib/api';

  type Props = {
    availableTags?: string[];
  };

  let { availableTags = [] }: Props = $props();

  const defaultTags = [
    { label: 'Academic', icon: '📚' },
    { label: 'Social', icon: '🎉' },
    { label: 'Sports', icon: '⚽' },
    { label: 'Faith', icon: '🙏' },
    { label: 'Arts', icon: '🎨' },
    { label: 'Music', icon: '🎵' },
    { label: 'Gaming', icon: '🎮' },
    { label: 'Tech', icon: '💻' },
    { label: 'Film & Media', icon: '🎬' },
    { label: 'Fitness', icon: '💪' },
    { label: 'Cooking', icon: '🍳' },
    { label: 'Dance', icon: '💃' },
    { label: 'Photography', icon: '📸' },
    { label: 'Volunteering', icon: '🤝' },
    { label: 'Entrepreneurship', icon: '🚀' },
    { label: 'Politics', icon: '🏛️' },
    { label: 'Science', icon: '🔬' },
    { label: 'Reading', icon: '📖' },
    { label: 'Travel', icon: '✈️' },
    { label: 'Sustainability', icon: '🌱' },
  ];

  const tags = $derived(
    availableTags.length > 0
      ? availableTags.map(t => ({ label: t, icon: '•' }))
      : defaultTags,
  );

  let selected = $state<Set<string>>(new Set());
  let isSubmitting = $state(false);
  let errorMessage = $state('');

  function toggle(tag: string) {
    const next = new Set(selected);
    if (next.has(tag)) {
      next.delete(tag);
    } else {
      next.add(tag);
    }
    selected = next;
  }

  async function handleSubmit() {
    if (selected.size === 0) {
      errorMessage = 'Pick at least one interest to get started.';
      return;
    }

    isSubmitting = true;
    errorMessage = '';

    try {
      const response = await fetch(buildClientApiUrl('/api/users/interests'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests: Array.from(selected) }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Failed to save interests');
      }

      window.location.href = '/feed';
    } catch (error) {
      if (error instanceof Error && error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Could not save interests. Please try again.';
      }
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="w-full max-w-3xl mx-auto">
  <div class="flex flex-wrap gap-3 justify-center mb-8">
    {#each tags as tag}
      <button
        type="button"
        onclick={() => toggle(tag.label)}
        class="interest-chip"
        class:interest-chip--selected={selected.has(tag.label)}
        aria-pressed={selected.has(tag.label)}
      >
        <span class="interest-chip__icon">{tag.icon}</span>
        <span class="interest-chip__label">{tag.label}</span>
      </button>
    {/each}
  </div>

  {#if errorMessage}
    <p class="text-center text-sm mb-4" style="color: var(--nc-destructive);">{errorMessage}</p>
  {/if}

  <div class="flex flex-col items-center gap-3">
    <button
      type="button"
      onclick={handleSubmit}
      disabled={isSubmitting}
      class="btn-primary min-w-[200px]"
    >
      {isSubmitting ? 'Saving...' : `Continue (${selected.size} selected)`}
    </button>

  </div>
</div>

<style>
  .interest-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    border-radius: 9999px;
    border: 1.5px solid rgba(108, 99, 255, 0.35);
    background: rgba(108, 99, 255, 0.05);
    color: var(--nc-text-muted);
    font-family: 'Clash Grotesk', 'Work Sans', system-ui, sans-serif;
    font-weight: 500;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    user-select: none;
  }

  .interest-chip:hover {
    border-color: rgba(108, 99, 255, 0.6);
    background: rgba(108, 99, 255, 0.1);
    color: var(--nc-accent-primary);
    transform: scale(1.03);
  }

  .interest-chip--selected {
    background: var(--nc-accent-primary) !important;
    border-color: transparent !important;
    color: white !important;
    box-shadow: 0 4px 16px rgba(108, 99, 255, 0.5), inset 0 -2px 0 rgba(0, 0, 0, 0.15);
    transform: scale(1.05);
  }

  .interest-chip--selected:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 20px rgba(108, 99, 255, 0.6), inset 0 -2px 0 rgba(0, 0, 0, 0.15);
  }

  .interest-chip:active {
    transform: scale(0.97);
  }

  .interest-chip__icon {
    font-size: 1.1rem;
    line-height: 1;
  }

  .interest-chip__label {
    letter-spacing: 0.02em;
  }
</style>
