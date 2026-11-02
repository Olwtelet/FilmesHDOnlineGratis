// Local replica only (not part of the original site). Loaded before app.js on the home page.
// Observes the opening and acts only on a state that has actually failed, so a healthy load keeps
// the original look, order and timing. Causes and measurements are in README.md, "Inicialização da home".
//
// Failure states handled here:
//  - an image that feeds a WebGL texture fails (local-imagens.js swaps it): without the mask, the films vanish;
//  - app.js or WebGL do not come up: ENTER would never appear, or the home would stay hidden after it;
//  - the WebGL context is lost: the films would vanish, so the page's own images are shown;
//  - a second click on ENTER: every assignment to the runtime's state re-emits its event, so the tutorial
//    would run twice (and the transition too, if both fades end in the same frame);
//  - the tutorial video refused or interrupted: app.js leaves the promise from play() unhandled.
(function () {
  var wrapper = document.querySelector('[data-preloader="w"]');
  if (!wrapper) return;

  var TICK_MS = 250;
  var ENTER_MS = 3500; // the original shows ENTER this long after app.js runs
  var ENTER_AFTER_APP_MS = ENTER_MS + 2500; // no failure was seen, but ENTER did not come
  var ENTER_LIMIT_MS = 15000; // app.js still not there
  var CLOSE_LIMIT_MS = 1800; // the original fades the overlay in 300 ms
  var HOME_LIMIT_MS = 12000; // the home is still hidden this long after ENTER and after the last texture image
  var HOME_HARD_LIMIT_MS = 120000; // the same, with a request that never ends
  var COOKIE_NAME = 'preloader_shown';
  var COOKIE_MS = 60 * 60 * 1000;

  var started = performance.now();
  var state = (window.__localPreloader = { log: [], failedImages: [], enterAccepted: false, fallbackEnter: false, homeForced: false, glFailed: false, runtimeDead: false });
  var note = function (type, detail) {
    state.log.push([Math.round(performance.now()), type, detail === undefined ? null : detail]);
  };

  // A troca da imagem que falha fica em local-imagens.js, que roda logo depois deste arquivo (os dois deferidos, nesta
  // ordem): a inscrição espera o load dele e chega antes do app.js. Sem ele não há proxy, e nada fica pendente.
  var imagesPending = function () { return window.__imagens ? window.__imagens.pendentes : 0; };
  var imagensScript = document.querySelector('script[src$="/assets/js/local-imagens.js"]');
  if (imagensScript) {
    imagensScript.addEventListener('load', function () {
      if (!window.__imagens) return;
      window.__imagens.aoFalhar.push(function (src) {
        state.failedImages.push(src);
        note('texture-image-failed', src);
        // the mask's alpha comes from its red channel: without it WebGL draws every film as transparent
        if (/all-masks/.test(src)) showDomImages();
      });
    });
  }

  // O app.js chama o play() do tutorial sem tratar a promessa. Se o tutorial sair do DOM antes de o vídeo chegar (FECHAR em
  // rede lenta), viraria um AbortError sem tratamento; o mesmo vale para arquivo que falha ou reprodução recusada. O pôster
  // continua na caixa e as dicas seguem.
  var tutorialVideo = document.querySelector('[data-tutorial="video"]');
  if (tutorialVideo) {
    var playOriginal = tutorialVideo.play;
    tutorialVideo.play = function () {
      var promessa = playOriginal.call(this);
      if (promessa) promessa.catch(function (err) { note('tutorial-video-refused', err.name); });
      return promessa;
    };
  }

  var btn = wrapper.querySelector('[data-preloader="btn"]');
  var appScript = document.querySelector('script[src$="/assets/js/app.js"]');
  var appLoadedAt = null;
  var closedByFallback = false;
  if (appScript) {
    appScript.addEventListener('load', function () {
      appLoadedAt = performance.now();
      if (state.runtimeDead) return;
      // the runtime arrived late: it takes over from whatever the fallback did
      closedByFallback = false;
      if (state.fallbackEnter && wrapper.isConnected) {
        // its own ENTER comes in 3.5 s; closing the overlay before that would leave it waiting forever
        state.fallbackEnter = false;
        btn.onclick = null;
        btn.style.visibility = '';
        btn.style.opacity = '';
      }
      if (state.homeForced) giveLayoutBack();
    });
    appScript.addEventListener('error', function () { state.runtimeDead = true; note('app-script-failed'); });
  }

  // WebGL: the runtime stops at load if there is no context, and goes on without a picture if it loses one.
  var markGlFailed = function (why) {
    if (state.glFailed) return;
    state.glFailed = true;
    note('webgl-failed', why);
    showDomImages();
  };
  window.addEventListener('webglcontextlost', function () { markGlFailed('context lost'); }, true);
  window.addEventListener('error', function (e) {
    // only an error while app.js is starting means the runtime is gone: its load event comes right after that
    if (appLoadedAt !== null || !e.message || !e.filename || !/\/app\.js/.test(e.filename)) return;
    state.runtimeDead = true;
    note('app-script-threw', e.message);
    if (/renderer|webgl/i.test(e.message)) markGlFailed(e.message);
  });

  // ENTER: only the first click goes through to the original handler.
  document.addEventListener('click', function (e) {
    if (!btn.contains(e.target) || !btn.onclick) return;
    if (state.enterAccepted) {
      e.stopImmediatePropagation();
      e.preventDefault();
      note('enter-repeat-ignored');
      return;
    }
    state.enterAccepted = true;
    state.enterAcceptedAt = performance.now();
    note('enter-accepted');
  }, true);

  var domImagesShown = false;
  function showDomImages() {
    if (domImagesShown) return;
    domImagesShown = true;
    // the runtime hides the roll <img> because WebGL draws them; a rule also covers a roll rebuilt after a page change
    var style = document.createElement('style');
    style.textContent = '[data-roll="item"] img{opacity:1!important}';
    document.head.appendChild(style);
  }

  function revealHome(why) {
    if (state.homeForced) return;
    state.homeForced = true;
    note('home-forced', why);
    var taxi = document.querySelector('[data-taxi]');
    taxi.style.visibility = 'visible';
    taxi.style.opacity = '1';
    // parts the runtime would reveal on its own ANIMATE_IN event
    var show = function (el) {
      if (!el) return;
      el.style.visibility = 'visible';
      el.style.opacity = '1';
      el.style.transform = 'none';
    };
    show(document.querySelector('.nav-w'));
    show(document.querySelector('[data-a="logo"]'));
    show(document.querySelector('[data-a="menu"]'));
    showDomImages();
    if (!state.runtimeDead && appLoadedAt !== null) return;
    // without the runtime the roll is a plain column of films: it has to scroll, and nothing can close the tutorial
    var tutorial = document.querySelector('[data-tutorial="w"]');
    if (tutorial) tutorial.remove();
    var home = document.querySelector('[data-page="home"]');
    if (home) home.style.setProperty('height', 'auto', 'important');
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
  }

  function giveLayoutBack() {
    var home = document.querySelector('[data-page="home"]');
    if (home) home.style.removeProperty('height');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    window.dispatchEvent(new Event('resize'));
  }

  function closeOverlay() {
    var expires = new Date(Date.now() + COOKIE_MS).toUTCString();
    document.cookie = COOKIE_NAME + '=' + Date.now() + '; expires=' + expires + '; path=/';
    wrapper.remove();
    note('overlay-removed');
  }

  function showFallbackEnter(why) {
    state.fallbackEnter = true;
    note('fallback-enter', why);
    btn.onclick = function () {
      closedByFallback = true;
      closeOverlay();
    };
    btn.style.visibility = 'visible';
    btn.style.opacity = '1';
  }

  function watchEnter(now) {
    if (btn.onclick) {
      // the original set its handler, but frames stopped before its fade showed the button
      if (appLoadedAt !== null && now - appLoadedAt >= ENTER_AFTER_APP_MS && getComputedStyle(btn).visibility === 'hidden') {
        note('enter-shown');
        btn.style.visibility = 'visible';
        btn.style.opacity = '1';
      }
      return;
    }
    if (state.runtimeDead && now - started >= ENTER_MS) return showFallbackEnter('runtime did not start');
    if (appLoadedAt !== null && now - appLoadedAt >= ENTER_AFTER_APP_MS) return showFallbackEnter('no handler after app.js');
    if (appLoadedAt === null && now - started >= ENTER_LIMIT_MS) showFallbackEnter('app.js not loaded in time');
  }

  var interval;
  var closedAt = null;
  var lastImageWait = 0;
  var wasHidden = false;
  function tick() {
    var now = performance.now();
    if (document.hidden || wasHidden) {
      // timers and frames are throttled in a hidden tab; the first tick back only restarts the clocks
      wasHidden = document.hidden;
      if (appLoadedAt !== null) appLoadedAt = now;
      if (state.enterAcceptedAt) state.enterAcceptedAt = now;
      if (closedAt !== null) closedAt = now;
      return;
    }
    if (wrapper.isConnected) {
      watchEnter(now);
      if (state.enterAccepted && now - state.enterAcceptedAt >= CLOSE_LIMIT_MS) {
        note('overlay-did-not-close');
        closeOverlay();
      }
      return;
    }
    if (closedAt === null) closedAt = now;
    var taxi = document.querySelector('[data-taxi]');
    if (getComputedStyle(taxi).visibility !== 'hidden') {
      clearInterval(interval);
      return;
    }
    if (imagesPending() > 0) lastImageWait = now;
    if (closedByFallback || state.runtimeDead) revealHome('known failure');
    else if (now - closedAt >= HOME_HARD_LIMIT_MS || now - Math.max(closedAt, lastImageWait) >= HOME_LIMIT_MS) revealHome('home still hidden');
  }

  interval = setInterval(function () {
    try { tick(); } catch (err) { note('watchdog-error', String(err)); }
  }, TICK_MS);
})();
