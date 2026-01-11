---
title: Brasil
description: "Mapa do Brasil para exploracao territorial com D3."
---

# Brasil

## Comparacao

<div class="demos-brasil-compare">
  <div>
    <h3>GeoJSON (D3)</h3>
    <DemosBrasilMapa />
  </div>
  <div>
    <h3>TopoJSON (Observable-style)</h3>
    <DemosBrasilMapaTopo />
  </div>
</div>

## Dados e fontes

- Estados (UF): [IBGE - Malhas territoriais](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais.html).
- Municipios: [IBGE - Malhas territoriais](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais.html).
- Converta os shapefiles para GeoJSON/TopoJSON e coloque em `src/public/demos-data/geo/`.
- Caminhos esperados no demo:
  - `src/public/demos-data/geo/brasil-estados.geojson`
  - `src/public/demos-data/geo/brasil-municipios.geojson`
  - `src/public/demos-data/geo/brasil-estados.topojson`
  - `src/public/demos-data/geo/brasil-municipios.topojson`

## API (IBGE Malhas v4)

```
https://servicodados.ibge.gov.br/api/v4/malhas/paises/BR?formato=application/vnd.geo+json
https://servicodados.ibge.gov.br/api/v4/malhas/paises/BR?intrarregiao=UF&formato=application/vnd.geo+json
https://servicodados.ibge.gov.br/api/v4/malhas/paises/BR?intrarregiao=municipio&formato=application/vnd.geo+json
https://servicodados.ibge.gov.br/api/v4/malhas/paises/BR?intrarregiao=UF&formato=application/json
https://servicodados.ibge.gov.br/api/v4/malhas/paises/BR?intrarregiao=municipio&qualidade=minima&formato=application/json
```

Obs: as malhas retornam apenas `codarea`. Para nomes, complemente com a API de localidades:

```
https://servicodados.ibge.gov.br/api/v1/localidades/estados
https://servicodados.ibge.gov.br/api/v1/localidades/municipios
```
