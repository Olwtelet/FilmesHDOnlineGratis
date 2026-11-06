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
    // Abertura "o sinal encontra o cinema": a sequência dura 4,5 s e o nome repousa antes do ENTER, que vem 5,8 s depois do
    // primeiro quadro da abertura (o início das animações do nome), e nunca antes de 3,5 s depois de o app.js rodar, como no
    // original: com o app.js atrasado, a abertura já acabou e não sobra espera morta. Com movimento reduzido a abertura é curta e
    // o ENTER continua aos 3,5 s. local-preloader.js e os testes da abertura usam a mesma regra.
    arquivo: APP,
    nome: 'ENTER depois da abertura nova',
    de: 'setTimeout(()=>{this.showButton()},3500)',
    para: 'setTimeout(()=>{this.showButton()},(()=>{if(matchMedia("(prefers-reduced-motion: reduce)").matches)return 3500;var n=document.querySelector(".ab-nome"),a=n&&n.getAnimations?n.getAnimations()[0]:null,t=a&&a.startTime!=null?a.startTime:performance.now();return Math.max(3500,t+5800-performance.now())})())',
  },
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
    // O bind criava outra função, e o remove não achava nada: cada visita à Programação deixava um ouvinte em window que,
    // em toda página seguinte, cancelava o Espaço (não rolava, não acionava botão nem menu) até recarregar.
    arquivo: APP,
    nome: 'ouvinte de teclado da Programação guarda a referência',
    de: 'window.addEventListener("keydown",this.handleKeydown.bind(this))',
    para: 'window.addEventListener("keydown",this.keydownHandler=this.handleKeydown.bind(this))',
  },
  {
    arquivo: APP,
    nome: 'ouvinte de teclado da Programação sai ao trocar de página',
    de: 'window.removeEventListener("keydown",this.handleKeydown)',
    para: 'window.removeEventListener("keydown",this.keydownHandler)',
  },
  {
    // Só o cartão atual fica na tela; os outros seguiam no Tab, cortados pelo overflow. Com 21 sessões o EXPLORAR estava a 56 Tabs.
    arquivo: APP,
    nome: 'cartões fora da tela saem do Tab na home',
    de: 'onSlideChange(t){P.SLIDER_SETTLED=this.currentIndex,this.trimTriggers.forEach(',
    para: 'onSlideChange(t){P.SLIDER_SETTLED=this.currentIndex,this.items.forEach((i,r)=>i.querySelectorAll("a,button").forEach(e=>{r===t?e.removeAttribute("tabindex"):e.tabIndex=-1})),this.trimTriggers.forEach(',
  },
  {
    // Leituras andam sozinhas. A soma mora no render da instância, então não há timer para duplicar entre páginas. Para fora da tela,
    // no arrasto e com foco de teclado nas setas; com movimento reduzido, nem começa. Num telefone, em que o cartão enche a tela,
    // anda um por vez, para dar tempo de ler. Em janela mais larga que o ciclo inteiro, o cartão reciclado apareceria: fica na mão.
    arquivo: APP,
    nome: 'leituras andam sozinhas',
    de: 'render(){this.update(),this.progressBar.style.transform=',
    para: 'render(){let t=performance.now(),a=document.activeElement,u=this.viewport.width*1.5>this.viewport.wrapperWidth;(!this.isVisible||this.isDragging||this.prevNext.includes(a)&&a.matches(":focus-visible"))&&(this.retoma=t+(this.isVisible?3e3:u?6e3:1500)),t>this.retoma&&!this.calmo.matches&&this.viewport.width*(this.items.length-1)>=this.viewport.wrapperWidth&&(u?(this.goToNext(),this.retoma=t+6e3):this.target-=.0014*L.ticker.deltaRatio()),this.update(),this.progressBar.style.transform=',
  },
  {
    // Só movimento de verdade conta: com o cartão passando sob o ponteiro parado, o navegador repete o mousemove na mesma posição.
    arquivo: APP,
    nome: 'leituras cedem ao ponteiro',
    de: 'this.addEvents()}addEvents(){this.prevNext.forEach(',
    para: 'this.addEvents()}addEvents(){this.retoma=0,this.calmo=matchMedia("(prefers-reduced-motion: reduce)"),this.wrapper.closest(".s").addEventListener("mousemove",t=>{(t.clientX!==this.mx||t.clientY!==this.my)&&(this.mx=t.clientX,this.my=t.clientY,this.retoma=Math.max(this.retoma,performance.now()+3e3))}),this.wrapper.addEventListener("touchcancel",()=>this.handleDragEnd()),this.prevNext.forEach(',
  },
  {
    arquivo: APP,
    nome: 'leituras esperam depois da seta',
    de: 't.addEventListener("click",()=>{i===0?this.goToPrev():this.goToNext()})',
    para: 't.addEventListener("click",()=>{this.retoma=performance.now()+6e3,i===0?this.goToPrev():this.goToNext()})',
  },
  {
    // Andando para o lado do arrasto para a esquerda, a barra sempre vai para a direita; a cópia que entra pela esquerda está no tema.
    arquivo: APP,
    nome: 'barra das leituras em ciclo',
    de: 'return Math.abs(this.current)%e/e',
    para: 'return(-this.current%e+e)%e/e',
  },
  {
    // Volta à home: cada ida recriava a textura de cada filme, 22 envios à GPU, quase todos em um quadro só (360 a 560 ms), e nunca apagava as velhas.
    // O contexto do WebGL é um só durante toda a visita, então uma textura por endereço basta. Só o pixel de reserva de uma imagem que
    // falhou não fica guardado: a próxima visita à página tenta de novo.
    arquivo: APP,
    nome: 'uma textura por imagem na visita inteira',
    de: 'async function or(s,e){return new Promise(t=>{let i=new Image;i.src=e,i.crossOrigin="anonymous",i.onload=()=>{let r=new Fe(s,{image:i,wrapS:s.REPEAT,wrapT:s.REPEAT});r.a=[i.naturalWidth,i.naturalHeight],t(r)}})}',
    para: 'var __texturas=new Map;function or(s,e){let c=__texturas.get(e);return c||(c=new Promise(t=>{let i=new Image;i.src=e,i.crossOrigin="anonymous",i.onload=()=>{let r=new Fe(s,{image:i,wrapS:s.REPEAT,wrapT:s.REPEAT});r.a=[i.naturalWidth,i.naturalHeight],i.src.startsWith("data:")&&__texturas.delete(e),t(r)}}),__texturas.set(e,c)),c}',
  },
  {
    // O unsubscribe comparava t.id com uma chave que nunca foi guardada e o dispose não era chamado: a cada volta à home, mais 22 objetos
    // antigos do WebGL seguiam rodando em todo quadro e em todo resize, até recarregar a página.
    arquivo: APP,
    nome: 'assinatura de resize sai de verdade',
    de: 'var Ni=class{static subscribe(e,t=Symbol()){return this.subscribers.push(e),()=>this.unsubscribe(t)}static unsubscribe(e){this.subscribers=this.subscribers.filter(t=>t.id!==e)}',
    para: 'var Ni=class{static subscribe(e,t=e){return this.subscribers.push(e),()=>this.unsubscribe(t)}static unsubscribe(e){this.subscribers=this.subscribers.filter(t=>t!==e)}',
  },
  {
    arquivo: APP,
    nome: 'assinatura de quadro sai de verdade',
    de: 'var ps=class{static subscribe(e,t=Symbol()){return this.subscribers.push(e),()=>this.unsubscribe(t)}static unsubscribe(e){this.subscribers=this.subscribers.filter(t=>t.id!==e)}',
    para: 'var ps=class{static subscribe(e,t=e){return this.subscribers.push(e),()=>this.unsubscribe(t)}static unsubscribe(e){this.subscribers=this.subscribers.filter(t=>t!==e)}',
  },
  {
    arquivo: APP,
    nome: 'filmes do WebGL descartados ao sair da página',
    de: 'this.doms&&this.doms.forEach(t=>{t.setParent(null)})',
    para: 'this.doms&&this.doms.forEach(t=>{t.setParent(null),t.dispose()})',
  },
  {
    arquivo: APP,
    nome: 'quadros de CENAS descartados ao sair da página',
    de: '(e=this.images)==null||e.forEach(t=>{t.setParent(null)})',
    para: '(e=this.images)==null||e.forEach(t=>{t.setParent(null),t.dispose()})',
  },
  {
    // Sair da página antes de as imagens carregarem deixava a promessa pendente: quando ela terminava, já na página seguinte, avisava que o
    // WebGL carregou e o rolo saltava para o primeiro item. Com texturas guardadas, a volta é mais rápida e essa corrida fica mais fácil.
    arquivo: APP,
    nome: 'carga da home ignorada se a página já mudou',
    de: ',await Promise.all([...this.doms.map(t=>t.load())]),P.LOADED_WEBGL=!0,',
    para: ';let d=this.doms;if(await Promise.all(d.map(t=>t.load())),this.doms!==d)return;P.LOADED_WEBGL=!0,',
  },
  {
    arquivo: APP,
    nome: 'carga da Programação ignorada se a página já mudou',
    de: ',await Promise.all([...this.doms.map(i=>i.load())]),P.LOADED_WEBGL=!0,',
    para: ';let d=this.doms;if(await Promise.all(d.map(i=>i.load())),this.doms!==d)return;P.LOADED_WEBGL=!0,',
  },
  {
    // O cursor antigo está escondido e o do tema tem nó próprio: sem isto, seguiria escrevendo um transform por quadro em nó invisível.
    arquivo: APP,
    nome: 'cursor antigo sem escrita por quadro',
    de: 'render(){this.el.style.transform=`translate3d(${Fr.cex}px, ${Fr.cey}px, 0)`}',
    para: '',
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
