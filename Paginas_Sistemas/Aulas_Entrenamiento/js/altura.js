/* ==================== ALTURA AL PARENT ====================
   Si la página está dentro de un iframe, le avisa su altura a la página contenedora. */
(function () {
  function enviarAltura() {
    var altura = document.documentElement.scrollHeight;
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
