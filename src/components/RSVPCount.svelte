<script lang="ts">
  import { onDestroy } from 'svelte';
  import { initializeRsvpCount, rsvpCounts } from '../stores/rsvp';

  export let postId = '';
  export let initialCount = 0;

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
</script>

<span>{count} going</span>
