<script lang="ts">
  import { feedPosts, type FeedPost } from '../lib/postsStore';
  import { buildClientApiUrl } from '../lib/api';

  const CATEGORIES = ['Events', 'Workshops', 'Networking', 'Announcements', 'General'] as const;

  let title = '';
  let body = '';
  let category = CATEGORIES[0];
  let eventDate = '';
  let location = '';
  let maxAttendees = '';

  let submitting = false;
  let error = '';
  let open = false;
  let dragOver = false;
  let attachedFile: File | null = null;

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    submitting = true;

    try {
      const res = await fetch(buildClientApiUrl('/api/posts'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, category, eventDate, location, maxAttendees: maxAttendees ? Number(maxAttendees) : 0 }),
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
      eventDate = '';
      location = '';
      maxAttendees = '';
      open = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    } finally {
      submitting = false;
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      attachedFile = file;
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    dragOver = true;
  }

  function handleDragLeave() {
    dragOver = false;
  }

  function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      attachedFile = file;
    }
  }

  function removeFile() {
    attachedFile = null;
  }
</script>

<!-- Toggle button (always visible) -->
<button
  type="button"
  class="w-full flex items-center gap-3 px-4 py-3 border-[2px] border-nc-border-subtle bg-nc-bg-elevated text-nc-text-muted hover:text-black hover:bg-nc-text-primary hover:border-black hover:shadow-[4px_4px_0px_0px_var(--nc-accent-primary)] hover:-translate-y-1 hover:-translate-x-1 transition-all duration-150 font-sans font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_0px_var(--nc-border-subtle)]"
  on:click={() => (open = true)}
  aria-label="Create a new post"
>
  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
  </svg>
  <span>Post something to campus…</span>
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
    class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center"
    role="dialog"
    aria-modal="true"
    aria-label="Create post"
  >
    <div class="card relative w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain shadow-[8px_8px_0px_0px_var(--nc-accent-primary)] border-[3px] border-nc-accent-primary">
      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-base font-bold text-nc-text-primary font-display tracking-wide uppercase">
          New Post
        </h2>
        <button
          type="button"
          class="w-8 h-8 flex items-center justify-center text-nc-text-subtle hover:text-black hover:bg-nc-accent-primary border-2 border-nc-border-subtle hover:border-black transition-all"
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

        <!-- Event Date/Time -->
        <div>
          <label for="post-event-date" class="block text-xs font-semibold text-nc-text-subtle uppercase tracking-wider mb-1.5">
            When
          </label>
          <input
            id="post-event-date"
            type="datetime-local"
            bind:value={eventDate}
            required
            disabled={submitting}
            class="w-full rounded-lg border border-nc-border-subtle bg-nc-bg-root px-3 py-2.5 text-sm text-nc-text-primary focus:outline-none focus:border-nc-accent-primary focus:ring-1 focus:ring-nc-accent-primary transition disabled:opacity-50"
          />
        </div>

        <!-- Location -->
        <div>
          <label for="post-location" class="block text-xs font-semibold text-nc-text-subtle uppercase tracking-wider mb-1.5">
            Location <span class="font-normal text-nc-text-muted normal-case">(optional)</span>
          </label>
          <input
            id="post-location"
            type="text"
            bind:value={location}
            placeholder="Building / Room / Online"
            disabled={submitting}
            class="w-full rounded-lg border border-nc-border-subtle bg-nc-bg-root px-3 py-2.5 text-sm text-nc-text-primary placeholder:text-nc-text-muted focus:outline-none focus:border-nc-accent-primary focus:ring-1 focus:ring-nc-accent-primary transition disabled:opacity-50"
          />
        </div>

        <!-- Max Attendees -->
        <div>
          <label for="post-max-attendees" class="block text-xs font-semibold text-nc-text-subtle uppercase tracking-wider mb-1.5">
            Max Attendees <span class="font-normal text-nc-text-muted normal-case">(optional)</span>
          </label>
          <input
            id="post-max-attendees"
            type="number"
            bind:value={maxAttendees}
            min="0"
            placeholder="0 = unlimited"
            disabled={submitting}
            class="w-full rounded-lg border border-nc-border-subtle bg-nc-bg-root px-3 py-2.5 text-sm text-nc-text-primary placeholder:text-nc-text-muted focus:outline-none focus:border-nc-accent-primary focus:ring-1 focus:ring-nc-accent-primary transition disabled:opacity-50"
          />
        </div>

        <!-- Industrial Dropzone -->
        <div>
          <label for="post-media" class="block text-xs font-semibold text-nc-text-subtle uppercase tracking-wider mb-1.5">
            Media (Optional)
          </label>
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="dropzone {dragOver ? 'dropzone--active' : ''} {attachedFile ? 'dropzone--has-file' : ''}"
            on:drop={handleDrop}
            on:dragover={handleDragOver}
            on:dragleave={handleDragLeave}
          >
            {#if attachedFile}
              <div class="flex items-center gap-3">
                <span class="text-nc-accent-primary font-bold text-xs uppercase tracking-wider">✓ {attachedFile.name}</span>
                <button type="button" class="text-nc-destructive font-bold text-xs uppercase hover:underline" on:click={removeFile}>REMOVE</button>
              </div>
            {:else}
              <svg class="w-8 h-8 text-nc-text-subtle mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <p class="text-[11px] font-bold uppercase tracking-widest text-nc-text-subtle mb-1">Drop image here or click to browse</p>
              <p class="text-[9px] uppercase tracking-wider text-nc-text-subtle/60">PNG, JPG, GIF up to 5MB</p>
              <input id="post-media" type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-cell" on:change={handleFileInput} />
            {/if}
          </div>
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
            disabled={submitting || !title.trim() || !body.trim() || !eventDate}
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

<style>
  .dropzone {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    border: 4px dashed var(--nc-border-subtle);
    background: #0a0a0a;
    padding: 1.5rem;
    text-align: center;
    transition: all 150ms ease;
    cursor: cell;
  }

  .dropzone:hover {
    border-color: var(--nc-accent-primary);
    background: #111;
  }

  .dropzone--active {
    border-color: var(--nc-accent-primary) !important;
    background: repeating-linear-gradient(
      45deg,
      #000,
      #000 10px,
      var(--nc-accent-primary) 10px,
      var(--nc-accent-primary) 20px
    ) !important;
    animation: hazardPulse 0.3s linear infinite;
  }

  .dropzone--has-file {
    border-style: solid;
    border-color: var(--nc-accent-primary);
    background: rgba(204, 255, 0, 0.05);
  }

  @keyframes hazardPulse {
    0% { background-position: 0px 0px; }
    100% { background-position: 28.28px 28.28px; }
  }
</style>
