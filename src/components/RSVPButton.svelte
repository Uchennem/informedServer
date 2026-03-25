<script>
  export let initialCount = 0;

  let count = initialCount;

  function handleClick() {
    count += 1;
  }
</script>

<button type="button" onclick={handleClick} class="btn-primary text-sm">
  RSVP ({count})
</button>