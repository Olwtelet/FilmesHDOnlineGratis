// Como a hospedagem final (Vercel) responde, emulado para o servidor local tools/serve.mjs, de modo que os testes
// locais rodem sob as mesmas regras do site publicado:
//   - os cabeçalhos de vercel.json valem em toda resposta (CSP, COOP, cache de imagem e fonte, tipo do RSS);
//   - sem regra de cache, vale o padrão da Vercel: `public, max-age=0, must-revalidate`, com ETag e 304;
//   - caminhos diferenciam maiúsculas, mesmo em disco que não diferencia; barras iniciais repetidas colapsam;
//   - texto vai comprimido (br ou gzip); faixas de bytes (206 e 416) e HEAD funcionam;
//   - erro de leitura responde 503 ou fecha a resposta, sem derrubar o processo;
//   - só escuta o loopback (HOST=0.0.0.0 compartilha na rede).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { pipeline } from 'node:stream';

const ROOT = path.resolve(import.meta.dirname, '../..');
const EXT_TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.xml', '.txt', '.svg']);
// os padrões de vercel.json usados aqui ("/(.*)", "/(.*)\\.(woff2|woff)") são expressões regulares válidas
const RULES = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8')).headers.map((r) => ({
  re: new RegExp(`^${r.source}$`),
  headers: Object.fromEntries(r.headers.map((h) => [h.key.toLowerCase(), h.value])),
}));

/** `root` + `urlPath` quando é um arquivo com exatamente esse nome em disco (maiúsculas inclusive); senão null. */
export function exactFile(root, urlPath) {
  if (urlPath.includes('\\') || urlPath.includes(':')) return null;
  const file = path.join(root, urlPath);
  if (!file.startsWith(root + path.sep)) return null;
  try {
    return fs.statSync(file).isFile() && fs.realpathSync.native(file) === file ? file : null;
  } catch {
    return null;
  }
}

function headersFor(urlPath, file) {
  const ext = path.extname(file).toLowerCase();
  const headers = { 'content-type': EXT_TYPES[ext] || 'application/octet-stream', 'cache-control': 'public, max-age=0, must-revalidate' };
  for (const r of RULES) if (r.re.test(urlPath)) Object.assign(headers, r.headers);
  return { headers, compressible: COMPRESSIBLE.has(ext) };
}

// Corpos comprimidos são feitos uma vez por versão do arquivo: comprimir a cada pedido atrasa os scripts e muda a ordem
// de inicialização da página, e a CDN também responde de um cache.
const ENCODERS = {
  br: (raw) => zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length } }),
  gzip: (raw) => zlib.gzipSync(raw, { level: 6 }),
};
const compressedCache = new Map(); // `${file}|${encoding}` -> { version, body }
function compressed(file, fd, stat, encoding) {
  const key = `${file}|${encoding}`;
  const version = `${stat.size}-${stat.mtimeMs}`;
  const hit = compressedCache.get(key);
  if (hit?.version === version) return hit.body;
  const raw = Buffer.alloc(stat.size);
  fs.readSync(fd, raw, 0, stat.size, 0);
  const body = ENCODERS[encoding](raw);
  compressedCache.set(key, { version, body });
  return body;
}

function plain(req, res, code, text, headers = {}) {
  res.writeHead(code, { 'content-type': 'text/plain; charset=utf-8', 'content-length': Buffer.byteLength(text), ...headers });
  res.end(req.method === 'HEAD' ? undefined : text);
}

function send(req, res, file, urlPath, code = 200) {
  const { headers: base, compressible } = headersFor(urlPath, file);
  const fd = fs.openSync(file, 'r'); // síncrono: arquivo travado ou sumido cai no catch de quem chamou
  let streaming = false;
  try {
    const stat = fs.fstatSync(fd);
    const etag = `"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
    const headers = { ...base, etag, vary: 'accept-encoding' };
    if (code === 200 && (req.headers['if-none-match'] || '').split(/\s*,\s*/).includes(etag)) {
      res.writeHead(304, headers);
      return res.end();
    }
    if (code === 200 && !compressible) headers['accept-ranges'] = 'bytes';
    let start = 0;
    let end = stat.size - 1;
    const m = code === 200 && !compressible && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (m && (m[1] || m[2]) && !(m[1] && m[2] && +m[1] > +m[2])) {
      start = m[1] ? +m[1] : Math.max(0, stat.size - +m[2]);
      if (m[1] && m[2]) end = Math.min(+m[2], stat.size - 1);
      if (start >= stat.size || (!m[1] && +m[2] === 0)) {
        res.writeHead(416, { 'content-range': `bytes */${stat.size}` });
        return res.end();
      }
      code = 206;
      headers['content-range'] = `bytes ${start}-${end}/${stat.size}`;
    }
    const accepted = (req.headers['accept-encoding'] || '')
      .split(',')
      .map((s) => s.trim().split(/\s*;\s*/))
      .filter(([, q]) => !/^q=0(\.0*)?$/.test(q || ''))
      .map(([name]) => name);
    const encoding = compressible && stat.size > 0 && code !== 206 ? ['br', 'gzip'].find((e) => accepted.includes(e)) : null;
    if (encoding) {
      const body = compressed(file, fd, stat, encoding);
      res.writeHead(code, { ...headers, 'content-encoding': encoding, 'content-length': body.length });
      return res.end(req.method === 'HEAD' ? undefined : body);
    }
    headers['content-length'] = end - start + 1;
    res.writeHead(code, headers);
    if (req.method === 'HEAD' || stat.size === 0) return res.end();
    const source = fs.createReadStream(file, { fd, start, end });
    streaming = true;
    pipeline(source, res, () => {});
  } finally {
    if (!streaming) fs.closeSync(fd);
  }
}

/**
 * Sobe o servidor. `resolve(caminho)` devolve { file } ou { redirect } ou null; `notFoundFile` é a página 404.
 */
export function startHosting({ name, port, resolve, notFoundFile }) {
  function handle(req, res) {
    let url;
    try {
      url = new URL(req.url.replace(/^\/+/, '/'), 'http://localhost');
    } catch {
      return plain(req, res, 400, 'pedido inválido');
    }
    let urlPath;
    try {
      urlPath = path.posix.normalize(decodeURIComponent(url.pathname));
    } catch {
      return plain(req, res, 400, 'pedido inválido');
    }
    if (urlPath.includes('\0')) return plain(req, res, 400, 'pedido inválido');
    if (urlPath === '/index.html') urlPath = '/';
    const hit = resolve(urlPath);
    if (hit?.redirect) return plain(req, res, 308, 'movido', { location: hit.redirect + url.search });
    if (hit) return send(req, res, hit.file, urlPath);
    return send(req, res, notFoundFile, urlPath, 404);
  }
  const listener = (req, res) => {
    try {
      handle(req, res);
    } catch (err) {
      // dist/ sendo refeito ou arquivo travado: responde 503 em vez de derrubar o processo
      if (res.headersSent) return res.destroy();
      plain(req, res, 503, String(err.message));
    }
  };
  const hosts = process.env.HOST ? [process.env.HOST] : ['127.0.0.1', '::1'];
  for (const host of hosts) {
    http
      .createServer(listener)
      .on('error', (err) => {
        if (host === '::1' && ['EADDRNOTAVAIL', 'EAFNOSUPPORT'].includes(err.code)) return; // sem loopback IPv6
        console.error(`${name}: ${err.message}`);
        process.exit(1);
      })
      .listen(port, host);
  }
  console.log(`${name} em http://localhost:${port}`);
}
