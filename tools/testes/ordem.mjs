// Ordem das sessões com relógio controlado, contra o build em produção.
//   node tools/testes/ordem.mjs [--url=http://localhost:4322] [--canal=msedge]
// Sempre headless. Para no primeiro erro de infraestrutura; caso reprovado é listado no fim e sai com código 1.
import { chromium } from 'playwright';

const arg = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split('=')[1];
const URL_BASE = arg('url', 'http://localhost:4322');
const CANAL = arg('canal', 'msedge');
const LISTAS = ['[data-roll="container"]', '.work-roll-w', '.work-overl-w', '[data-menu="films"]', '[data-menu="footages"]', '.menu-films-w'];
const COOKIES = [
  { name: 'preloader_shown', value: String(Date.now() + 864e5 * 400), url: URL_BASE },
  { name: 'tutorial_shown', value: 'true', url: URL_BASE },
];
const SP = (t) => `${t}:00-03:00`;
// cadastradas em 06/11/2026: sábados 14/11, 21/11, 05/12 e 12/12, sem sessão em 07/11 e 28/11
const NOVAS = ['a-clockwork-orange-1971', 'they-live-1988', 'late-night-with-the-devil-2023', 'rocky-1976'];

const resultados = [];
function confere(nome, ok, detalhe = '') {
  resultados.push({ nome, ok, detalhe });
  console.log(`${ok ? 'ok   ' : 'FALHA'} ${nome}${detalhe ? `  ${detalhe}` : ''}`);
}

const browser = await chromium.launch({ channel: CANAL, headless: true });

async function abrir({ quando, caminho = '/', fuso, reescrever, viewport = { width: 1440, height: 900 } }) {
  const ctx = await browser.newContext({ viewport, timezoneId: fuso || 'America/Sao_Paulo' });
  await ctx.addCookies(COOKIES);
  const page = await ctx.newPage();
  page.erros = [];
  page.on('pageerror', (e) => page.erros.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|ERR_ABORTED/.test(m.text())) page.erros.push(m.text()); });
  await page.clock.install({ time: new Date(SP(quando)) });
  if (reescrever) {
    await page.route((u) => u.pathname === caminho, async (route) => {
      const r = await route.fetch();
      await route.fulfill({ response: r, body: reescrever(await r.text()) });
    });
  }
  // a ordem é decidida antes de o app.js rodar: não precisa esperar os quadros da Programação
  await page.goto(URL_BASE + caminho, { waitUntil: 'domcontentloaded', timeout: 120000 });
  return { ctx, page };
}

const lerOrdem = (page) =>
  page.evaluate((LISTAS) => {
    const out = {};
    for (const sel of LISTAS) {
      const l = document.querySelector(sel);
      if (l) out[sel] = [...l.children].filter((c) => c.hasAttribute('data-sessao') || c.hasAttribute('data-aviso')).map((c) => c.getAttribute('data-sessao') || 'AVISO');
    }
    return out;
  }, LISTAS);

async function esperarGiro(page, seletorItem) {
  await page.clock.runFor(100).catch(() => {});
  await page.waitForFunction(() => document.querySelector('[data-taxi]') && getComputedStyle(document.querySelector('[data-taxi]')).visibility !== 'hidden', null, { timeout: 120000 });
  await page.waitForTimeout(4000);
}

const estadoDoPrimeiro = (page) =>
  page.evaluate(() => {
    const prim = document.querySelector('[data-roll="container"]')?.firstElementChild || document.querySelector('.work-roll-w')?.firstElementChild;
    const n = prim?.querySelector('[data-estado]');
    return { sessao: prim?.getAttribute('data-sessao') || (prim?.hasAttribute('data-aviso') ? 'AVISO' : null), estado: n?.getAttribute('data-estado') || null, texto: n?.textContent || prim?.querySelector('.roll-cont-eyeb')?.textContent || null };
  });

function todasIguais(ordem) {
  const listas = Object.values(ordem);
  return listas.every((l) => l.join() === listas[0].join());
}

