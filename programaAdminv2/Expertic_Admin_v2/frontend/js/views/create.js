import { api } from '../api.js';
import { h, toast } from '../dom.js';
import { navigate } from '../router.js';

const FIELDS = [
  { name: 'nombre', label: 'Nombre', required: true, hint: 'Las plantillas buscan la asignatura por este nombre exacto.' },
  { name: 'codigo', label: 'Código', hint: 'Opcional. Debe ser único (ej. MAT-101).' },
  { name: 'escuela', label: 'Escuela', required: true },
  { name: 'facultad', label: 'Facultad', required: true },
];

export function renderCreate(root) {
  const inputs = {};
  const errors = {};

  const fields = FIELDS.map(f => {
    inputs[f.name] = h('input', { type: 'text', name: f.name, required: f.required, maxlength: f.name === 'codigo' ? 50 : 300 });
    errors[f.name] = h('span', { class: 'field-error', hidden: true });
    return h('label', { class: 'field' },
      h('span', { class: 'field-label' }, f.label, f.required && h('span', { class: 'req' }, ' *')),
      inputs[f.name],
      f.hint && h('span', { class: 'field-hint' }, f.hint),
      errors[f.name]);
  });

  const submit = h('button', { type: 'submit', class: 'btn btn-primary' }, 'Crear y agregar lecciones');
  const form = h('form', { class: 'card card-body', novalidate: true }, ...fields,
    h('div', { class: 'flex mt-2' }, submit, h('a', { href: '#/', class: 'btn btn-ghost' }, 'Cancelar')));

  root.append(
    h('div', { class: 'narrow' },
      h('div', { class: 'page-header' },
        h('div', {}, h('h1', {}, 'Nueva asignatura'),
          h('p', {}, 'Después de crearla podrás agregar sus lecciones.'))),
      form));

  function showErrors(map) {
    for (const name of Object.keys(errors)) {
      const msg = map[name];
      errors[name].textContent = msg ?? '';
      errors[name].hidden = !msg;
      inputs[name].classList.toggle('invalid', Boolean(msg));
    }
    const first = Object.keys(map)[0];
    if (first) inputs[first].focus();
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(Object.entries(inputs).map(([k, el]) => [k, el.value.trim()]));
    const missing = Object.fromEntries(FIELDS.filter(f => f.required && !data[f.name]).map(f => [f.name, `${f.label} es obligatorio`]));
    showErrors(missing);
    if (Object.keys(missing).length) return;

    submit.disabled = true;
    try {
      const { id } = await api.createAsignatura(data);
      toast('Asignatura creada');
      navigate(`/asignatura/${id}`);
    } catch (err) {
      const map = {};
      for (const d of err.details) map[d.path.at(-1)] = d.message;
      showErrors(map);
      toast(err.message, 'error');
    } finally {
      submit.disabled = false;
    }
  });

  inputs.nombre.focus();
}
