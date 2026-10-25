/* ==================== ALTURA AL PARENT ====================
   Si la página está dentro de un iframe, le avisa su altura a la página contenedora. */
(function () {
  var ultima = 0;
  function enviarAltura() {
    // Se mide el contenido real (.ae-page), no documentElement.scrollHeight: éste nunca baja
    // de la altura del iframe, así que el iframe jamás podría encogerse y quedaba espacio vacío.
    var page = document.querySelector('.ae-page') || document.body;
    var altura = Math.ceil(page.getBoundingClientRect().bottom + window.pageYOffset);
    if (altura === ultima) return;
    ultima = altura;
    if (window.parent !== window) {
      window.parent.postMessage({ tipo: 'setAltura', altura: altura }, '*');
    }
  }
  window.aeEnviarAltura = enviarAltura;   // la reutiliza el script de diapositivas
  window.addEventListener('load', enviarAltura);
  window.addEventListener('resize', enviarAltura);
  var observer = new MutationObserver(enviarAltura);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true });
})();