// 1. A ordem em instantes-chave
const CASOS = [
  { nome: 'antes: primeira futura', quando: '2026-07-01T12:00', primeira: 'obsession-2026', estado: 'proxima', seguem: ['v-for-vendetta-2005', 'lord-of-war-2005'] },
  { nome: 'exceção de dia: terça-feira, no próprio dia antes do início', quando: '2026-06-30T12:00', primeira: 'the-menu-2022', estado: 'hoje' },
  { nome: 'exceção de dia: quinta-feira, depois do início', quando: '2026-07-16T22:00', primeira: 'what-you-wish-for-2023', estado: 'hoje' },
  { nome: 'exceção de hora: sessão dupla às 19:30, durante', quando: '2026-07-25T19:45', primeira: 'ready-or-not-double-feature-2026', estado: 'hoje' },
  { nome: 'fim do dia local: ainda em destaque às 23:59', quando: '2026-07-25T23:59', primeira: 'ready-or-not-double-feature-2026', estado: 'hoje' },
  { nome: 'virada do dia em São Paulo: avança às 00:00', quando: '2026-07-26T00:00', primeira: 'truth-treachery-2026', estado: 'proxima', ultimaPassada: 'ready-or-not-double-feature-2026' },
  { nome: 'várias futuras', quando: '2026-10-20T12:00', primeira: 'pulp-fiction-1994', estado: 'proxima', seguem: ['the-hateful-eight-2015', ...NOVAS, 'the-lobster-2015'] },
  { nome: 'hoje antes do início, com futuras depois', quando: '2026-10-31T12:00', primeira: 'the-hateful-eight-2015', estado: 'hoje', seguem: NOVAS },
  // as quatro sessões de novembro e dezembro: cada virada à meia-noite de São Paulo, e os sábados sem sessão no meio
  { nome: 'depois de Os Oito Odiados: Laranja Mecânica', quando: '2026-11-01T00:00', primeira: NOVAS[0], estado: 'proxima', seguem: NOVAS.slice(1), ultimaPassada: 'the-hateful-eight-2015' },
  { nome: 'hoje, 06/11: Laranja Mecânica', quando: '2026-11-06T12:00', primeira: NOVAS[0], estado: 'proxima', seguem: [...NOVAS.slice(1), 'the-hateful-eight-2015'] },
  { nome: 'sábado 07/11, sem sessão: segue Laranja Mecânica', quando: '2026-11-07T20:30', primeira: NOVAS[0], estado: 'proxima' },
  { nome: '14/11 antes do início', quando: '2026-11-14T12:00', primeira: NOVAS[0], estado: 'hoje' },
  { nome: '14/11 às 23:59', quando: '2026-11-14T23:59', primeira: NOVAS[0], estado: 'hoje' },
  { nome: 'virada de 15/11: Eles Vivem', quando: '2026-11-15T00:00', primeira: NOVAS[1], estado: 'proxima', seguem: NOVAS.slice(2), ultimaPassada: NOVAS[0] },
  { nome: '21/11 durante a sessão', quando: '2026-11-21T20:45', primeira: NOVAS[1], estado: 'hoje' },
  { nome: 'virada de 22/11: Entrevista com o Demônio', quando: '2026-11-22T00:00', primeira: NOVAS[2], estado: 'proxima', ultimaPassada: NOVAS[1] },
  { nome: 'sábado 28/11, sem sessão: segue Entrevista com o Demônio', quando: '2026-11-28T20:30', primeira: NOVAS[2], estado: 'proxima', seguem: [NOVAS[3], NOVAS[1]] },
  { nome: '05/12 antes do início', quando: '2026-12-05T12:00', primeira: NOVAS[2], estado: 'hoje' },
  { nome: 'virada de 06/12: Rocky', quando: '2026-12-06T00:00', primeira: NOVAS[3], estado: 'proxima', seguem: [NOVAS[2], NOVAS[1], NOVAS[0]], ultimaPassada: NOVAS[2] },
  { nome: '12/12 às 23:59', quando: '2026-12-12T23:59', primeira: NOVAS[3], estado: 'hoje' },
  { nome: 'virada de 13/12: nenhuma futura, volta o aviso', quando: '2026-12-13T00:00', primeira: 'AVISO', seguem: [NOVAS[3], NOVAS[2], NOVAS[1], NOVAS[0], 'the-hateful-eight-2015'] },
  { nome: 'nenhuma futura, muito depois', quando: '2027-03-01T12:00', primeira: 'AVISO', seguem: [NOVAS[3]] },
];
for (const caminho of ['/', '/programacao/']) {
  for (const c of CASOS) {
    const { ctx, page } = await abrir({ quando: c.quando, caminho });
    const ordem = await lerOrdem(page);
    const lista = Object.values(ordem)[0];
    const e = await estadoDoPrimeiro(page);
    // a passada mais recente vem logo depois da última sessão ainda válida
    const futuras = await page.evaluate((t) => [...document.querySelector('[data-menu="films"]').children].filter((c) => c.getAttribute('data-fim') > t).length, c.quando);
    const ok = lista[0] === c.primeira && todasIguais(ordem) && (!c.estado || e.estado === c.estado) && (!c.seguem || c.seguem.every((s, i) => lista[i + 1] === s)) && (!c.ultimaPassada || lista[futuras] === c.ultimaPassada);
    confere(`${caminho} ${c.nome}`, ok, `${lista.slice(0, 3).join(', ')} | ${e.estado} | ${e.texto}`);
    await ctx.close();
  }
}

