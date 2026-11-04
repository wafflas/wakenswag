/** Genie pop / shrink on product imagery. */
export const GENIE_DURATION_MS = 400;

/** Full-page route fade (main menu enter/leave). */
export const ROUTE_FADE_DURATION_MS = 500;

/** Wait long enough for stacked PDP open/close effects to finish. */
export const PRODUCT_DETAIL_EXIT_MS = GENIE_DURATION_MS;

export type FadeVariant = 'overlay' | 'route';

export const FADE_CLASSES: Record<FadeVariant, {enter: string; exit: string}> =
  {
    overlay: {
      enter: 'anim-fade-in',
      exit: 'anim-fade-out pointer-events-none',
    },
    route: {
      enter: 'route-fade-transition route-fade-transition--in',
      exit: 'route-fade-transition route-fade-transition--out pointer-events-none',
    },
  };
