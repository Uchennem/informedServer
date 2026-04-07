<script lang="ts">
  import { buildClientApiUrl } from '../lib/api';

  let {
    id,
    type,
    senderName,
    senderId,
    read: initialRead,
    createdAt,
  }: {
    id: string;
    type: string;
    senderName: string;
    senderId: string;
    read: boolean;
    createdAt: string | Date;
  } = $props();

  let readOverride = $state<boolean | null>(null);
  let actionDone = $state<'accepted' | 'declined' | null>(null);
  let acting = $state(false);
  let actionError = $state('');

  const read = $derived(readOverride ?? initialRead);

  $effect(() => {
    if (!read) {
      fetch(buildClientApiUrl(`/api/notifications/${id}/read`), {
        method: 'PATCH',
        credentials: 'include',
      })
        .then(() => { readOverride = true; })
        .catch(() => {});
    }
  });

  async function handleConnect(action: 'accept' | 'decline') {
    acting = true;
    actionError = '';
    try {
      const res = await fetch(buildClientApiUrl(`/api/users/${senderId}/connect`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        actionDone = action === 'accept' ? 'accepted' : 'declined';
        await fetch(buildClientApiUrl(`/api/notifications/${id}/read`), {
          method: 'PATCH',
          credentials: 'include',
        });
        readOverride = true;
      } else {
        const data = await res.json().catch(() => ({}));
        actionError = data.error ?? 'Action failed.';
      }
    } catch {
      actionError = 'Something went wrong.';
    } finally {
      acting = false;
    }
  }

  function formatTime(date: string | Date) {
    return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
</script>

<div class={`flex items-start gap-3 p-4 border-[2px] transition-all ${read ? 'border-nc-border-subtle bg-nc-bg-root' : 'border-nc-accent-primary/50 bg-nc-accent-primary/5'}`}>
  <div class="w-9 h-9 rounded-full bg-gradient-to-br from-nc-accent-primary to-nc-accent-secondary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
    {(senderName?.[0] ?? '?').toUpperCase()}
  </div>

  <div class="flex-1 min-w-0">
    {#if type === 'connection_request'}
      <p class="text-sm text-nc-text-primary">
        <span class="font-bold">{senderName}</span> wants to connect with you.
      </p>
      <p class="text-[11px] text-nc-text-muted mt-0.5">{formatTime(createdAt)}</p>

      {#if actionDone}
        <p class="text-xs mt-2 font-semibold {actionDone === 'accepted' ? 'text-nc-accent-primary' : 'text-nc-text-muted'}">
          {actionDone === 'accepted' ? 'Connected!' : 'Request declined.'}
        </p>
      {:else}
        <div class="flex gap-2 mt-2">
          <button
            type="button"
            onclick={() => handleConnect('accept')}
            disabled={acting}
            class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-nc-accent-primary text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all disabled:opacity-50"
          >
            Accept
          </button>
          <button
            type="button"
            onclick={() => handleConnect('decline')}
            disabled={acting}
            class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 border-nc-border-subtle text-nc-text-muted hover:border-nc-destructive hover:text-nc-destructive transition-all disabled:opacity-50"
          >
            Decline
          </button>
        </div>
        {#if actionError}
          <p class="text-xs text-red-400 mt-1">{actionError}</p>
        {/if}
      {/if}

    {:else if type === 'connection_accepted'}
      <p class="text-sm text-nc-text-primary">
        <span class="font-bold">{senderName}</span> accepted your connection request.
      </p>
      <p class="text-[11px] text-nc-text-muted mt-0.5">{formatTime(createdAt)}</p>

    {:else}
      <p class="text-sm text-nc-text-primary">{senderName}: {type}</p>
      <p class="text-[11px] text-nc-text-muted mt-0.5">{formatTime(createdAt)}</p>
    {/if}
  </div>

  {#if !read}
    <div class="w-2 h-2 rounded-none bg-nc-accent-primary flex-shrink-0 mt-1.5"></div>
  {/if}
</div>
