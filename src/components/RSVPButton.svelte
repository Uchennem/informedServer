<script>
  export let initialCount = 0;

  let count = initialCount;

  function handleClick() {
    count += 1;
  }
</script>

<button type="button" on:click={handleClick}>
  RSVP ({count})
</button>

<style>
  button {
    border: 1px solid #d1d5db;
    background: #ffffff;
    border-radius: 0.5rem;
    padding: 0.45rem 0.75rem;
    cursor: pointer;
    font-size: 0.875rem;
  }

  button:hover {
    background: #f9fafb;
  }
</style>