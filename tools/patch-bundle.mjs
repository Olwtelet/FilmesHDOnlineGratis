// Edições locais de arquivos minificados da estrutura original. Cada troca exige que o trecho original apareça exatamente
// uma vez. Rodar de novo não altera nada. Uma troca que só remove texto não tem como provar que já foi feita: ela diz
// "já aplicado" sempre que não acha o trecho.
//   node tools/patch-bundle.mjs
import fs from 'node:fs';
import path from 'node:path';

const PASTA = path.resolve(import.meta.dirname, '../public/assets');
const APP = 'js/app.js';
const MAIN = 'css/main.css';

const TROCAS = [
  {
    // Fase 2: o giro de entrada da home para em items[0] (a próxima sessão), para qualquer quantidade de itens.
    arquivo: APP,
    nome: 'giro da home para no item 0',
    de: 'this.current=this.target=-60,',
    para: 'this.current=this.target=-Math.round(60/this.items.length)*this.items.length,',
  },
  {
    arquivo: APP,
    nome: 'giro da Programação para no item 0',
    de: 'this.current=this.target=-100,',
    para: 'this.current=this.target=-Math.round(100/this.items.length)*this.items.length,',
  },
  {
    arquivo: APP,
    nome: 'rótulo do cursor em português',
    de: 'this.word.textContent="SCROLL"',
    para: 'this.word.textContent="ROLAR"',
  },
  {
    // A tecla g abria o painel de depuração lil-gui para o público.
    arquivo: APP,
    nome: 'tecla g sem painel de depuração',
    de: 'document.addEventListener("keydown",s=>{s.key==="g"&&pe.show()});',
    para: '',
  },
  {
    // A troca de innerHTML seguida de leitura forçava estilo e layout por letra. Com 21 títulos (299 letras) isso dava
    // uma long task de 4 a 11 s antes do timer de 3,5 s do ENTER. O resultado é o mesmo: escreve tudo, depois anima.
    arquivo: APP,
    nome: 'rollover do título sem layout por letra',
    de: 'this.rolloverSplit.chars.forEach((e,t)=>{let i=e.textContent,r=`<div class="cloneText2">${i}</div>`,n=`<div class="originalText2">${i}</div>${r}`;e.innerHTML=n;let o=L.timeline({paused:!0}),l={repeat:L.utils.random(8,14,1),ease:"none",duration:1};L.set(e.children,{y:"18%"}),o.to(e.children,{yPercent:"-=100",...l}),this.charTimelines.push(o)})',
    para: 'this.rolloverSplit.chars.forEach(e=>{let i=e.textContent;e.innerHTML=`<div class="originalText2">${i}</div><div class="cloneText2">${i}</div>`}),this.rolloverSplit.chars.forEach(e=>{let o=L.timeline({paused:!0}),l={repeat:L.utils.random(8,14,1),ease:"none",duration:1};L.set(e.children,{y:"18%"}),o.to(e.children,{yPercent:"-=100",...l}),this.charTimelines.push(o)})',
  },
  {
    // Ajuste de linha do título de cada filme da Siena; nenhuma classe dessas existe mais no HTML.
    arquivo: MAIN,
    nome: 'regras por filme do main.css',
    de: '@media only screen and (min-width: 767px){.moon{.split-line-move:nth-child(1){transform:translate(0)}.split-line-move:nth-child(2){transform:translate(20%)}.split-line-move:nth-child(3){transform:translate(0)}}.kafka{.split-line-move:nth-child(1){transform:translate(0)}.split-line-move:nth-child(2){transform:translate(-15%)}}.my,.ana{.split-line-move:nth-child(1){transform:translate(0)}.split-line-move:nth-child(2){transform:translate(0)}}.freud{.split-line-move:nth-child(1){transform:translate(0)}.split-line-move:nth-child(2){transform:translate(10%)}}}',
    para: '',
  },
];

for (const arquivo of new Set(TROCAS.map((t) => t.arquivo))) {
  const ARQ = path.join(PASTA, arquivo);
  let texto = fs.readFileSync(ARQ, 'utf8');
  let alterou = false;
  for (const { nome, de, para } of TROCAS.filter((t) => t.arquivo === arquivo)) {
    const n = texto.split(de).length - 1;
    if (n === 1) {
      texto = texto.replace(de, () => para);
      alterou = true;
      console.log('aplicado:', nome);
    } else if (n === 0 && (para === '' || texto.includes(para))) {
      console.log('já aplicado:', nome);
    } else {
      throw new Error(`${nome}: esperava 1 ocorrência de ${JSON.stringify(de)}, achei ${n}`);
    }
  }
  if (alterou) fs.writeFileSync(ARQ, texto);
}
