import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// The standard shadcn/Magic UI helper: clsx builds the class string from
// conditionals, twMerge resolves conflicts so a `className` prop passed in
// (e.g. "p-0") overrides the component's default ("p-4") instead of both
// ending up in the DOM.
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// "5m ago" / "3d ago", falling back to a date after a week.
export function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}