// 2. Passadas da mais recente para a mais antiga, sem aviso quando há futura
{
  const { ctx, page } = await abrir({ quando: '2026-07-01T12:00' });
  const lista = Object.values(await lerOrdem(page))[0];
  const esperado = ['obsession-2026', 'v-for-vendetta-2005', 'lord-of-war-2005', 'what-you-wish-for-2023', 'bugonia-2025', 'ready-or-not-double-feature-2026', 'truth-treachery-2026', 'the-inheritance-2025', 'limitless-2011', 'eyes-wide-shut-1999', 'django-unchained-2012', 'doctor-sleep-2019', 'under-the-silver-lake-2018', 'the-lobster-2015', 'pulp-fiction-1994', 'the-hateful-eight-2015', ...NOVAS, 'the-menu-2022', 'inglourious-basterds-2009', 'vivarium-2019', 'the-running-man-2026', 'the-long-walk-2025'];
  confere('ordem completa em 01/07', lista.join() === esperado.join(), lista.length + ' itens');
  await ctx.close();
}
{
  // depois da última: o aviso e as 25 passadas, da mais recente para a mais antiga
  const { ctx, page } = await abrir({ quando: '2026-12-13T00:00' });
  const ordem = await lerOrdem(page);
  const lista = Object.values(ordem)[0];
  const esperado = ['AVISO', ...[...NOVAS].reverse(), 'the-hateful-eight-2015', 'pulp-fiction-1994', 'the-lobster-2015', 'under-the-silver-lake-2018', 'doctor-sleep-2019', 'django-unchained-2012', 'eyes-wide-shut-1999', 'limitless-2011', 'the-inheritance-2025', 'truth-treachery-2026', 'ready-or-not-double-feature-2026', 'bugonia-2025', 'what-you-wish-for-2023', 'lord-of-war-2005', 'v-for-vendetta-2005', 'obsession-2026', 'the-menu-2022', 'inglourious-basterds-2009', 'vivarium-2019', 'the-running-man-2026', 'the-long-walk-2025'];
  confere('ordem completa em 13/12', lista.join() === esperado.join() && todasIguais(ordem), lista.length + ' itens');
  await ctx.close();
}

// 3. O fuso do visitante não muda nada
for (const fuso of ['Asia/Tokyo', 'America/New_York', 'Pacific/Auckland', 'America/Manaus']) {
  const { ctx, page } = await abrir({ quando: '2026-07-26T00:00', fuso });
  confere(`fuso do visitante ${fuso}`, Object.values(await lerOrdem(page))[0][0] === 'truth-treachery-2026');
  await ctx.close();
}

