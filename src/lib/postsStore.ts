import { atom } from 'nanostores';

export type FeedPost = {
  _id: string;
  title: string;
  body: string;
  category: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  // Legacy / optional fields used by PostCard.astro
  description?: string;
  author?: string;
  rsvpCount?: number;
  date?: string;
  location?: string;
};

/**
 * feedPosts — Nano Store atom holding the in-memory list of feed posts.
 *
 * Starts empty; CreatePostForm.svelte prepends new posts on a successful
 * POST /api/posts so any Svelte island subscribed to this atom updates
 * instantly without waiting for a full page reload.
 *
 * Access in Svelte:  import { feedPosts } from '$lib/postsStore';
 *                    $feedPosts   (reactive subscription)
 */
export const feedPosts = atom<FeedPost[]>([]);
