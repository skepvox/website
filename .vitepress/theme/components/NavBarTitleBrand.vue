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
}

/* Increase this padding if you want more space */
.logo + .text {
  padding-left: 8px; /* try 10px or 12px if you like */
}

.text {
  font-size: 16px;
  font-weight: 500;
}
</style>