// 4. Término explícito vence a regra da meia-noite
{
  // na última sessão cadastrada, para o avanço cair no aviso; e numa do meio, para cair na seguinte
  const antes = (html) => html.replaceAll('data-fim="2026-12-13T00:00"', 'data-fim="2026-12-12T23:00"');
  const a = await abrir({ quando: '2026-12-12T22:59', reescrever: antes });
  confere('término explícito 23:00: às 22:59 segue em destaque', (await estadoDoPrimeiro(a.page)).sessao === NOVAS[3]);
  await a.ctx.close();
  const b = await abrir({ quando: '2026-12-12T23:00', reescrever: antes });
  confere('término explícito 23:00: às 23:00 avança para o aviso', (await estadoDoPrimeiro(b.page)).sessao === 'AVISO');
  await b.ctx.close();
  const depois = (html) => html.replaceAll('data-fim="2026-12-13T00:00"', 'data-fim="2026-12-13T02:00"');
  const c = await abrir({ quando: '2026-12-13T01:00', reescrever: depois });
  const e = await estadoDoPrimeiro(c.page);
  confere('término depois da meia-noite: 01:00 segue, em curso', e.sessao === NOVAS[3] && e.estado === 'curso', e.texto);
  await c.ctx.close();
  const meio = (html) => html.replaceAll('data-fim="2026-11-15T00:00"', 'data-fim="2026-11-14T23:00"');
  const d = await abrir({ quando: '2026-11-14T23:00', reescrever: meio });
  confere('término explícito numa sessão do meio: avança para a seguinte', (await estadoDoPrimeiro(d.page)).sessao === NOVAS[1]);
  await d.ctx.close();
}

// 5. Giro e listas: o primeiro destaque é o item 0, com ingresso, linha atual e botão certos
for (const [caminho, quando, slug] of [['/', '2026-07-01T12:00', 'obsession-2026'], ['/programacao/', '2026-07-01T12:00', 'obsession-2026'], ['/', '2026-11-06T12:00', NOVAS[0]], ['/programacao/', '2026-11-06T12:00', NOVAS[0]], ['/', '2026-12-13T00:01', null], ['/programacao/', '2026-12-13T00:01', null]]) {
  const { ctx, page } = await abrir({ quando, caminho });
  await esperarGiro(page);
  const r = await page.evaluate(() => {
    const itens = [...document.querySelectorAll(document.querySelector('[data-roll="container"]') ? '[data-roll="item"]' : '[data-slider="item"]')];
    const cx = innerWidth / 2, cy = innerHeight / 2;
    const dist = itens.map((el) => { const r = el.getBoundingClientRect(); return Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy); });
    const i = dist.indexOf(Math.min(...dist));
    const atual = document.querySelector('.menu-film.current, .menu-films-w .current');
    return { i, n: itens.length, sessao: itens[i]?.getAttribute('data-sessao') || 'AVISO', linhaAtual: atual ? atual.getAttribute('data-sessao') || 'AVISO' : null };
  });
  confere(`${caminho} ${quando}: giro para no item 0`, r.i === 0 && r.sessao === (slug || 'AVISO') && r.linhaAtual === r.sessao, JSON.stringify(r));
  confere(`${caminho} ${quando}: console limpo`, page.erros.length === 0, page.erros.slice(0, 2).join(' | '));
  await ctx.close();
}

// 6. Navegação Taxi com o relógio andando: fetch e cache reavaliam a ordem
{
  const { ctx, page } = await abrir({ quando: '2026-07-25T23:58' });
  await esperarGiro(page);
  await page.clock.setSystemTime(new Date(SP('2026-07-26T00:00')));
  await page.evaluate(() => { const a = document.querySelector('a[href="/programacao/"]'); a && a.click(); });
  await page.waitForFunction(() => document.querySelector('[data-taxi-view]')?.getAttribute('data-page') === 'work', null, { timeout: 15000 });
  confere('Taxi com busca: Programação entra com a nova ordem', Object.values(await lerOrdem(page))[0][0] === 'truth-treachery-2026');
  await page.waitForTimeout(2500);
  await page.clock.setSystemTime(new Date(SP('2026-12-13T00:00')));
  await page.goBack();
  await page.waitForFunction(() => document.querySelector('[data-taxi-view]')?.getAttribute('data-page') === 'home', null, { timeout: 15000 });
  const ordem = await lerOrdem(page);
  confere('Taxi do cache: a home volta com aviso e ordem nova, listas iguais', Object.values(ordem)[0][0] === 'AVISO' && todasIguais(ordem), Object.values(ordem)[0].slice(0, 2).join());
  confere('Taxi: console limpo', page.erros.length === 0, page.erros.slice(0, 2).join(' | '));
  await ctx.close();
}

