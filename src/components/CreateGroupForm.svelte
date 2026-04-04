<script lang="ts">
  import { buildClientApiUrl } from '../lib/api';

  let open = $state(false);
  let name = $state('');
  let description = $state('');
  let tags = $state<string[]>([]);
  let tagInput = $state('');
  let submitting = $state(false);
  let error = $state('');

  function addTag() {
    const trimmed = tagInput.trim().replace(/,$/, '').trim();
    if (trimmed && !tags.includes(trimmed)) {
      tags = [...tags, trimmed];
    }
    tagInput = '';
  }

  function removeTag(tag: string) {
    tags = tags.filter(t => t !== tag);
  }

  function handleTagKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    submitting = true;
    error = '';
    try {
      const res = await fetch(buildClientApiUrl('/api/groups'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, tags }),
      });
      if (res.ok) {
        const newGroup = await res.json();
        window.dispatchEvent(new CustomEvent('informed:group-created', { detail: newGroup, bubbles: true }));
        name = '';
        description = '';
        tags = [];
        tagInput = '';
        open = false;
      } else {
        const data = await res.json().catch(() => ({}));
        error = data.error ?? `Request failed (${res.status})`;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Something went wrong.';
    } finally {
      submitting = false;
    }
  }
</script>

<button
  type="button"
  onclick={() => (open = true)}
  class="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-[2px] border-nc-border-subtle bg-nc-bg-elevated text-nc-text-primary hover:bg-nc-text-primary hover:text-black hover:border-black hover:shadow-[4px_4px_0px_0px_var(--nc-accent-primary)] hover:-translate-y-1 hover:-translate-x-1 transition-all duration-150 shadow-[2px_2px_0px_0px_var(--nc-border-subtle)]"
>
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
  </svg>
  Create Group
</button>

{#if open}
  <div
    class="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
    role="presentation"
    onclick={() => !submitting && (open = false)}
  ></div>

  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-label="Create group"
  >
    <div class="card w-full max-w-lg shadow-[8px_8px_0px_0px_var(--nc-accent-primary)] border-[3px] border-nc-accent-primary relative">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-base font-bold text-nc-text-primary font-display tracking-wide uppercase">New Group</h2>
        <button
          type="button"
          class="w-8 h-8 flex items-center justify-center text-nc-text-subtle hover:text-black hover:bg-nc-accent-primary border-2 border-nc-border-subtle hover:border-black transition-all"
          onclick={() => (open = false)}
          disabled={submitting}
          aria-label="Close"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <form onsubmit={handleSubmit} novalidate class="space-y-4">
        <div>
          <label for="group-name" class="block text-xs font-semibold text-nc-text-subtle uppercase tracking-wider mb-1.5">Name</label>
          <input
            id="group-name"
            type="text"
            bind:value={name}
            required
            maxlength={80}
            placeholder="Group name"
            disabled={submitting}
            class="w-full rounded-lg border border-nc-border-subtle bg-nc-bg-root px-3 py-2.5 text-sm text-nc-text-primary placeholder:text-nc-text-muted focus:outline-none focus:border-nc-accent-primary focus:ring-1 focus:ring-nc-accent-primary transition disabled:opacity-50"
          />
        </div>

        <div>
          <label for="group-description" class="block text-xs font-semibold text-nc-text-subtle uppercase tracking-wider mb-1.5">Description <span class="font-normal text-nc-text-muted normal-case">(optional)</span></label>
          <textarea
            id="group-description"
            bind:value={description}
            maxlength={500}
            rows={3}
            placeholder="What is this group about?"
            disabled={submitting}
            class="w-full rounded-lg border border-nc-border-subtle bg-nc-bg-root px-3 py-2.5 text-sm text-nc-text-primary placeholder:text-nc-text-muted focus:outline-none focus:border-nc-accent-primary focus:ring-1 focus:ring-nc-accent-primary transition resize-none disabled:opacity-50"
          ></textarea>
        </div>

        <div>
          <label for="group-tags" class="block text-xs font-semibold text-nc-text-subtle uppercase tracking-wider mb-1.5">Tags <span class="font-normal text-nc-text-muted normal-case">(optional — press Enter or comma to add)</span></label>
          {#if tags.length > 0}
            <div class="flex flex-wrap gap-1.5 mb-2">
              {#each tags as tag}
                <span class="inline-flex items-center gap-1 text-xs bg-nc-accent-primary/15 text-nc-accent-primary border border-nc-accent-primary/30 rounded-full px-2.5 py-0.5 font-semibold">
                  {tag}
                  <button type="button" onclick={() => removeTag(tag)} class="hover:text-nc-destructive transition-colors" aria-label="Remove tag">×</button>
                </span>
              {/each}
            </div>
          {/if}
          <input
            id="group-tags"
            type="text"
            bind:value={tagInput}
            onkeydown={handleTagKeydown}
            placeholder="e.g. coding, design, business"
            disabled={submitting}
            class="w-full rounded-lg border border-nc-border-subtle bg-nc-bg-root px-3 py-2.5 text-sm text-nc-text-primary placeholder:text-nc-text-muted focus:outline-none focus:border-nc-accent-primary focus:ring-1 focus:ring-nc-accent-primary transition disabled:opacity-50"
          />
        </div>

        {#if error}
          <p class="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        {/if}

        <div class="flex justify-end gap-3 pt-1">
          <button type="button" class="btn-secondary text-sm" onclick={() => (open = false)} disabled={submitting}>Cancel</button>
          <button
            type="submit"
            class="btn-primary text-sm min-w-[100px]"
            disabled={submitting || !name.trim()}
          >
            {#if submitting}
              <span class="inline-flex items-center gap-2">
                <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Creating…
              </span>
            {:else}
              Create Group
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
