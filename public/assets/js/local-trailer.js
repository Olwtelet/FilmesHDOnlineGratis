// Trailer do YouTube dentro do diálogo do app.js (classe Ia), sem editar o bundle. Carregado uma vez em todas as páginas:
// o Taxi só troca [data-taxi-view] e não reexecuta este arquivo, então os ouvintes ficam em window e document e os nós
// são procurados na hora do evento. Nenhuma requisição ao YouTube antes do clique, e o iframe sai ao fechar.
(function () {
  var D = "[data-videoplayer='dialog']";
  var FECHAR = "[data-videoplayer='close']";
  var ESCURO = "[data-videoplayer='darken']";
  var ultimaFoiTab = false;
  var q = function (s) { return document.querySelector(s); };
  var html = document.documentElement;

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
  // A classe em html é o que o tema e o cursor leem; com :has(.open) no body, cada inserção no DOM recalculava o estilo da página inteira.
  function vigiar() {
    var d = q(D);
    if (!d) return;
    var obs = new MutationObserver(function () {
      html.classList.toggle('trailer-aberto', d.classList.contains('open'));
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
      else if (document.hidden) setTimeout(function () { tenta(n); }, 100); // sem quadros o escurecimento não anda: o pedido espera a volta à aba
      else if (n < 100) setTimeout(function () { tenta(n + 1); }, 100);
    })(0);
  }

  // Girar o aparelho muda a altura da página, e com o Lenis parado não há como rolar de volta: o player, o X e o link ficariam
  // fora da tela. O app.js só centra ao abrir. Duas passadas, porque os blocos da página ainda se recalculam depois do resize.
  function recentrar() {
    var d = q(D);
    var wrap = q("[data-videoplayer='wrapper']");
    if (!d || !wrap || !d.classList.contains('open')) return;
    var r = wrap.getBoundingClientRect();
    window.scrollTo(0, window.scrollY + r.top + r.height / 2 - window.innerHeight / 2);
  }
  // A página trocada com o diálogo aberto leva o observador junto com o nó.
  var taxi = q('[data-taxi]');
  if (taxi) new MutationObserver(function () {
    if (!q(D + '.open')) html.classList.remove('trailer-aberto');
  }).observe(taxi, { childList: true });

  var esperas = [];
  window.addEventListener('resize', function () {
    esperas.forEach(clearTimeout);
    esperas = [setTimeout(recentrar, 150), setTimeout(recentrar, 900)];
  });

  function trocarTrailer(botao) {
    var wrap = q("[data-videoplayer='wrapper']");
    if (!wrap || botao.getAttribute('aria-pressed') === 'true') return;
    wrap.dataset.youtube = botao.dataset.trailer;
    wrap.dataset.youtubeTitle = botao.dataset.trailerTitle;
    botao.parentNode.querySelectorAll('[data-trailer]').forEach(function (b) {
      b.setAttribute('aria-pressed', b === botao ? 'true' : 'false');
    });
    var fora = q('[data-trailer-fora]');
    if (fora) {
      fora.href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(botao.dataset.trailer);
      fora.setAttribute('aria-label', botao.dataset.trailerTitle + ': abrir no YouTube, em nova aba');
    }
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
    // Com o diálogo aberto, só se chega ao link do YouTube ou, pelo teclado, aos links atrás do escurecimento. A aba nova para os
    // quadros e o fechamento só terminaria na volta, então o som do player sai antes.
    if (alvo.closest('a[href]')) {
      if (alvo.closest('[data-trailer-fora]')) {
        var f = q('iframe.yt-trailer');
        if (f) f.remove();
      }
      fechar();
    }
  }, true);

  window.addEventListener('keydown', function (e) {
    ultimaFoiTab = e.key === 'Tab';
    if (e.key === 'Escape') fechar();
  }, true);

  // O Tab move o foco no keydown: se o keyup ainda chega aqui, o foco não entrou no player, e um clique nele depois não conta como
  // chegada pelo teclado. A exceção é o foco a caminho do player: cruzar para o iframe de outra origem leva alguns ms, e nesse
  // meio-tempo o ativo já é o body ou o iframe, com o blur ainda por vir. Dentro do player o keyup fica lá, e o ponteiro no site
  // também encerra a chegada pelo teclado.
  window.addEventListener('keyup', function (e) {
    if (e.key !== 'Tab') return;
    var a = document.activeElement;
    if (a !== document.body && a !== q('iframe.yt-trailer')) ultimaFoiTab = false;
  }, true);
  window.addEventListener('pointerdown', function () { ultimaFoiTab = false; }, true);

  window.addEventListener('popstate', fechar, true);

  // Tecla dentro de um iframe de outra origem nunca chega aqui: depois de um clique no player o Escape se perderia.
  // Devolve o foco ao diálogo, com atraso para o player terminar o próprio clique (com 0 ms o real perdia o clique).
  // Quem chega com Tab fica lá dentro e mantém os atalhos do YouTube. A marca vale só para o blur causado pela própria tecla: um Tab
  // que sai para a barra do navegador não pode fazer um clique posterior no player passar por chegada pelo teclado.
  window.addEventListener('blur', function () {
    var porTab = ultimaFoiTab;
    ultimaFoiTab = false;
    if (porTab) return;
    setTimeout(function () {
      var f = q('iframe.yt-trailer');
      if (!f || document.activeElement !== f || document.fullscreenElement) return;
      q(D).focus({ preventScroll: true });
    }, 400);
  });

  // Ao sair da tela cheia o foco continua no player, e o Escape seguinte não chegaria aqui.
  document.addEventListener('fullscreenchange', function () {
    if (document.fullscreenElement) return;
    setTimeout(function () {
      var f = q('iframe.yt-trailer');
      if (f && document.activeElement === f) q(D).focus({ preventScroll: true });
    }, 400);
  });
})();
