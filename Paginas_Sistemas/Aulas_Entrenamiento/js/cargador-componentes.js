(function () {
  "use strict";

  // Scripts existentes: se cargan DESPUÉS de inyectar los componentes, en este orden.
  const SCRIPTS = [
    "js/navegacion.js",
    "js/cursos_mylab.js",
    "js/cursos_connect.js",
    "js/cursos_aleks.js",
    "js/altura.js",
  ];

  async function cargarComponente(el) {
    const ruta = el.dataset.component;
    try {
      const res = await fetch(ruta);
      if (!res.ok) throw new Error(res.status + " " + res.statusText);

      const html = await res.text();

      // 1) Parsear el HTML traído (sin inyectarlo aún en el documento)
      const doc = new DOMParser().parseFromString(html, "text/html");

      // 2) Extraer únicamente las <section class="slide">
      const slides = Array.from(doc.querySelectorAll('section.slide'));

      if (slides.length === 0) {
        console.warn("Sin <section class=\"slide\"> en:", ruta);
        el.innerHTML = "<!-- sin slides en " + ruta + " -->";
        return;
      }

      // 3) Adoptar los nodos al documento actual (los saca del doc parseado)
      const nodos = slides.map((s) => document.adoptNode(s));

      // 4) Sustituir el placeholder por las slides.
      //    Como el placeholder está dentro de #slidesTrack, las slides
      //    quedan directamente en el track (un único track).
      const track = document.getElementById("slidesTrack");
      if (track && track.contains(el)) {
        el.replaceWith(...nodos);
      } else {
        // Fallback por si el placeholder no estuviera dentro del track
        if (track) {
          track.append(...nodos);
          el.remove();
        } else {
          console.error("No existe #slidesTrack");
          el.replaceWith(...nodos);
        }
      }
    } catch (err) {
      console.error("No se pudo cargar el componente:", ruta, err);
      el.innerHTML = "<!-- error al cargar " + ruta + " -->";
    }
  }

  function cargarScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Fallo al cargar " + src));
      document.body.appendChild(s);
    });
  }

  async function iniciar() {
    const placeholders = document.querySelectorAll("[data-component]");
    await Promise.all(Array.from(placeholders).map(cargarComponente));

    for (const src of SCRIPTS) {
      await cargarScript(src);
    }

    // Compatibilidad: los JS existentes que escuchan DOMContentLoaded
    // y se cargaron tras ese evento lo reciben de nuevo aquí.
    document.dispatchEvent(new Event("DOMContentLoaded"));
    document.dispatchEvent(new CustomEvent("componentes:listos"));

    // Respeta anclas (#dudas, etc.) cuando el contenido aparece tarde
    if (location.hash) {
      const destino = document.querySelector(location.hash);
      if (destino) destino.scrollIntoView();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  } else {
    iniciar();
  }
})();