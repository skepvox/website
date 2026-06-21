<template>
  <section id="hero">
    <h1 class="tagline">
      <span class="accent">skepvox</span>
      <br />Engenharia de Letras
    </h1>
  </section>

  <section id="highlights" class="vt-box-container">
    <a class="vt-box" href="/louis-lavelle/">
      <h2>Louis Lavelle</h2>
      <p>
        Obras e estudos de Louis Lavelle reunidos em uma navegação simples, com foco em leitura
        contínua e referência.
      </p>
    </a>
    <a class="vt-box" href="/literatura/">
      <h2>Literatura</h2>
      <p>
        Biblioteca digital de obras clássicas, com ênfase em autores brasileiros e leitura em
        formato limpo.
      </p>
    </a>
    <a class="vt-box" href="/podcast/">
      <h2>Podcasts</h2>
      <p>
        Projetos skepvox para aprendizagem de idiomas, com diálogos, transcrições, guias de estudo e
        áudio.
      </p>
    </a>
  </section>
</template>

<style scoped>
section {
  padding: 42px 32px;
}

#hero {
  padding: 96px 32px 64px;
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
  color: var(--sk-accent);
}

#highlights {
  max-width: 960px;
  margin: 0px auto;
  color: var(--vt-c-text-2);
}

#highlights .vt-box {
  display: block;
  text-decoration: none;
  color: inherit;
  background-color: var(--sk-surface-raised);
  border: 1px solid var(--vt-c-divider, #e2e2e3);
  border-radius: 8px;
  transition:
    border-color var(--sk-motion-base),
    background-color var(--sk-motion-base);
}

@media (hover: hover) and (pointer: fine) {
  #highlights .vt-box:hover {
    border-color: var(--sk-accent);
    background-color: var(--sk-surface);
  }
}

#highlights .vt-box:focus-visible {
  outline: var(--sk-focus-ring);
  outline-offset: var(--sk-focus-offset);
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
  font-size: var(--sk-text-sm);
}

@media (max-width: 960px) {
  .tagline {
    font-size: 64px;
    letter-spacing: -0.5px;
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
    padding: 56px 32px 42px;
  }
  #highlights .vt-box {
    padding: 20px 28px;
  }
}

@media (max-width: 370px) {
  .tagline {
    font-size: 36px;
  }
}
</style>
