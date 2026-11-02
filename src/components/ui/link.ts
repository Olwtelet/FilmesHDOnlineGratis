// Webflow "current link" marking: a link whose href equals the page route gets aria-current="page"
// and the class w--current appended last. Spread the result on the <a>:
//   <a {...wfLink('/work', currentPath, 'menu-link large w-inline-block')} data-hover="mainlink">
// (Astro drops the aria-current attribute when it is undefined.)

export function isCurrent(href: string, currentPath: string | undefined): boolean {
  return currentPath !== undefined && href === currentPath;
}

export function wfLink(href: string, currentPath: string | undefined, className: string) {
  const current = isCurrent(href, currentPath);
  return {
    href,
    class: current ? `${className} w--current` : className,
    'aria-current': current ? ('page' as const) : undefined,
  };
}
