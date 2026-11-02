// Trailer do YouTube dentro do diálogo do app.js (classe Ia), sem editar o bundle. Carregado uma vez em todas as páginas:
// o Taxi só troca [data-taxi-view] e não reexecuta este arquivo, então os ouvintes ficam em window e document e os nós
// são procurados na hora do evento. Nenhuma requisição ao YouTube antes do clique, e o iframe sai ao fechar.
(function () {
  var D = "[data-videoplayer='dialog']";
  var FECHAR = "[data-videoplayer='close']";
  var ESCURO = "[data-videoplayer='darken']";
  var ultimaFoiTab = false;
  var q = function (s) { return document.querySelector(s); };

  // O Ia liga em document um Escape que chama closeModal direto: isOpen e o menu ficam errados e, com o diálogo fechado, ele
  // inverte .open. E cada sessão visitada deixa mais um, nunca removido. Este arquivo roda antes do app.js, que é deferido,
  // então esse ouvinte nem chega a existir; os outros, como o do filtro do menu, seguem normais.
  var ligar = document.addEventListener;
  document.addEventListener = function (tipo, ouvinte) {
    if (tipo === 'keydown' && /closeModal/.test(String(ouvinte))) return;
    return ligar.apply(this, arguments);
  };

  function montar() {
    var wrap = q("[data-videoplayer='wrapper']");
    var id = wrap && wrap.dataset.youtube;
    if (!id || wrap.querySelector('iframe')) return;
    var f = document.createElement('iframe');
    f.className = 'yt-trailer';
    f.title = wrap.dataset.youtubeTitle || 'Trailer';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin'; // sem o Referer o YouTube responde com o erro 153
    f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&playsinline=1';
    wrap.querySelector('.video-mask-w').appendChild(f);
  }

  // Seja qual for o caminho, o player sai quando o diálogo fecha de verdade: o áudio não sobrevive a um tween atrasado.
  function vigiar() {
    var d = q(D);
    if (!d) return;
    var obs = new MutationObserver(function () {
      if (d.classList.contains('open')) return;
      obs.disconnect();
      var f = d.querySelector('iframe.yt-trailer');
      if (f) f.remove();
      var gatilho = q("[data-videoplayer='trigger']");
      if (gatilho && d.isConnected) gatilho.focus({ preventScroll: true });
    });
    obs.observe(d, { attributes: true, attributeFilter: ['class'] });
  }

  // Sempre pelo botão, que passa pelo toggleState do app.js: é o que mantém isOpen e o menu em dia. Enquanto abre, o app.js
  // ignora o botão, então o pedido espera: o fim da abertura é o escurecimento chegar a .9, e um relógio aqui erraria com a
  // página ocupada, porque o GSAP desconta os travamentos. Com a página trocada no meio do caminho o botão, já fora do DOM,
  // continua ligado ao Ia antigo: sem isso, o Lenis ficaria parado na página seguinte.
  function fechar() {
    var d = q(D);
    var b = q(FECHAR);
    var escuro = q(ESCURO);
    if (!d || !b || !d.classList.contains('open')) return;
    (function tenta(n) {
      if (!d.classList.contains('open')) return;
      if (parseFloat(escuro.style.opacity) >= 0.9) b.click();
      else if (n < 100) setTimeout(function () { tenta(n + 1); }, 100);
    })(0);
  }

  function trocarTrailer(botao) {
    var wrap = q("[data-videoplayer='wrapper']");
    if (!wrap || botao.getAttribute('aria-pressed') === 'true') return;
    wrap.dataset.youtube = botao.dataset.trailer;
    wrap.dataset.youtubeTitle = botao.dataset.trailerTitle;
    botao.parentNode.querySelectorAll('[data-trailer]').forEach(function (b) {
      b.setAttribute('aria-pressed', b === botao ? 'true' : 'false');
    });
    var f = wrap.querySelector('iframe.yt-trailer');
    if (f) f.remove(); // um iframe novo em vez de trocar o src, que criaria uma entrada no histórico do navegador
    montar();
  }

  document.addEventListener('click', function (e) {
    var alvo = e.target;
    if (alvo.closest("[data-videoplayer='trigger']")) {
      montar();
      vigiar();
      // o gatilho some logo em seguida e levaria o foco junto; o tween do diálogo já começou aos 60 ms
      setTimeout(function () { var d = q(D); if (d) d.focus({ preventScroll: true }); }, 60);
      return;
    }
    if (alvo.closest(ESCURO)) {
      fechar(); // o app.js só liga o escurecimento dentro do setupVideo, que nunca roda sem fonte no <video>
      return;
    }
    if (alvo.closest(FECHAR)) {
      if (!(parseFloat(q(ESCURO).style.opacity) >= 0.9)) fechar(); // este clique o app.js ignora
      return;
    }
    var opcao = alvo.closest('[data-trailer]');
    if (opcao) {
      trocarTrailer(opcao);
      return;
    }
    // só o teclado chega a um link com o diálogo aberto: o escurecimento cobre o resto
    if (alvo.closest('a[href]')) fechar();
  }, true);

  window.addEventListener('keydown', function (e) {
    ultimaFoiTab = e.key === 'Tab';
    if (e.key === 'Escape') fechar();
  }, true);

  window.addEventListener('popstate', fechar, true);

  // Tecla dentro de um iframe de outra origem nunca chega aqui: depois de um clique no player o Escape se perderia.
  // Devolve o foco ao diálogo, com atraso para o player terminar o próprio clique (com 0 ms o real perdia o clique).
  // Quem chega com Tab fica lá dentro e mantém os atalhos do YouTube.
  window.addEventListener('blur', function () {
    if (ultimaFoiTab) return;
    setTimeout(function () {
      var f = q('iframe.yt-trailer');
      if (!f || document.activeElement !== f || document.fullscreenElement) return;
      q(D).focus({ preventScroll: true });
    }, 400);
  });
})();
