# Vercel SEO Testing Checklist (ENEM 2025)

Use this guide to validate redirects, canonical URLs, and sitemap behavior
after a Vercel deployment.

## 1) Deploy to Vercel

- Trigger a Preview or Production deploy.
- Wait until the deployment is ready.

## 2) Test the canonical question pages

Pick a canonical URL and confirm it loads correctly:

- `https://skepvox.com/enem/2025/matematica/questao/2025-136`
- `https://skepvox.com/enem/2025/ciencias-da-natureza/questao/2025-091`

Checklist:

- The page renders the full question content.
- The `<link rel="canonical">` points to the same URL.
- The page includes `Mapeamento de cadernos`.

Optional header check:

```bash
curl -I https://skepvox.com/enem/2025/matematica/questao/2025-136
```

Expected: `200 OK`.

## 3) Test alias redirects (color and caderno number)

Example alias URLs (these should 301 to the canonical question page):

- Color alias:  
  `https://skepvox.com/enem/2025/matematica/caderno-azul/questao-149`
- Number alias:  
  `https://skepvox.com/enem/2025/matematica/caderno-7/questao-149`
  
- Natureza color alias:  
  `https://skepvox.com/enem/2025/ciencias-da-natureza/caderno-amarelo/questao-109`
- Natureza number alias:  
  `https://skepvox.com/enem/2025/ciencias-da-natureza/caderno-5/questao-109`

Check that both redirect to:

- `https://skepvox.com/enem/2025/matematica/questao/2025-136`
- `https://skepvox.com/enem/2025/ciencias-da-natureza/questao/2025-091`

Command-line verification:

```bash
curl -I https://skepvox.com/enem/2025/matematica/caderno-azul/questao-149
curl -I https://skepvox.com/enem/2025/matematica/caderno-7/questao-149
curl -I https://skepvox.com/enem/2025/ciencias-da-natureza/caderno-amarelo/questao-109
curl -I https://skepvox.com/enem/2025/ciencias-da-natureza/caderno-5/questao-109
```

Expected: `301 Moved Permanently` with `Location` pointing to the canonical URL.

## 4) Verify the sitemap

Open:

- `https://skepvox.com/sitemap.xml`

Checklist:

- Canonical question pages exist:  
  `/enem/2025/matematica/questao/2025-136` through `/2025-180`
  `/enem/2025/ciencias-da-natureza/questao/2025-091` through `/2025-135`
- No alias URLs appear (`/caderno-*/questao-*` should be absent).

Optional search:

```bash
curl -s https://skepvox.com/sitemap.xml | rg "enem/2025/matematica/questao"
curl -s https://skepvox.com/sitemap.xml | rg "enem/2025/ciencias-da-natureza/questao"
curl -s https://skepvox.com/sitemap.xml | rg "caderno-"
```

Expected: results for `questao/2025-` and no results for `caderno-`.

## 5) Spot-check JSON endpoint

The canonical page links to the JSON question data:

- `https://skepvox.com/enem/2025/questions/2025-136.json`
- `https://skepvox.com/enem/2025/questions/2025-091.json`

Optional check:

```bash
curl -I https://skepvox.com/enem/2025/questions/2025-136.json
```

Expected: `200 OK`.
