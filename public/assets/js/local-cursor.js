// Cursor do tema: uma mira de calibração de vídeo, para quem usa mouse. Carregado uma vez em todas as páginas; o Taxi só troca
// [data-taxi-view], então o nó fica em body e os ouvintes em window e document. O movimento só guarda dois números e pede um quadro:
// nenhuma leitura de layout, e o laço para sozinho quando o anel alcança o ponto. A classe em html só entra no primeiro movimento de
// mouse: sem este script, ou em toque, movimento reduzido e contraste forçado, fica o cursor do sistema.
(function () {
  if (window.__semCursorSinal) return; // a gravação do tutorial desenha o próprio cursor
  var html = document.documentElement;
  var fino = matchMedia('(hover: hover) and (pointer: fine)');
  var calmo = matchMedia('(prefers-reduced-motion: reduce)');
  var forte = matchMedia('(prefers-contrast: more), (forced-colors: active)');
  var TEXTO = 'textarea, input[type="text"]';
  var LINK = 'a[href], button, label, .mmenu-col.btn, .abs.checkbox-w, [data-roll="menuItem"], [data-tutorial="close"], [data-preloader="btn"]';
  var no, ponto, anel, raf = 0, ult = 0, preso = false, estado = '', ligado = false, x = 0, y = 0, ax = 0, ay = 0;

  function pode() { return fino.matches && !calmo.matches && !forte.matches; }

  function criar() {
    no = document.createElement('div');
    no.className = 'cursor-sinal-no';
    no.setAttribute('aria-hidden', 'true');
    no.innerHTML =
      '<div class="cs-anel"><svg viewBox="-22 -22 44 44" fill="none" stroke="currentColor" stroke-width="1.5">' +
        '<circle class="cs-circulo" r="11"></circle>' +
        '<path class="cs-ticks" d="M0-17v6M0 17v-6M-17 0h6M17 0h-6"></path>' +
        '<path class="cs-setas-v" d="M-4-15l4-4 4 4M-4 15l4 4 4-4"></path>' +
        '<path class="cs-setas-h" d="M-15-4l-4 4 4 4M15-4l4 4-4 4"></path>' +
        '<path class="cs-seta" d="M-5 2.5 0-2.5l5 5"></path>' +
        '<path class="cs-play" d="M-3.5-5.5 5.5 0l-9 5.5z" fill="currentColor" stroke="none"></path>' +
      '</svg><i class="cs-barras"></i></div>' +
      '<div class="cs-ponto"><i></i></div>';
    anel = no.firstChild;
    ponto = no.lastChild;
    document.body.appendChild(no);
  }

  function classificar(el) {
    if (!el || !el.closest) return 'padrao';
    if (el.closest(TEXTO)) return 'texto';
    if (el.closest("[data-videoplayer='trigger']")) return 'play';
    var area = el.closest('[data-hitbox]');
    if (area) return area.classList.contains('left') ? 'esquerda' : area.classList.contains('right') ? 'direita' : area.classList.contains('bottom') ? 'baixo' : 'cima';
    if (el.closest(LINK)) return 'link';
    if (el.closest('[data-cursor="hide"]')) return 'padrao'; // onde o app.js escondia o cursor antigo, a mira fica sem rótulo de arrasto
    if (el.closest('[data-roll="wrapper"]')) return 'arrasto-v';
    if (el.closest('[data-slider="wrapper"], [data-slider="additionaltrigger"], [data-reviews="wrapper"]')) return 'arrasto-h';
    return 'padrao';
  }

  function marcar(novo) {
    if (novo === estado) return;
    estado = novo;
    no.dataset.mira = novo;
  }

  function ligar(e) {
    if (!no) criar();
    if (!ligado) {
      ligado = true;
      html.classList.add('cursor-sinal');
    }
    ax = x = e.clientX;
    ay = y = e.clientY; // volta sem deslizar de uma posição velha
    ult = 0;
    marcar(classificar(e.target));
    no.classList.add('visivel');
  }

  function desligar() {
    ligado = false;
    html.classList.remove('cursor-sinal');
    if (no) no.classList.remove('visivel');
  }

  function quadro(t) {
    raf = 0;
    var k = ult ? 1 - Math.exp(-(t - ult) / 55) : 1;
    ult = t;
    ax += (x - ax) * k;
    ay += (y - ay) * k;
    ponto.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    anel.style.transform = 'translate3d(' + ax + 'px,' + ay + 'px,0)';
    if (Math.abs(x - ax) + Math.abs(y - ay) > 0.2) raf = requestAnimationFrame(quadro);
    else ult = 0;
  }

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || !pode()) return;
    if (!ligado || !no.classList.contains('visivel')) ligar(e);
    x = e.clientX;
    y = e.clientY;
    if (!raf) raf = requestAnimationFrame(quadro);
  }, { capture: true, passive: true });

  // Só quando muda o elemento sob o ponteiro. Com o conteúdo andando e o mouse parado, vale o último estado até o próximo evento.
  document.addEventListener('pointerover', function (e) {
    if (!ligado || preso) return;
    if (e.target.tagName === 'IFRAME') no.classList.remove('visivel');
    else if (e.pointerType === 'mouse' && !no.classList.contains('visivel')) { // o iframe saiu de baixo do ponteiro, sem movimento nenhum
      ligar(e);
      if (!raf) raf = requestAnimationFrame(quadro);
    } else marcar(classificar(e.target));
  }, { capture: true, passive: true });

  window.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse') { desligar(); return; } // híbrido: o toque devolve o cursor do sistema até o próximo movimento de mouse
    if (!ligado) return;
    no.classList.add('apertado');
    preso = /^arrasto/.test(estado); // no arrasto o estado fica, mesmo com o ponteiro passando sobre um link
  }, { capture: true, passive: true });

  function soltar(e) {
    if (!no) return;
    no.classList.remove('apertado');
    if (preso) {
      preso = false;
      marcar(classificar(e.target));
    }
  }
  window.addEventListener('pointerup', soltar, { capture: true, passive: true });
  window.addEventListener('pointercancel', soltar, { capture: true, passive: true });
  window.addEventListener('contextmenu', soltar, { capture: true, passive: true }); // no Mac o botão direito não entrega pointerup
  // Arrastar um link ou uma imagem: o sistema mostra o próprio cursor e os eventos de ponteiro param até soltar.
  window.addEventListener('dragstart', function () { if (no) no.classList.remove('visivel'); }, { capture: true, passive: true });

  html.addEventListener('mouseleave', function () { if (no) no.classList.remove('visivel'); });

  // O nó sob o ponteiro some sem pointerout na troca de página: o próximo movimento reclassifica.
  var taxi = document.querySelector('[data-taxi]');
  if (taxi) new MutationObserver(function () {
    preso = false;
    if (no) { no.classList.remove('apertado'); marcar('padrao'); }
  }).observe(taxi, { childList: true });

  function reavaliar() { if (ligado && !pode()) desligar(); }
  [fino, calmo, forte].forEach(function (m) { m.addEventListener('change', reavaliar); });
})();
