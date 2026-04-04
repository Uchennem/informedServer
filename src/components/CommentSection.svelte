<script lang="ts">
  import { buildClientApiUrl } from '../lib/api';

  let { postId }: { postId: string } = $props();

  type Comment = {
    id: string;
    postId: string;
    authorId: string;
    authorName: string;
    body: string;
    createdAt: string | Date;
  };

  let comments: Comment[] = $state([]);
  let newBody = $state('');
  let submitting = $state(false);
  let error = $state('');

  $effect(() => {
    fetch(buildClientApiUrl(`/api/posts/${postId}/comments`), { credentials: 'include' })
      .then(r => r.json())
      .then(data => { comments = Array.isArray(data) ? data : []; })
      .catch(() => {});
  });

  async function submit() {
    if (!newBody.trim()) return;
    submitting = true;
    error = '';
    try {
      const res = await fetch(buildClientApiUrl(`/api/posts/${postId}/comments`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newBody }),
      });
      if (res.ok) {
        const comment = await res.json();
        comments = [...comments, comment];
        newBody = '';
      } else if (res.status === 401) {
        error = 'Sign in to comment.';
      } else {
        const data = await res.json().catch(() => ({}));
        error = data.error ?? 'Failed to post comment.';
      }
    } catch {
      error = 'Something went wrong.';
    } finally {
      submitting = false;
    }
  }

  function formatTime(date: string | Date) {
    return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
</script>

<div class="space-y-3">
  {#if comments.length > 0}
    <ul class="space-y-2">
      {#each comments as comment (comment.id)}
        <li class="flex gap-2.5">
          <div class="w-7 h-7 rounded-full bg-gradient-to-br from-nc-accent-primary to-nc-accent-secondary flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
            {(comment.authorName?.[0] ?? '?').toUpperCase()}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-baseline gap-2 flex-wrap">
              <span class="text-xs font-semibold text-nc-text-primary">{comment.authorName}</span>
              <span class="text-[10px] text-nc-text-muted">{formatTime(comment.createdAt)}</span>
            </div>
            <p class="text-xs text-nc-text-muted mt-0.5 break-words">{comment.body}</p>
          </div>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="text-xs text-nc-text-muted">No comments yet. Be the first!</p>
  {/if}

  <div class="flex gap-2 pt-1">
    <textarea
      bind:value={newBody}
      rows={2}
      placeholder="Add a comment…"
      disabled={submitting}
      class="flex-1 rounded-lg border border-nc-border-subtle bg-nc-bg-root px-3 py-2 text-xs text-nc-text-primary placeholder:text-nc-text-muted focus:outline-none focus:border-nc-accent-primary focus:ring-1 focus:ring-nc-accent-primary transition resize-none disabled:opacity-50"
    ></textarea>
    <button
      type="button"
      onclick={submit}
      disabled={submitting || !newBody.trim()}
      class="self-end px-3 py-2 text-xs font-bold uppercase tracking-wider bg-nc-accent-primary text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
    >
      {submitting ? '…' : 'Post'}
    </button>
  </div>

  {#if error}
    <p class="text-xs text-red-400">{error}</p>
  {/if}
</div>
