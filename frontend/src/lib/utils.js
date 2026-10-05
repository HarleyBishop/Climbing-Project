import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// The standard shadcn/Magic UI helper: clsx builds the class string from
// conditionals, twMerge resolves conflicts so a `className` prop passed in
// (e.g. "p-0") overrides the component's default ("p-4") instead of both
// ending up in the DOM.
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
