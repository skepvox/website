<template>
  <section id="hero">
    <h1 class="tagline">
      <span class="accent">skepvox</span>
      <br />Engenharia de Letras
    </h1>
    <p class="description">Louis Lavelle e literatura clássica.</p>
    <p class="actions">
      <a class="get-started" href="/louis-lavelle/">Louis Lavelle</a>
      <a class="setup" href="/literatura/">Literatura</a>
      <a class="setup" href="/podcast/">Podcasts</a>
    </p>
  </section>

  <section id="highlights" class="vt-box-container">
    <div class="vt-box">
      <h2>Louis Lavelle</h2>
      <p>
        Obras e estudos de Louis Lavelle reunidos em uma navegação simples, com foco em leitura
        contínua e referência.
      </p>
    </div>
    <div class="vt-box">
      <h2>Literatura</h2>
      <p>
        Biblioteca digital de obras clássicas, com ênfase em autores brasileiros e leitura em
        formato limpo.
      </p>
    </div>
  </section>
</template>

<style scoped>
section {
  padding: 42px 32px;
}

#hero {
  padding: 96px 32px;
  text-align: center;
}

.tagline {
  font-size: 76px;
  line-height: 1.25;
  font-weight: 900;
  letter-spacing: -1.5px;
  max-width: 960px;
  margin: 0px auto;
  color: var(--vt-c-text-1);
}

.accent {
  color: var(--vt-c-brand, #3c8772);
}

.description {
  max-width: 960px;
  line-height: 1.5;
  color: var(--vt-c-text-2);
  transition: color 0.5s;
  font-size: 22px;
  margin: 24px auto 40px;
}

.actions a {
  font-size: 16px;
  display: inline-block;
  background-color: var(--vt-c-bg-mute);
  padding: 8px 18px;
  font-weight: 500;
  border-radius: 8px;
  transition:
    background-color 0.5s,
    color 0.5s;
  color: var(--vt-c-text-code);
}

.actions .get-started,
.actions .setup {
  margin-right: 18px;
}

.actions .get-started:hover,
.actions .setup:hover {
  background-color: var(--vt-c-gray-light-4);
  transition-duration: 0.2s;
}

.dark .actions .get-started:hover,
.dark .actions .setup:hover {
  background-color: var(--vt-c-gray-dark-3);
}

#highlights {
  max-width: 960px;
  margin: 0px auto;
  color: var(--vt-c-text-2);
}

#highlights h2 {
  font-weight: 600;
  font-size: 20px;
  letter-spacing: -0.4px;
  color: var(--vt-c-text-1);
  transition: color 0.5s;
  margin-bottom: 0.75em;
}

#highlights p {
  font-weight: 400;
  font-size: 15px;
}

#highlights .vt-box {
  background-color: transparent;
}

@media (max-width: 960px) {
  .tagline {
    font-size: 64px;
    letter-spacing: -0.5px;
  }
  .description {
    font-size: 18px;
    margin-bottom: 48px;
  }
}

@media (max-width: 794px) {
  .tagline {
    font-size: 48px;
    letter-spacing: -0.5px;
  }
}

@media (max-width: 576px) {
  #hero {
    padding: 56px 32px;
  }
  .description {
    font-size: 16px;
    margin: 18px 0 30px;
  }
  #highlights .vt-box {
    padding: 20px 36px;
  }
  .actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }
  .actions a {
    margin: 0;
  }
}

@media (max-width: 370px) {
  .tagline {
    font-size: 36px;
  }
}
</style>
