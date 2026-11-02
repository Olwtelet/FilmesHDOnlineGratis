// Carregado antes do app.js em todas as páginas. O app.js só escuta onload nas imagens que viram textura: uma falha
// deixaria a home ou a Programação ocultas para sempre. A imagem que falha vira um pixel transparente e a página segue.
// A máscara vira um pixel branco: o alfa de todos os filmes vem dela, e os filmes aparecem sem o recorte em vez de sumir.
(function () {
  var PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  var PIXEL_BRANCO = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=';
  var Nativa = window.Image;
  var trocadas = new WeakSet();
  var estado = (window.__imagens = { pendentes: 0, falhas: [], aoFalhar: [] });
  window.Image = new Proxy(Nativa, {
    construct: function (Alvo, args) {
      var img = Reflect.construct(Alvo, args);
      estado.pendentes++;
      img.addEventListener('load', function () { estado.pendentes--; }, { once: true });
      img.addEventListener('error', function () {
        if (trocadas.has(img)) return;
        trocadas.add(img);
        var origem = img.src;
        estado.falhas.push(origem);
        estado.aoFalhar.forEach(function (f) { f(origem); });
        img.src = /all-masks/.test(origem) ? PIXEL_BRANCO : PIXEL;
      });
      return img;
    },
  });
})();
