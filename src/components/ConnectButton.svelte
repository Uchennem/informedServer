<script lang="ts">
  type Props = {
    userId: string;
    mode?: 'view' | 'connect';
  };

  let { userId, mode = 'view' }: Props = $props();
  let isPending = $state(false);

  function goToProfile() {
    if (!userId) return;

    if (mode === 'connect') {
      isPending = !isPending;
      return;
    }

    window.location.href = `/profile/${userId}`;
  }
</script>

<button
  type="button"
  onclick={goToProfile}
  class={`${mode === 'connect' && isPending ? 'btn-secondary' : 'btn-primary'} text-xs py-1 px-2 active:scale-95`}
>
  {#if mode === 'connect'}
    {isPending ? 'Pending' : 'Connect'}
  {:else}
    View Profile
  {/if}
</button>