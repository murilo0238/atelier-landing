# ATELIER — Arquitetura & Interiores (projeto conceito)

Landing page de portfólio da Garra Studios para uma marca **fictícia** de arquitetura.
No ar em **https://atelier.garrastudios.online**.

HTML, CSS e JavaScript puros, sem build e sem dependências. Fontes e imagens hospedadas no próprio site.

## Estrutura

```
index.html            página
favicon.svg
assets/css/style.css  estilos, responsividade e animações
assets/js/main.js     revelação ao rolar, barra fixa, menu mobile, seletor de projetos, formulário
assets/fonts/         Anton, Instrument Serif e Manrope (subconjunto latino, licença OFL)
assets/img/           fotos em WebP responsivo + og.jpg (fotos Unsplash)
deploy/publish.sh     publicação na VPS
scripts/check.mjs     verificação com Playwright (4 tamanhos de tela + comportamento)
package.json          dependência de teste (Playwright)
```

## Ver localmente

Abra `index.html` no navegador, ou sirva a pasta com qualquer servidor estático.

## Publicar

```bash
DEPLOY_HOST=usuario@IP_DA_VPS DEPLOY_KEY=~/.ssh/sua_chave bash deploy/publish.sh
```

O Nginx da VPS já serve `<slug>.garrastudios.online` a partir de `/var/www/demos/<slug>` (configuração `garra-demos`, certificado wildcard e `noindex`). O script troca a pasta de forma atômica e guarda a versão anterior em `/var/www/demos/.atelier.old`.

## Verificar

```bash
npm install
npx playwright install chromium
npm run check
```

Testa o site em 4 tamanhos de tela (sem rolagem horizontal e sem erros) e o comportamento do menu, do seletor de projetos e do formulário. Com `BASE_URL=https://atelier.garrastudios.online/` a verificação roda contra o site publicado.

## Observações

- O formulário é demonstrativo: valida os campos e avisa que a ATELIER é um projeto conceito, sem enviar nada.
- As animações respeitam `prefers-reduced-motion`. Sem JavaScript, todo o conteúdo aparece normalmente.

## Créditos e licenças

- Design e desenvolvimento: [Garra Studios](https://garrastudios.online).
- Fotografias: [Unsplash](https://unsplash.com/license) (Licença Unsplash).
- Fontes Anton, Instrument Serif e Manrope: SIL Open Font License 1.1, ver [assets/fonts/OFL.txt](assets/fonts/OFL.txt).
