<script lang="ts">
  type Props = {
    userId: string;
  };

  let { userId }: Props = $props();

  function goToProfile() {
    if (!userId) return;
    window.location.href = `/profile/${userId}`;
  }
</script>

<button type="button" on:click={goToProfile} class="btn-primary text-xs py-1 px-2">
  View Profile
</button>