// 7. Aba aberta durante a troca
async function aba({ caminho, quando, depois, passo }) {
  const { ctx, page } = await abrir({ quando, caminho });
  await esperarGiro(page);
  let recargas = 0;
  page.on('load', () => recargas++);
  await page.clock.setSystemTime(new Date(SP(depois)));
  await passo(page);
  return { ctx, page, recargas: () => recargas };
}
{
  // visível e ociosa: recarrega sozinha, sem repetir a abertura
  const t = await aba({
    caminho: '/',
    quando: '2026-12-12T23:58',
    depois: '2026-12-13T00:00',
    passo: async (page) => {
      // nenhuma barra da abertura nem o ENTER podem aparecer em quadro nenhum da recarga
      await page.addInitScript(() => {
        window.__abertura = false;
        const olhar = () => {
          const a = document.querySelector('.abertura');
          const b = document.querySelector('[data-preloader="btn"]');
          if ((a && a.getClientRects().length > 0) || (b && b.getClientRects().length > 0 && getComputedStyle(b).visibility !== 'hidden')) window.__abertura = true;
          requestAnimationFrame(olhar);
        };
        requestAnimationFrame(olhar);
      });
      const carregou = page.waitForEvent('load', { timeout: 60000 });
      await page.clock.fastForward(31000);
      await carregou;
      await page.waitForTimeout(3000);
    },
  });
  const e = await estadoDoPrimeiro(t.page);
  const abertura = await t.page.evaluate(() => window.__abertura);
  confere('aba aberta na home, ociosa: recarrega e mostra o aviso', t.recargas() >= 1 && e.sessao === 'AVISO', `recargas ${t.recargas()}`);
  confere('aba aberta na home: não repete a abertura', !abertura);
  await t.ctx.close();
}
for (const [quando, depois, antes, seguinte] of [['2026-11-14T23:58', '2026-11-15T00:00', NOVAS[0], NOVAS[1]], ['2026-11-21T23:58', '2026-11-22T00:00', NOVAS[1], NOVAS[2]], ['2026-12-05T23:58', '2026-12-06T00:00', NOVAS[2], NOVAS[3]]]) {
  // virada entre duas sessões novas com a home aberta e ociosa: recarrega e destaca a seguinte
  const t = await aba({
    caminho: '/',
    quando,
    depois,
    passo: async (page) => {
      const carregou = page.waitForEvent('load', { timeout: 60000 });
      await page.clock.fastForward(31000);
      await carregou;
      await page.waitForTimeout(3000);
    },
  });
  const e = await estadoDoPrimeiro(t.page);
  const r = await t.page.evaluate((s) => document.querySelector(`[data-sessao="${s}"] [data-estado]`)?.getAttribute('data-estado'), antes);
  confere(`aba aberta na home em ${quando.slice(8, 10)}/${quando.slice(5, 7)}: recarrega e destaca ${seguinte}`, t.recargas() >= 1 && e.sessao === seguinte && e.estado === 'proxima' && r === 'exibida', `recargas ${t.recargas()} | ${e.sessao} ${e.estado} | ${antes} ${r}`);
  await t.ctx.close();
}
{
  // visível com gente mexendo: não recarrega enquanto há gesto recente
  const t = await aba({
    caminho: '/',
    quando: '2026-12-12T23:58',
    depois: '2026-12-13T00:00',
    passo: async (page) => {
      await page.mouse.move(300, 300);
      await page.clock.fastForward(5000);
      await page.mouse.move(320, 320);
      await page.evaluate(() => window.__sessoes.verificar());
      await page.waitForTimeout(800);
    },
  });
  const rotulo = await t.page.evaluate(() => document.querySelector('[data-sessao="rocky-1976"] [data-estado]')?.getAttribute('data-estado'));
  confere('aba em uso: não recarrega, e o rótulo já muda no lugar', t.recargas() === 0 && rotulo === 'exibida', `recargas ${t.recargas()} rótulo ${rotulo}`);
  await t.ctx.close();
}
{
  // escondida: espera a volta, e na volta recarrega sem exigir os 20 s
  const t = await aba({
    caminho: '/programacao/',
    quando: '2026-12-12T23:58',
    depois: '2026-12-13T00:00',
    passo: async (page) => {
      await page.mouse.move(300, 300);
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await page.clock.fastForward(61000);
      await page.waitForTimeout(800);
    },
  });
  confere('aba escondida na Programação: não recarrega em segundo plano', t.recargas() === 0, `recargas ${t.recargas()}`);
  // a Programação carrega todos os quadros do lightbox: o load da recarga demora mais que o da home
  const carregou = t.page.waitForEvent('load', { timeout: 120000 });
  await t.page.mouse.move(310, 310);
  await t.page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await carregou;
  await t.page.waitForTimeout(1500);
  confere('aba escondida na Programação: recarrega na volta, com gesto recente', t.recargas() >= 1 && (await estadoDoPrimeiro(t.page)).sessao === 'AVISO', `recargas ${t.recargas()}`);
  await t.ctx.close();
}
{
  // modo CENAS parado: quem está olhando os quadros não é devolvido ao modo inicial; o rótulo muda no lugar
  const t = await aba({
    caminho: '/programacao/',
    quando: '2026-12-12T23:58',
    depois: '2026-12-13T00:00',
    passo: async (page) => {
      await page.evaluate(() => document.querySelector('[data-work="toggleWrapper"]').classList.add('toggled'));
      await page.clock.fastForward(61000);
      await page.waitForTimeout(800);
    },
  });
  confere('modo CENAS ocioso: não recarrega', t.recargas() === 0, `recargas ${t.recargas()}`);
  await t.ctx.close();
}
{
  // ENTER na tela, sem cookie: a recarga espera a abertura sair e ninguém perde a abertura nem o tutorial
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date(SP('2026-12-12T23:58')) });
  await page.goto(URL_BASE + '/', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => { const b = document.querySelector('[data-preloader="btn"]'); return b && getComputedStyle(b).visibility !== 'hidden'; }, null, { timeout: 120000 });
  // O load da primeira visita pode chegar depois do ENTER (a home carrega um cartão por sessão): recarga é página nova,
  // e a marca posta agora só some se o documento for trocado
  await page.evaluate(() => { window.__mesmaPagina = true; });
  let recargas = 0;
  page.on('framenavigated', (f) => { if (f === page.mainFrame()) recargas++; });
  await page.clock.setSystemTime(new Date(SP('2026-12-13T00:00')));
  await page.clock.fastForward(61000);
  await page.waitForTimeout(1000);
  const { cookie, mesma } = await page.evaluate(() => ({ cookie: document.cookie, mesma: window.__mesmaPagina === true }));
  confere('abertura na tela: não recarrega nem marca como vista', recargas === 0 && mesma && !/preloader_shown/.test(cookie), `navegações ${recargas}, mesma página ${mesma}, cookies "${cookie}"`);
  await ctx.close();
}
{
  // página de sessão: só os rótulos mudam, sem recarga
  const t = await aba({
    caminho: '/sessoes/rocky-1976/',
    quando: '2026-12-12T23:58',
    depois: '2026-12-13T00:00',
    passo: async (page) => {
      await page.clock.fastForward(31000);
      await page.waitForTimeout(1000);
    },
  });
  const r = await t.page.evaluate(() => {
    const n = document.querySelector('[data-estado][data-sessao="rocky-1976"]');
    return n && { estado: n.getAttribute('data-estado'), texto: n.textContent };
  });
  confere('aba aberta numa página de sessão: rótulo muda, sem recarga', t.recargas() === 0 && r?.estado === 'exibida', JSON.stringify(r));
  await t.ctx.close();
}

await browser.close();
const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length} de ${resultados.length} aprovados`);
if (falhas.length) process.exit(1);
