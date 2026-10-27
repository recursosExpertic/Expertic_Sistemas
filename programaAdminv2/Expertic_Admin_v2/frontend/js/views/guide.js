import { h, icon } from '../dom.js';

const step = (n, title, ...body) =>
  h('section', { class: 'card' },
    h('div', { class: 'card-body' },
      h('h2', {}, h('span', { class: 'step-num' }, n), title),
      ...body));

export function renderGuide(root) {
  root.append(h('div', { class: 'guide' },
    h('div', { class: 'page-header' },
      h('div', {},
        h('h1', {}, 'Cómo editar las lecciones'),
        h('p', {}, 'Guía rápida del administrador académico.'))),

    h('div', { class: 'callout' }, icon('info'),
      h('div', {},
        h('strong', {}, 'Nada se guarda hasta que pulses “Guardar cambios”. '),
        'Puedes editar varias lecciones a la vez, cambiar de pestaña o de lección sin perder lo escrito, y guardar todo junto al final. ',
        'Si algo falla, no se guarda nada a medias.')),

    step(1, 'Abre la asignatura',
      h('p', {}, 'En ', h('a', { href: '#/' }, 'Asignaturas'), ' escribe parte del nombre, el código, la escuela, la facultad o el ID. ',
        'Pulsa ', h('strong', {}, 'Editar'), ' en la tarjeta. Si no existe, créala desde ', h('a', { href: '#/nueva' }, 'Nueva'), '.')),

    step(2, 'Elige o crea una lección',
      h('ul', {},
        h('li', {}, 'A la izquierda está la lista de lecciones, ', h('strong', {}, 'agrupadas por módulo'), '. Haz clic en una para editarla.'),
        h('li', {}, h('strong', {}, '+ Nueva'), ' crea una lección vacía en el mismo módulo de la que estás viendo.'),
        h('li', {}, h('strong', {}, 'Duplicar'), ' copia la lección actual con todo su contenido; útil cuando dos lecciones se parecen.'),
        h('li', {}, 'Un ', h('strong', {}, 'punto naranja'), ' junto a una lección indica que tiene cambios sin guardar; la etiqueta ',
          h('span', { class: 'badge badge-warn' }, 'nueva'), ' indica que todavía no existe en la base de datos.'))),

    step(3, 'Completa los datos generales',
      h('p', {}, 'Arriba del editor están los campos que siempre se ven:'),
      h('ul', {},
        h('li', {}, h('strong', {}, 'Nombre de la lección'), ' (obligatorio).'),
        h('li', {}, h('strong', {}, 'Módulo'), ' (obligatorio). Escribe exactamente el mismo texto en todas las lecciones del módulo para que queden agrupadas.'),
        h('li', {}, h('strong', {}, 'Link del resumen'), ' (opcional). Debe ser una URL completa que empiece por https://. El botón ',
          icon('external'), ' lo abre en otra pestaña para comprobarlo.'))),

    step(4, 'Llena cada pestaña',
      h('table', { class: 'guide-table' },
        h('thead', {}, h('tr', {}, h('th', {}, 'Pestaña'), h('th', {}, 'Qué va'), h('th', {}, 'Cómo se edita'))),
        h('tbody', {},
          h('tr', {}, h('td', {}, 'Competencias'), h('td', {}, 'Lo que el estudiante logrará.'),
            h('td', {}, 'Una por fila. Pulsa ', h('kbd', {}, 'Enter'), ' para crear la siguiente.')),
          h('tr', {}, h('td', {}, 'Videos'), h('td', {}, 'Título, enlace e imagen (miniatura).'),
            h('td', {}, 'Al pegar la URL de la imagen y salir del campo se ve la vista previa.')),
          h('tr', {}, h('td', {}, 'Simuladores'), h('td', {}, 'Igual que videos.'), h('td', {}, '—')),
          h('tr', {}, h('td', {}, 'Libros'), h('td', {}, 'Igual que videos; la imagen es la portada.'), h('td', {}, '—')),
          h('tr', {}, h('td', {}, 'Bibliografía'), h('td', {}, 'Tema → Subtemas → Referencias (libro + enlace).'),
            h('td', {}, 'Agrega un tema, dentro de él sus subtemas y dentro de cada subtema sus referencias.')),
          h('tr', {}, h('td', {}, 'Preguntas'), h('td', {}, 'Preguntas de autoevaluación.'),
            h('td', {}, 'Cada pregunta tiene un cuadro de texto que crece con el contenido.')))),
      h('p', {}, 'El número junto a cada pestaña indica cuántos elementos tiene. En cada fila puedes ',
        h('strong', {}, 'subir'), ' ', icon('up'), ', ', h('strong', {}, 'bajar'), ' ', icon('down'),
        ' o ', h('strong', {}, 'quitar'), ' ', icon('trash'), ' el elemento.'),
      h('p', {}, 'Las filas que dejes completamente vacías se descartan solas al guardar.')),

    step(5, 'Guarda',
      h('ul', {},
        h('li', {}, 'Pulsa ', h('strong', {}, 'Guardar cambios'), ' (arriba a la derecha) o ', h('kbd', {}, 'Ctrl'), ' + ', h('kbd', {}, 'S'), '.'),
        h('li', {}, 'Si falta algo obligatorio, el campo se marca en rojo y el editor salta a la lección con el problema. ',
          h('strong', {}, 'En ese caso no se guarda nada'), ', corrige y vuelve a guardar.'),
        h('li', {}, h('strong', {}, 'Descartar'), ' vuelve a cargar todo como estaba en la base de datos.'),
        h('li', {}, 'Si intentas salir con cambios pendientes, la página te avisa antes.'))),

    step(6, 'Eliminar',
      h('ul', {},
        h('li', {}, 'Eliminar una ', h('strong', {}, 'lección'), ' (icono ', icon('trash'), ' en el editor) se aplica al guardar; hasta entonces puedes deshacerlo con Descartar.'),
        h('li', {}, 'Eliminar una ', h('strong', {}, 'asignatura'), ' (desde el listado) es inmediato y borra también todas sus lecciones.'))),

    h('div', { class: 'callout callout-warn' }, icon('warn'),
      h('div', {},
        h('strong', {}, 'Ojo con los nombres. '),
        'Las plantillas de las páginas buscan cada lección por el ', h('strong', {}, 'nombre de la asignatura'), ' + el ',
        h('strong', {}, 'nombre de la lección'), '. Si cambias alguno de los dos, el editor te avisa, y deberás actualizar también la plantilla correspondiente. ',
        'Evita también tener dos lecciones con el mismo nombre en una asignatura.')),
  ));
}
