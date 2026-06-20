<template>
  <!-- The outer <a href="/"> comes from VPNavBarTitle -->
  <img src="/logo.svg" alt="skepvox" class="logo" width="36" height="36" />
  <span class="text">skepvox</span>
</template>

<style scoped>
.logo {
  position: relative;
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
