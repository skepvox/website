<template>
  <!-- The outer <a href="/"> comes from VPNavBarTitle -->
  <!-- The mark renders the existing horse+rider logo.svg as a stencil (mask) filled with
       the brand-mark token, so geometry is unchanged and the legacy green is retired from
       the nav. aria-hidden: the visible "skepvox" wordmark carries the accessible name. -->
  <span class="logo" aria-hidden="true"></span>
  <span class="text">skepvox</span>
</template>

<style scoped>
.logo {
  display: inline-block;
  position: relative;
  width: 36px;
  height: 36px;
  /* Recolour the mark via the dedicated --sk-brand-mark token (ink-blue on light, warm
     ivory on dark) instead of the green baked into logo.svg — and via background-color,
     not currentColor, so the surrounding link's hover/active colour never tints it. */
  background-color: var(--sk-brand-mark);
  -webkit-mask: url(/logo.svg) center / contain no-repeat;
  mask: url(/logo.svg) center / contain no-repeat;
  /* Fade the lockup as one object: the logo fill and the wordmark colour share the same
     token, duration and easing, so they are the same colour at every frame of the theme
     fade — no part snaps or lags. */
  transition: background-color 0.32s var(--sk-ease, ease);
}

/* Increase this padding if you want more space */
.logo + .text {
  padding-left: 8px; /* try 10px or 12px if you like */
}

.text {
  /* Same brand-mark token as the logo, so the lockup is one colour in light and dark and
     fades in lockstep with the mark (overrides the inherited nav-link colour/transition,
     so the wordmark never fades through a mismatched tone while the logo holds). */
  color: var(--sk-brand-mark);
  font-size: 16px;
  font-weight: 500;
  transition: color 0.32s var(--sk-ease, ease);
}
</style>
