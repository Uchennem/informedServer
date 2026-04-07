<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { buildClientApiUrl } from '../lib/api';

  let open = false;
  let query = '';
  let selectedIndex = 0;
  let inputEl: HTMLInputElement;

  const commands = [
    { label: 'Feed', description: 'Browse campus events & posts', href: '/feed', icon: '📡' },
    { label: 'Groups', description: 'Find and join student groups', href: '/groups', icon: '👥' },
    { label: 'People', description: 'Discover students like you', href: '/people', icon: '🔍' },
    { label: 'Saved', description: 'Your bookmarked posts', href: '/saved', icon: '🔖' },
    { label: 'Profile', description: 'View & edit your profile', href: '/profile/me', icon: '⚡' },
    { label: 'Create Post', description: 'Share something with campus', href: '/feed', action: 'create-post', icon: '✏️' },
    { label: 'Sign Out', description: 'Log out of Informed', href: '/login', action: 'logout', icon: '🚪' },
  ];

  $: filtered = query.trim()
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase()),
      )
    : commands;

  $: if (selectedIndex >= filtered.length) {
    selectedIndex = Math.max(0, filtered.length - 1);
  }

  function handleKeydown(e: KeyboardEvent) {
    // Open palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      open = !open;
      query = '';
      selectedIndex = 0;
      return;
    }

    if (!open) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      open = false;
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % filtered.length;
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + filtered.length) % filtered.length;
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(filtered[selectedIndex]);
      return;
    }
  }

  async function executeCommand(cmd: (typeof commands)[0]) {
    open = false;
    query = '';

    if (cmd.action === 'logout') {
      await fetch(buildClientApiUrl('/api/auth/sign-out'), {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {});
      document.cookie = 'better-auth.session_token=; Max-Age=0; path=/';
      window.location.href = '/login';
      return;
    }

    if (cmd.action === 'create-post') {
      window.location.href = '/feed';
      // Slight delay to let the page load, then trigger the create post form
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('informed:open-create-post'));
      }, 300);
      return;
    }

    window.location.href = cmd.href;
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
  });

  $: if (open && inputEl) {
    // Wait a tick for the DOM to render
    setTimeout(() => inputEl?.focus(), 10);
  }
</script>

{#if open}
  <!-- Backdrop -->
  <div
    class="cmd-backdrop"
    role="presentation"
    on:click={() => (open = false)}
  ></div>

  <!-- Palette -->
  <div class="cmd-palette" role="dialog" aria-modal="true" aria-label="Command palette">
    <div class="cmd-header">
      <span class="cmd-prompt">{'>'}_</span>
      <input
        bind:this={inputEl}
        bind:value={query}
        type="text"
        class="cmd-input"
        placeholder="Type a command..."
        spellcheck="false"
        autocomplete="off"
      />
      <kbd class="cmd-kbd">ESC</kbd>
    </div>

    <div class="cmd-divider"></div>

    <ul class="cmd-list" role="listbox">
      {#each filtered as cmd, i (cmd.label)}
        <li role="none">
          <button
            type="button"
            role="option"
            aria-selected={i === selectedIndex}
            class="cmd-item {i === selectedIndex ? 'cmd-item--active' : ''}"
            on:click={() => executeCommand(cmd)}
            on:mouseenter={() => (selectedIndex = i)}
          >
            <span class="cmd-icon">{cmd.icon}</span>
            <div class="cmd-info">
              <span class="cmd-label">{cmd.label}</span>
              <span class="cmd-desc">{cmd.description}</span>
            </div>
            {#if i === selectedIndex}
            <span class="cmd-arrow">↵</span>
          {/if}
          </button>
        </li>
      {/each}

      {#if filtered.length === 0}
        <li class="cmd-empty">NO RESULTS FOUND</li>
      {/if}
    </ul>

    <div class="cmd-footer">
      <span>↑↓ Navigate</span>
      <span>↵ Select</span>
      <span>ESC Close</span>
    </div>
  </div>
{/if}

<style>
  .cmd-backdrop {
    position: fixed;
    inset: 0;
    z-index: 90;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(4px);
  }

  .cmd-palette {
    position: fixed;
    top: 15%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    width: 100%;
    max-width: 560px;
    background: #0a0a0a;
    border: 4px solid #CCFF00;
    box-shadow: 8px 8px 0px 0px #FF3E00, 0 0 60px rgba(204, 255, 0, 0.15);
    font-family: 'Space Mono', monospace;
    overflow: hidden;
  }

  .cmd-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: #111;
    border-bottom: 2px solid #333;
  }

  .cmd-prompt {
    color: #CCFF00;
    font-weight: 700;
    font-size: 1.25rem;
    flex-shrink: 0;
    animation: blink 1s step-end infinite;
  }

  @keyframes blink {
    50% { opacity: 0; }
  }

  .cmd-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: #EDEDED;
    font-family: 'Space Mono', monospace;
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    caret-color: #CCFF00;
  }

  .cmd-input::placeholder {
    color: #555;
    text-transform: uppercase;
  }

  .cmd-kbd {
    font-family: 'Space Mono', monospace;
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    background: #222;
    color: #888;
    border: 1px solid #444;
    padding: 0.2rem 0.5rem;
    flex-shrink: 0;
  }

  .cmd-divider {
    height: 2px;
    background: repeating-linear-gradient(
      90deg,
      #CCFF00 0px,
      #CCFF00 8px,
      transparent 8px,
      transparent 16px
    );
  }

  .cmd-list {
    list-style: none;
    margin: 0;
    padding: 0.5rem 0;
    max-height: 320px;
    overflow-y: auto;
  }

  .cmd-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1.25rem;
    background: transparent;
    border: none;
    cursor: cell;
    transition: all 100ms ease;
    border-left: 4px solid transparent;
    text-align: left;
    font: inherit;
  }

  .cmd-item--active {
    background: #1a1a1a;
    border-left-color: #CCFF00;
  }

  .cmd-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
    width: 1.5rem;
    text-align: center;
  }

  .cmd-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .cmd-label {
    color: #EDEDED;
    font-weight: 700;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .cmd-item--active .cmd-label {
    color: #CCFF00;
  }

  .cmd-desc {
    color: #666;
    font-size: 0.7rem;
    letter-spacing: 0.02em;
  }

  .cmd-arrow {
    color: #CCFF00;
    font-size: 0.875rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .cmd-empty {
    text-align: center;
    padding: 2rem;
    color: #555;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .cmd-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    padding: 0.6rem 1rem;
    background: #111;
    border-top: 2px solid #333;
    font-size: 0.6rem;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 700;
  }
</style>
