// Catálogo: um arquivo JSON por sessão nesta pasta, validado aqui. É a única fonte de home, Programação,
// menu e páginas de sessão. Como cadastrar: docs/FASE2.md. Os limites de caracteres vêm da medição de cada
// espaço da interface; passar deles quebra o layout, por isso param o build com a mensagem do campo.
// tools/checar-textos.mjs confere o que não é estrutura: palavras longas demais, vocabulário vetado, repetição.
import { z } from 'astro/zod';

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Data que existe no calendário: 2026-02-31 tem o formato certo e não é uma data. */
function dataReal(d: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if (!m) return false;
  const [a, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const u = new Date(Date.UTC(a, mes - 1, dia));
  return u.getUTCFullYear() === a && u.getUTCMonth() === mes - 1 && u.getUTCDate() === dia;
}

const Fracao = z.number().min(0).max(1);

const Imagem = z
  .object({
    tmdb: z.string().min(1).optional(),
    arquivo: z.string().min(1).optional(),
    recorte: z.object({ x: Fracao, y: Fracao, largura: Fracao, altura: Fracao }).strict().optional(),
  })
  .strict()
  .refine((i) => i.tmdb || i.arquivo, 'informe tmdb ou arquivo');

const Credito = z.object({ funcao: z.string().min(1).max(34), nome: z.string().min(1).max(37) }).strict();

const Filme = z
  .object({
    titulo: z.string().trim().min(1),
    tituloOriginal: z.string().min(1),
    ano: z.number().int().min(1888).max(2100),
    direcao: z.string().min(1),
    duracao: z.number().int().positive(),
    classificacao: z.enum(['L', '10', '12', '14', '16', '18']).optional(),
    generos: z.array(z.string().min(1)).min(1),
    /** só em sessão dupla: hora de início deste filme */
    hora: z.string().regex(HORA, 'hora inválida, use HH:MM').optional(),
    trailer: z
      .object({
        youtube: z.string().regex(/^[\w-]{11}$/, 'ID do YouTube tem 11 caracteres'),
        canal: z.string(),
        idioma: z.string(),
        tituloVideo: z.string().optional(),
      })
      .strict(),
    tmdb: z.number().int().optional(),
    imdb: z.string().optional(),
  })
  .strict();

const Nota = (rotulo: number, frase: number) => z.object({ rotulo: z.string().min(1).max(rotulo), frase: z.string().min(1).max(frase) }).strict();

/** Maior título que coube no ingresso do menu, medido no título real mais longo. */
const TITULO_MAX = 32;
const SOMA_NOTAS_MAX = 120;

const Sessao = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    titulo: z.string().trim().min(1),
    /** ingresso do menu, painel pequeno, próximo filme e home, quando o título não cabe */
    tituloCurto: z.string().trim().max(30).optional(),
    categoria: z.string().min(1).max(20),
    direcaoCurta: z.string().max(26).optional(),
    /** linhas do título no herói da página; sem o campo, a página usa só o fio de cima e o de baixo */
    linhasTitulo: z.number().int().min(1).max(5).optional(),
    sessao: z
      .object({
        data: z.string().refine(dataReal, 'data inexistente, use AAAA-MM-DD'),
        hora: z.string().regex(HORA, 'hora inválida, use HH:MM'),
        /** fim explícito, hora local de São Paulo (AAAA-MM-DDTHH:MM). Sem ele a sessão vale até 00:00 do dia seguinte */
        fim: z
          .string()
          .refine((t) => dataReal(t.slice(0, 10)) && t[10] === 'T' && HORA.test(t.slice(11)), 'fim inválido, use AAAA-MM-DDTHH:MM')
          .optional(),
        sala: z.string().min(1),
        salaUrl: z.string().url().startsWith('https://'),
      })
      .strict()
      .refine((s) => !s.fim || s.fim > `${s.data}T${s.hora}`, { message: 'o fim precisa vir depois do início', path: ['fim'] }),
    filmes: z.array(Filme).min(1).max(4),
    sinais: z.array(z.string().min(1)).default([]),
    /** texto provisório: o build avisa e o site não deve ser publicado assim */
    rascunho: z.boolean().optional(),
    texto: z
      .object({
        manchete: z.string().min(1).max(30),
        leitura: z.string().min(1).max(320),
        descricao: z.string().min(1).max(155),
        notasHome: z
          .array(Nota(18, 44))
          .length(3)
          .refine((n) => n.reduce((t, x) => t + x.frase.length, 0) <= SOMA_NOTAS_MAX, `as três frases somam mais de ${SOMA_NOTAS_MAX} caracteres`),
        leituras: z.array(Nota(27, 130)).length(6),
      })
      .strict(),
    creditos: z
      .object({
        principais: z.array(Credito).max(4).default([]),
        producao: z.array(Credito).max(4).default([]),
        elenco: z.array(Credito).max(6).default([]),
      })
      .strict(),
    imagens: z
      .object({
        hero: Imagem,
        cartaz: Imagem,
        direcao: Imagem,
        cenas: z.array(Imagem).min(1),
      })
      .strict(),
  })
  .strict()
  .refine((s) => (s.tituloCurto ?? s.titulo).length <= TITULO_MAX, {
    message: `título com mais de ${TITULO_MAX} caracteres não cabe no ingresso: acrescente tituloCurto`,
    path: ['titulo'],
  });

export type SessaoDado = z.infer<typeof Sessao>;

function validar(caminho: string, bruto: unknown): SessaoDado {
  const r = Sessao.safeParse(bruto);
  if (r.success) return r.data;
  const erros = r.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Sessão inválida em ${caminho}:\n${erros}`);
}

const ARQUIVOS = import.meta.glob<{ default: unknown }>('./*.json', { eager: true });

/** Todas as sessões em ordem cronológica. A ordem exibida é decidida no navegador (components/SessoesOrdem.astro). */
export const SESSOES: SessaoDado[] = Object.entries(ARQUIVOS)
  .filter(([caminho]) => !caminho.includes('_modelo'))
  .map(([caminho, m]) => {
    const s = validar(caminho, m.default);
    const esperado = caminho.replace('./', '').replace('.json', '');
    if (s.slug !== esperado) throw new Error(`${caminho}: slug "${s.slug}" difere do nome do arquivo`);
    return s;
  })
  .sort((a, b) => `${a.sessao.data}T${a.sessao.hora}`.localeCompare(`${b.sessao.data}T${b.sessao.hora}`));

const rascunhos = SESSOES.filter((s) => s.rascunho).length;
if (rascunhos) console.warn(`[sessoes] ${rascunhos} sessão(ões) ainda com texto provisório`);
