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

<button type="button" on:click={goToProfile}>
  Connect
</button>

<style>
  button {
    border: 1px solid #d1d5db;
    background: #ffffff;
    border-radius: 0.5rem;
    padding: 0.4rem 0.75rem;
    cursor: pointer;
    font-size: 0.875rem;
    align-self: flex-start;
  }

  button:hover {
    background: #f9fafb;
  }
</style>