import { atom } from 'nanostores';

type RsvpCounts = Record<string, number>;

export const rsvpCounts = atom<RsvpCounts>({});

export function initializeRsvpCount(postId: string, count: number) {
  if (!postId) return;

  const current = rsvpCounts.get();
  if (current[postId] === undefined) {
    rsvpCounts.set({ ...current, [postId]: count });
  }
}

export function setRsvpCount(postId: string, count: number) {
  if (!postId) return;
  rsvpCounts.set({ ...rsvpCounts.get(), [postId]: count });
}
