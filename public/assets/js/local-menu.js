// Filtro do painel pequeno do menu e rolagem da lista. Ouve em document porque o Taxi troca a nav a cada navegação.
// Os módulos do bundle ouvem teclado, roda e toque em window: parar a propagação aqui impede que o carrossel gire e que
// o menu, que fecha quando a página se move, feche o painel.
(function () {
  'use strict';

  function dobrar(texto) {
    return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  }

  function eFiltro(alvo) {
    return alvo && alvo.classList && alvo.classList.contains('menu-filtro');
  }

  // Esconde as linhas sem removê-las: a posição de cada uma é o índice do carrossel.
  function filtrar(campo) {
    var painel = campo.closest('.small-panel');
    if (!painel) return;
    var termos = dobrar(campo.value).split(/\s+/).filter(Boolean);
    var visiveis = 0;
    painel.querySelectorAll('.menu-film').forEach(function (linha) {
      var busca = linha.getAttribute('data-busca') || '';
      var ok = termos.every(function (t) { return busca.indexOf(t) !== -1; });
      linha.classList.toggle('menu-film-oculta', !ok);
      if (ok) visiveis++;
    });
    painel.querySelector('.menu-filtro-vazio').hidden = visiveis > 0;
    painel.querySelector('.menu-films-w').scrollTop = 0;
  }

  document.addEventListener('input', function (e) {
    if (eFiltro(e.target)) filtrar(e.target);
  });

  document.addEventListener('keydown', function (e) {
    var campo = e.target;
    if (!eFiltro(campo)) return;
    e.stopPropagation(); // Espaço, setas e letras não chegam aos carrosséis; o texto entra normalmente no campo
    if (e.isComposing) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      var link = campo.closest('.small-panel').querySelector('.menu-film:not(.menu-film-oculta) .menu-film-direct-link');
      if (link) link.click();
    } else if (e.key === 'Escape') {
      campo.value = '';
      filtrar(campo);
      campo.blur();
    }
  }, true);

  ['wheel', 'touchmove'].forEach(function (tipo) {
    document.addEventListener(tipo, function (e) {
      if (e.target.closest && e.target.closest('.small-panel')) e.stopPropagation();
    }, { passive: true });
  });
})();
