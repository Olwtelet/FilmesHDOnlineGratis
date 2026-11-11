// Efeitos sonoros do site, no lugar da classe de som do app.js (desligada em tools/patch-bundle.mjs). Usa o Howler que o
// app.js expõe em window. Os arquivos saem de tools/gerar-sons.mjs.
//   realce   cta_in    o ponteiro entra num botão de ação ([data-sound-hover="0"]: EXPLORAR, ENTRAR, FECHAR)
//   acionar  cta_out   o clique nesses botões
//   abrir    menu_IN   o menu passa de fechado a aberto (evento fhd:menu de local-menu.js, pelo estado real dos painéis)
//   fechar   menu_OUT  o menu fecha por ação do visitante; não toca quando ele fecha porque a página está mudando
// Regras:
//   - só em computador com mouse ((hover: hover) e (pointer: fine)); no toque nada é baixado nem tocado;
//   - nada é baixado antes de um gesto que libera o áudio (clique ou tecla comum; Alt, Ctrl, Shift e Esc não liberam);
//   - o realce só toca quando o ponteiro de fato se moveu (o carrossel passando sob o ponteiro parado não conta), uma vez por
//     botão e no máximo a cada 140 ms;
//   - nunca acumula: sem gesto, nada entra na fila do Howler; com o áudio suspenso depois do gesto (o Howler suspende depois de
//     30 s sem som e retoma no próximo toque), só um toque por som fica à espera; um som que não carregou não toca depois;
//   - falha de arquivo ou de áudio desliga os sons em silêncio; o site segue igual;
//   - o botão COM SOM / SEM SOM do menu silencia tudo. A escolha vale até recarregar a página: fica na classe do <html>, que o
//     Taxi não troca, e não em cookie nem em armazenamento (as páginas legais dizem que o site não usa outros).
// Ouve em window e em document, então a navegação do Taxi não duplica nada. A hora do último gesto é gravada em window, na
// captura, antes de local-menu.js transformar a tecla do gatilho em clique e o menu mudar de estado.
(function () {
  'use strict';

  var ARQUIVO = { realce: 'cta_in', acionar: 'cta_out', abrir: 'menu_IN', fechar: 'menu_OUT' };
  // Volumes: os arquivos têm pico entre -4 e -7 dBFS; aqui ficam abaixo dos sons antigos, com o realce como o mais discreto
  var VOLUME = { realce: 0.13, acionar: 0.17, abrir: 0.16, fechar: 0.14 };
  var INTERVALO_REALCE = 140;
  var mouse = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : { matches: false };
  var ativacao = navigator.userActivation || null;
  var raiz = document.documentElement;

  var sons = null;
  var falhou = false;
  var pendente = {};
  var ultimoRealce = 0;
  var alvoRealce = null;
  var ultimoMovimento = -1e9;
  var posicao = null;
  var ultimaAcao = -1e9;
  var navegando = -1e9;

  function desligados() { return raiz.classList.contains('sons-desligados'); }

  function carregar() {
    if (sons || falhou || desligados() || !mouse.matches || typeof window.Howl !== 'function') return;
    try {
      sons = {};
      Object.keys(ARQUIVO).forEach(function (chave) {
        sons[chave] = new window.Howl({
          src: ['/assets/audio/' + ARQUIVO[chave] + '.mp3'],
          volume: VOLUME[chave],
          preload: true,
          onloaderror: function () { falhou = true; },
          onplayerror: function () { pendente[chave] = false; },
          onplay: function () { pendente[chave] = false; },
        });
      });
    } catch (erro) {
      falhou = true;
      sons = null;
    }
  }

  function tocar(chave) {
    if (!sons || falhou || desligados() || document.hidden) return;
    var som = sons[chave];
    // um som que ainda não carregou não entra na fila: tocar depois, fora de hora, é pior que não tocar
    if (!som || som.state() !== 'loaded') return;
    try {
      var ctx = window.Howler && window.Howler.ctx;
      // parado de fato ou suspendendo (o Howler marca Howler.state antes de o contexto parar)
      if (ctx && (ctx.state !== 'running' || (window.Howler.state && window.Howler.state !== 'running'))) {
        if (ativacao && !ativacao.hasBeenActive) return; // sem gesto o áudio não volta: nada na fila
        if (pendente[chave]) return; // já há um esperando a retomada
        pendente[chave] = true;
      }
      som.play();
    } catch (erro) {
      pendente[chave] = false;
    }
  }

  // Gesto: grava a hora e, se o gesto libera o áudio, baixa os arquivos (só em computador com mouse)
  function gesto(e) {
    ultimaAcao = performance.now();
    if (e.type === 'wheel') return;
    if (e.type === 'pointerdown' && e.pointerType && e.pointerType !== 'mouse') return;
    if (e.type === 'keydown' && (ativacao ? !ativacao.isActive : /^(Control|Shift|Alt|AltGraph|Meta|OS|CapsLock|Escape|Fn|Tab)$/.test(e.key))) return;
    carregar();
  }
  window.addEventListener('pointerdown', gesto, true);
  window.addEventListener('keydown', gesto, true);
  window.addEventListener('wheel', gesto, { capture: true, passive: true });

  // movimento real do ponteiro: posição diferente da anterior
  function moveu(e) {
    if (posicao && posicao.x === e.clientX && posicao.y === e.clientY) return false;
    posicao = { x: e.clientX, y: e.clientY };
    ultimoMovimento = performance.now();
    return true;
  }
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'mouse') moveu(e);
  }, { passive: true, capture: true });

  document.addEventListener('pointerover', function (e) {
    if (e.pointerType !== 'mouse' || !e.target.closest) return;
    // o pointerover pode chegar antes do pointermove do mesmo deslocamento
    if (posicao) moveu(e);
    if (alvoRealce && !alvoRealce.isConnected) alvoRealce = null; // o botão realçado saiu com a troca de página
    var alvo = e.target.closest('[data-sound-hover="0"]');
    if (!alvo || alvo === alvoRealce) return;
    var agora = performance.now();
    if (agora - ultimoMovimento > 100) return; // o botão passou sob o ponteiro parado: fica sem realce, e o próximo movimento conta
    alvoRealce = alvo;
    if (agora - ultimoRealce < INTERVALO_REALCE) return;
    ultimoRealce = agora;
    tocar('realce');
  }, true);
  document.addEventListener('pointerout', function (e) {
    if (!alvoRealce || !e.target.closest) return;
    var para = e.relatedTarget;
    if (!para || !alvoRealce.contains(para)) alvoRealce = null;
  }, true);
  // o ponteiro parado sobre um botão que acabou de chegar: o primeiro movimento dentro dele dá o realce
  document.addEventListener('pointermove', function (e) {
    if (alvoRealce && !alvoRealce.isConnected) alvoRealce = null;
    if (e.pointerType !== 'mouse' || !e.target.closest || alvoRealce) return;
    var alvo = e.target.closest('[data-sound-hover="0"]');
    if (!alvo) return;
    alvoRealce = alvo;
    var agora = performance.now();
    if (agora - ultimoRealce < INTERVALO_REALCE) return;
    ultimoRealce = agora;
    tocar('realce');
  }, { passive: true });

  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var botaoSom = e.target.closest('[data-som-alternar]');
    if (botaoSom) {
      var desligar = !desligados();
      raiz.classList.toggle('sons-desligados', desligar);
      if (window.Howler && typeof window.Howler.mute === 'function') window.Howler.mute(desligar);
      if (!desligar) carregar();
      return;
    }
    // só conta como navegação o link para outra página do site, aberto na mesma aba; o da página atual só fecha o menu, e
    // e-mail, outro site ou Ctrl+clique não trocam a página
    var link = e.target.closest('a[href]:not([target])');
    if (link && link.origin === location.origin && link.pathname !== location.pathname && !e.ctrlKey && !e.metaKey && !e.shiftKey) navegando = performance.now();
    if (e.target.closest('[data-sound-hover="0"]')) tocar('acionar');
  }, true);

  document.addEventListener('fhd:menu', function (e) {
    var agora = performance.now();
    if (agora - ultimaAcao > 800) return; // só o que o visitante fez
    if (e.detail && e.detail.aberto) tocar('abrir');
    else if (agora - navegando > 1500) tocar('fechar');
  });
})();
