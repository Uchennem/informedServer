<script lang="ts">
  import { feedPosts, type FeedPost } from '../lib/postsStore';
  import { buildClientApiUrl } from '../lib/api';

  const CATEGORIES = ['Events', 'Workshops', 'Networking', 'Announcements', 'General'] as const;

  let title = '';
  let body = '';
  let category = CATEGORIES[0];

  let submitting = false;
  let error = '';
  let open = false;

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    submitting = true;

    try {
      const res = await fetch(buildClientApiUrl('/api/posts'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, category }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        error = data.error ?? `Request failed (${res.status})`;
        return;
      }

      const newPost: FeedPost = await res.json();

      // Optimistically prepend to the Nano Store atom
      feedPosts.set([newPost, ...$feedPosts]);

      // Notify the SSR feed page so it can refresh the server-rendered list
      window.dispatchEvent(new CustomEvent('informed:post-created', { detail: newPost }));

      // Reset form and collapse
      title = '';
      body = '';
      category = CATEGORIES[0];
      open = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    } finally {
      submitting = false;
    }
  }
</script>

<!-- Toggle button (always visible) -->
<button
  type="button"
  class="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-nc-border-subtle bg-nc-bg-elevated text-nc-text-muted hover:text-nc-text-primary hover:border-nc-accent-primary/40 transition-all duration-200 cursor-text"
  on:click={() => (open = true)}
  aria-label="Create a new post"
>
  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
  </svg>
  <span class="text-sm">Share something with campus…</span>
</button>

<!-- Expanded form panel -->
{#if open}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
    role="presentation"
    on:click={() => !submitting && (open = false)}
  ></div>

  <!-- Modal card -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-label="Create post"
  >
    <div class="card w-full max-w-lg shadow-2xl border border-nc-border-subtle relative">
      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-base font-bold text-nc-text-primary font-display tracking-wide uppercase">
          New Post
        </h2>
        <button
          type="button"
          class="w-7 h-7 rounded-full flex items-center justify-center text-nc-text-subtle hover:text-nc-text-primary hover:bg-nc-bg-elevated transition-all"
          on:click={() => (open = false)}
          disabled={submitting}
          aria-label="Close"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <form on:submit={handleSubmit} novalidate class="space-y-4">
        <!-- Title -->
        <div>
          <label for="post-title" class="block text-xs font-semibold text-nc-text-subtle uppercase tracking-wider mb-1.5">
            Title
          </label>
          <input
            id="post-title"
            type="text"
            bind:value={title}
            required
            maxlength={120}
            placeholder="What's happening?"
            disabled={submitting}
            class="w-full rounded-lg border border-nc-border-subtle bg-nc-bg-root px-3 py-2.5 text-sm text-nc-text-primary placeholder:text-nc-text-muted focus:outline-none focus:border-nc-accent-primary focus:ring-1 focus:ring-nc-accent-primary transition disabled:opacity-50"
          />
        </div>

        <!-- Body -->
        <div>
          <label for="post-body" class="block text-xs font-semibold text-nc-text-subtle uppercase tracking-wider mb-1.5">
            Body
          </label>
          <textarea
            id="post-body"
            bind:value={body}
            required
            maxlength={2000}
            rows={4}
            placeholder="Give people some details…"
            disabled={submitting}
            class="w-full rounded-lg border border-nc-border-subtle bg-nc-bg-root px-3 py-2.5 text-sm text-nc-text-primary placeholder:text-nc-text-muted focus:outline-none focus:border-nc-accent-primary focus:ring-1 focus:ring-nc-accent-primary transition resize-none disabled:opacity-50"
          ></textarea>
        </div>

        <!-- Category dropdown -->
        <div>
          <label for="post-category" class="block text-xs font-semibold text-nc-text-subtle uppercase tracking-wider mb-1.5">
            Category
          </label>
          <select
            id="post-category"
            bind:value={category}
            disabled={submitting}
            class="w-full rounded-lg border border-nc-border-subtle bg-nc-bg-root px-3 py-2.5 text-sm text-nc-text-primary focus:outline-none focus:border-nc-accent-primary focus:ring-1 focus:ring-nc-accent-primary transition disabled:opacity-50 cursor-pointer"
          >
            {#each CATEGORIES as cat}
              <option value={cat}>{cat}</option>
            {/each}
          </select>
        </div>

        <!-- Error message -->
        {#if error}
          <p class="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        {/if}

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-1">
          <button
            type="button"
            class="btn-secondary text-sm"
            on:click={() => (open = false)}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn-primary text-sm min-w-[90px]"
            disabled={submitting || !title.trim() || !body.trim()}
          >
            {#if submitting}
              <span class="inline-flex items-center gap-2">
                <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Posting…
              </span>
            {:else}
              Post
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
