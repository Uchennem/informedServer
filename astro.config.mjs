// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import netlify from '@astrojs/netlify';

import svelte from '@astrojs/svelte';

// https://astro.build/config
const deployTarget = process.env.DEPLOY_TARGET ?? 'node';
const adapter = deployTarget === 'netlify' ? netlify() : node({ mode: 'standalone' });

export default defineConfig({
  output: 'server',
  adapter,
  integrations: [svelte()]
});