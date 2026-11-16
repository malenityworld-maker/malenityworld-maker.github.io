/* Malenity OS · aplicación
   Una sola página: lee y guarda en Supabase (o en modo prueba, en este navegador). */
(function () {
'use strict';

const TZ = 'America/Argentina/Buenos_Aires';
const SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/dist/umd/supabase.min.js';
const BLOQUES = ['Mañana', 'Tarde', 'Noche', 'En la semana'];
const MAX_ROCAS = 5, MAX_ROJOS = 3;

/* =================== Utilidades =================== */
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hoyISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
const fechaUTC = (iso) => new Date(iso + 'T12:00:00Z');
const sumarDias = (iso, n) => { const d = fechaUTC(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const diaSemana = (iso) => fechaUTC(iso).getUTCDay(); // 0 domingo
const lunesDe = (iso) => sumarDias(iso, -((diaSemana(iso) + 6) % 7));
const fmt = (iso, o) => iso ? new Intl.DateTimeFormat('es-AR', Object.assign({ timeZone: 'UTC' }, o)).format(fechaUTC(iso)) : '';
const fmtCorta = (iso) => fmt(iso, { weekday: 'short', day: 'numeric', month: 'short' });
const fmtDia = (iso) => fmt(iso, { day: 'numeric', month: 'short' });
const fmtLarga = (iso) => fmt(iso, { weekday: 'long', day: 'numeric', month: 'long' });
const fmtFechaAnio = (iso) => fmt(iso, { day: 'numeric', month: 'short', year: 'numeric' });
const fmtHora = (ts) => new Intl.DateTimeFormat('es-AR', { timeZone: TZ, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(ts));
const fmtSemana = (lun) => fmtDia(lun) + ' al ' + fmtDia(sumarDias(lun, 6));
const trimestreDe = (iso) => iso.slice(0, 4) + '-T' + (Math.floor((+iso.slice(5, 7) - 1) / 3) + 1);
function rangoTrimestre(q) {
  const m = /^(\d{4})-T([1-4])$/.exec(q || ''); if (!m) return [null, null];
  const y = +m[1], t = +m[2], mi = (t - 1) * 3 + 1;
  const ini = `${y}-${String(mi).padStart(2, '0')}-01`;
  const fin = sumarDias(t === 4 ? `${y + 1}-01-01` : `${y}-${String(mi + 3).padStart(2, '0')}-01`, -1);
  return [ini, fin];
}
const trimestreSiguiente = (q) => { const [, fin] = rangoTrimestre(q); return trimestreDe(sumarDias(fin, 1)); };
function fmtNum(v, unidad) {
  if (v == null || v === '') return '—';
  const n = Number(v);
  const s = new Intl.NumberFormat('es-AR', { maximumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);
  return unidad === 'USD' ? 'USD ' + s : s;
}
const inicial = (n) => (n || '?').trim().charAt(0).toUpperCase();

const ICON = {
  hoy: '<path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/><circle cx="12" cy="12" r="4"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  rocas: '<path d="M3 20h18L15 8l-4 6-3-3z"/>',
  scorecard: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  tareas: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>',
  ideas: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
  vision: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  equipo: '<circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M22 21c0-3-1.8-5.6-4.5-6.6"/>',
  ajustes: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  registro: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  mas: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  lapiz: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
};
const icono = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k] || ''}</svg>`;

const VISTAS = {
  hoy: { t: 'Hoy' },
  reset: { t: 'Reset semanal', admin: true },
  rocas: { t: 'Rocas' },
  scorecard: { t: 'Números' },
  tareas: { t: 'Tareas' },
  ideas: { t: 'Ideas' },
  vision: { t: 'Visión' },
  equipo: { t: 'Equipo' },
  ajustes: { t: 'Ajustes', admin: true },
  registro: { t: 'Registro', admin: true },
};

/* =================== Estado =================== */
let api = null;
const S = {
  db: null, yoId: null, yo: null, vista: 'hoy', visionAbierta: false, hoja: false,
  ui: { tareas: { estado: 'pendientes', persona: '', area: '', roca: '' }, ideas: { estado: 'espera', area: '' }, rocas: { trimestre: '' }, reset: { paso: 1, semana: null } },
};
const esAdmin = () => !!S.yo && S.yo.rol === 'admin';
const vePlata = () => !!S.yo && (S.yo.rol === 'admin' || S.yo.ve_plata);
const persona = (id) => S.db.personas.find(p => p.id === id);
const area = (id) => S.db.areas.find(a => a.id === id);
const roca = (id) => S.db.rocas.find(r => r.id === id);
const metrica = (id) => S.db.metricas.find(m => m.id === id);
const porOrden = (a, b) => (a.orden || 0) - (b.orden || 0);
const personasActivas = () => S.db.personas.filter(p => p.estado !== 'inactiva').sort(porOrden);
const areasActivas = () => S.db.areas.filter(a => a.activa !== false).sort(porOrden);
const rocasActivas = () => S.db.rocas.filter(r => r.estado === 'activa').sort(porOrden);
const puedeMarcar = (r) => esAdmin() || (S.yo && r.responsable_id === S.yo.id);
const puedeCargar = (m) => esAdmin() || (S.yo && m.responsable_id === S.yo.id);
const valorDe = (mId, sem) => S.db.valores.find(v => v.metrica_id === mId && v.semana === sem);
const marcaDe = (rId, sem) => S.db.roca_semanas.find(s => s.roca_id === rId && s.semana === sem);
const rojosDe = (rId) => S.db.roca_semanas.filter(s => s.roca_id === rId && s.color === 'rojo').length;
function semanaReset() { const h = hoyISO(); return diaSemana(h) === 0 ? lunesDe(h) : sumarDias(lunesDe(h), -7); }

/* =================== Datos (Supabase) =================== */
function crearSupabase(cfg) {
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: true, detectSessionInUrl: true, flowType: 'pkce' } });
  const ok = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
  const TABLAS = ['personas', 'areas', 'vision', 'ideas', 'rocas', 'roca_semanas', 'metricas', 'valores', 'fondos', 'tareas'];
  return {
    modo: 'supabase', sb,
    async sesion() { const { data } = await sb.auth.getSession(); return data.session ? data.session.user : null; },
    async vincular() { return ok(await sb.rpc('vincular_usuario')); },
    async salir() { await sb.auth.signOut(); },
    async cargar() {
      const res = await Promise.all(TABLAS.map(t => sb.from(t).select('*').limit(10000)));
      const out = {}; TABLAS.forEach((t, i) => out[t] = ok(res[i]) || []); return out;
    },
    async insertar(t, f) { return ok(await sb.from(t).insert(f).select().single()); },
    async actualizar(t, id, c) { return ok(await sb.from(t).update(c).eq('id', id).select().maybeSingle()); },
    async borrar(t, id) { ok(await sb.from(t).delete().eq('id', id)); },
    async guardarSemana(t, f) {
      const k = t === 'valores' ? 'metrica_id' : 'roca_id';
      return { fila: ok(await sb.from(t).upsert(f, { onConflict: k + ',semana' }).select().single()) };
    },
    async borrarSemana(t, f) {
      const k = t === 'valores' ? 'metrica_id' : 'roca_id';
      ok(await sb.from(t).delete().eq(k, f[k]).eq('semana', f.semana));
    },
    async registro() { return ok(await sb.from('registro').select('*').order('cuando', { ascending: false }).limit(200)); },
  };
}

async function refrescar() {
  const db = await api.cargar();
  if (!db) { S.yo = null; return; }
  S.db = db;
  S.yo = db.personas.find(p => p.id === S.yoId) || null;
}

async function hacer(fn, okMsg) {
  try { const r = await fn(); await refrescar(); render(); if (okMsg) toast(okMsg); return r; }
  catch (e) { console.error(e); toast('No se pudo guardar: ' + (e.message || e)); return null; }
}

/* =================== UI: piezas =================== */
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('ver'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('ver'), 3200); }

const chipArea = (id) => { const a = area(id); return a ? `<span class="chip"><span class="punto" style="background:${esc(a.color)}"></span>${esc(a.nombre)}</span>` : ''; };
const chipPersona = (id) => { const p = persona(id); return p ? `<span class="chip">👤 ${esc(p.nombre)}</span>` : '<span class="chip warn">Sin responsable</span>'; };
const chipRoca = (id) => { const r = roca(id); return r ? `<span class="chip roca" title="Roca">⛰ ${esc(r.titulo)}</span>` : ''; };

function tareaHTML(t, o = {}) {
  const atrasada = !t.hecha && t.fecha && t.fecha < hoyISO();
  return `<div class="tarea ${t.hecha ? 'hecha' : ''}">
    <button class="check ${t.hecha ? 'si' : ''}" data-act="tildar" data-id="${t.id}" aria-label="${t.hecha ? 'Marcar como pendiente' : 'Marcar como hecha'}">${t.hecha ? icono('check') : ''}</button>
    <div class="tarea-cuerpo">
      <div class="tarea-titulo">${esc(t.titulo)}</div>
      ${t.origen === 'automatica' ? `<div class="tarea-detalle"><b>Regla:</b> ${esc(t.regla || '')}${t.disparador ? ` · <b>Número:</b> ${esc(t.disparador)}` : ''}</div>` : ''}
      ${t.detalle && o.detalle !== false ? `<div class="tarea-detalle">${esc(t.detalle)}</div>` : ''}
      <div class="tarea-meta">
        ${t.origen === 'automatica' ? '<span class="chip auto">⚡ Automática</span>' : ''}
        ${t.fecha && o.fecha !== false ? `<span class="chip ${atrasada ? 'bad' : ''}">${atrasada ? 'Atrasada · ' : ''}${esc(fmtCorta(t.fecha))}</span>` : ''}
        ${t.bloque && o.bloque !== false ? `<span class="chip">${esc(t.bloque)}</span>` : ''}
        ${o.area !== false ? chipArea(t.area_id) : ''}
        ${chipRoca(t.roca_id)}
        ${o.persona ? chipPersona(t.responsable_id) : ''}
      </div>
    </div>
    ${esAdmin() ? `<button class="editar" data-act="editarTarea" data-id="${t.id}" aria-label="Editar tarea">${icono('lapiz').replace('<svg', '<svg width="18" height="18"')}</button>` : ''}
  </div>`;
}
const listaTareas = (ts, o) => ts.length ? `<div class="card">${ts.map(t => tareaHTML(t, o)).join('')}</div>` : `<div class="vacio">${esc((o && o.vacio) || 'Nada por acá.')}</div>`;
const ordenTareas = (a, b) => (a.fecha || '9999') < (b.fecha || '9999') ? -1 : (a.fecha || '9999') > (b.fecha || '9999') ? 1 : BLOQUES.indexOf(a.bloque) - BLOQUES.indexOf(b.bloque);

function semanasRoca(r) {
  const [qi, qf] = rangoTrimestre(r.trimestre);
  const ini = r.inicio || qi, fin = r.deadline || qf;
  if (!ini || !fin) return [];
  let s = [5, 6, 0].includes(diaSemana(ini)) ? sumarDias(lunesDe(ini), 7) : lunesDe(ini);
  const out = []; while (s <= fin && out.length < 30) { out.push(s); s = sumarDias(s, 7); }
  return out;
}
function semaforoHTML(r) {
  const actual = lunesDe(hoyISO());
  const sems = semanasRoca(r);
  const extra = S.db.roca_semanas.filter(x => x.roca_id === r.id && !sems.includes(x.semana)).map(x => x.semana);
  return `<div class="semaforo">${[...extra.sort(), ...sems].map((s, i) => {
    const m = marcaDe(r.id, s);
    const tit = `Semana del ${fmtSemana(s)}${m ? ': ' + m.color + (m.nota ? ' — ' + m.nota : '') : ''}`;
    const tag = puedeMarcar(r) ? 'button' : 'span';
    return `<${tag} class="dot ${m ? m.color : ''} ${s === actual ? 'actual' : ''}" title="${esc(tit)}" ${tag === 'button' ? `data-act="marcarRoca" data-id="${r.id}" data-semana="${s}"` : ''}>${i + 1}</${tag}>`;
  }).join('')}</div>`;
}
function rojosHTML(r) {
  const n = rojosDe(r.id);
  const cls = n >= MAX_ROJOS ? 'bad' : n > 0 ? 'warn' : 'ok';
  const txt = n >= MAX_ROJOS ? `${n} rojos · el próximo la devuelve a Ideas` : `${n} de ${MAX_ROJOS} rojos tolerados`;
  return `<span class="chip ${cls}">${txt}</span>`;
}

/* =================== Vistas =================== */
function vistaHoy() {
  const h = hoyISO(), yo = S.yo;
  const mias = S.db.tareas.filter(t => t.responsable_id === yo.id);
  const atrasadas = mias.filter(t => !t.hecha && t.fecha && t.fecha < h).sort(ordenTareas);
  const deHoy = mias.filter(t => t.fecha === h).sort(ordenTareas);
  const finSemana = sumarDias(lunesDe(h), 6);
  const proximas = mias.filter(t => !t.hecha && t.fecha && t.fecha > h && t.fecha <= finSemana).sort(ordenTareas);
  const sinFecha = mias.filter(t => !t.hecha && !t.fecha);
  const hechasHoy = deHoy.filter(t => t.hecha).length;
  const misRocas = new Set(mias.filter(t => !t.hecha && t.roca_id).map(t => t.roca_id));
  rocasActivas().filter(r => r.responsable_id === yo.id).forEach(r => misRocas.add(r.id));
  const rocasHoy = [...misRocas].map(roca).filter(r => r && r.estado === 'activa');
  const dow = diaSemana(h);
  const semR = semanaReset();
  const resetPendiente = esAdmin() && (dow === 0 || dow === 1) && rocasActivas().some(r => !marcaDe(r.id, semR));
  const v = S.db.vision[0] || {};

  const porBloque = BLOQUES.concat(['']).map(b => {
    const ts = deHoy.filter(t => (t.bloque || '') === b);
    return ts.length ? `<div class="grupo-titulo">${esc(b || 'Sin bloque')}</div>${listaTareas(ts, { bloque: false, fecha: false })}` : '';
  }).join('');

  return `
  <div class="cabecera"><div><h1>Hola, ${esc(yo.nombre.split(' ')[0])}</h1><p class="muted">${esc(fmtLarga(h))}${deHoy.length ? ` · ${hechasHoy} de ${deHoy.length} tareas de hoy hechas` : ''}</p></div>
  ${esAdmin() ? '<button class="btn pri" data-act="nuevaTarea" data-fecha="hoy">+ Tarea</button>' : ''}</div>
  ${resetPendiente ? `<div class="aviso" style="margin-bottom:14px"><span><b>Toca el reset semanal.</b> Cargá los números y marcá las rocas de la semana del ${esc(fmtSemana(semR))}.</span><button class="btn chico pri" data-ir="reset">Empezar</button></div>` : ''}
  ${atrasadas.length ? `<div class="seccion"><h2 style="color:var(--bad)">Atrasadas (${atrasadas.length})</h2></div>${listaTareas(atrasadas)}` : ''}
  <div class="seccion"><h2>Hoy</h2></div>
  ${deHoy.length ? porBloque : '<div class="vacio">No tenés tareas para hoy. Un paso chico también cuenta.</div>'}
  ${rocasHoy.length ? `<div class="seccion"><h2>A qué aportás este trimestre</h2></div><div class="grid g2">${rocasHoy.map(r => `
    <div class="card roca"><div class="fila">${chipArea(r.area_id)}<span class="chip">${esc(r.trimestre)}</span></div>
    <h3 style="margin-top:8px">${esc(r.titulo)}</h3><div class="medida muted small">Se cumple si: ${esc(r.se_cumple_si)}</div>${semaforoHTML(r)}</div>`).join('')}</div>` : ''}
  ${proximas.length ? `<div class="seccion"><h2>Lo que queda de la semana</h2></div>${listaTareas(proximas)}` : ''}
  ${sinFecha.length ? `<div class="seccion"><h2>Pendientes sin fecha</h2></div>${listaTareas(sinFecha)}` : ''}
  ${v.mindset ? `<p class="muted" style="text-align:center;margin-top:28px;font-family:var(--display);font-style:italic;font-size:17px">“${esc(v.mindset)}”</p>` : ''}`;
}

function vistaRocas() {
  const qs = new Set(S.db.rocas.map(r => r.trimestre)); const qAct = trimestreDe(hoyISO());
  qs.add(qAct); qs.add(trimestreSiguiente(qAct));
  let q = S.ui.rocas.trimestre;
  if (!q) { const conActivas = [...new Set(rocasActivas().map(r => r.trimestre))].sort().filter(x => x >= qAct); q = conActivas[0] || qAct; S.ui.rocas.trimestre = q; }
  const delQ = S.db.rocas.filter(r => r.trimestre === q).sort(porOrden);
  const activas = delQ.filter(r => r.estado === 'activa'), otras = delQ.filter(r => r.estado !== 'activa');
  const [qi, qf] = rangoTrimestre(q);
  const ESTADOS = { cumplida: ['ok', 'Cumplida'], devuelta: ['bad', 'Volvió a Ideas'], cancelada: ['', 'Cancelada'] };
  const card = (r) => {
    const ts = S.db.tareas.filter(t => t.roca_id === r.id); const hechas = ts.filter(t => t.hecha).length;
    return `<div class="card roca">
      <div class="fila entre"><div class="fila">${chipArea(r.area_id)}${chipPersona(r.responsable_id)}${r.estado !== 'activa' ? `<span class="chip ${ESTADOS[r.estado][0]}">${ESTADOS[r.estado][1]}</span>` : ''}</div>
      ${esAdmin() ? `<button class="link" data-act="editarRoca" data-id="${r.id}">Editar</button>` : ''}</div>
      <h3 style="margin-top:10px">${esc(r.titulo)}</h3>
      <div class="medida"><b>Se cumple si:</b> ${esc(r.se_cumple_si)}</div>
      <div class="small muted"><b>Deadline:</b> ${esc(fmtFechaAnio(r.deadline || qf))}${r.por_que ? ` · <b>Por qué:</b> ${esc(r.por_que)}` : ''}</div>
      ${semaforoHTML(r)}
      <div class="fila entre" style="margin-top:6px">${rojosHTML(r)}<span class="small muted">${ts.length ? `${hechas} de ${ts.length} tareas hechas` : 'Sin tareas todavía'}</span></div>
      ${r.estado === 'activa' && (puedeMarcar(r) || esAdmin()) ? `<div class="fila" style="margin-top:12px">
        ${puedeMarcar(r) ? `<button class="btn chico" data-act="marcarRoca" data-id="${r.id}" data-semana="${semanaReset()}">Marcar semana</button>` : ''}
        ${esAdmin() ? `<button class="btn chico" data-act="nuevaTarea" data-roca="${r.id}">+ Tarea para esta roca</button>` : ''}</div>` : ''}
    </div>`;
  };
  return `
  <div class="cabecera"><div><h1>Rocas</h1><p class="muted small">Prioridades de 90 días. Un dueño, una medida y el semáforo de cada semana. Al 4.º rojo, la roca vuelve a Ideas.</p></div>
  ${esAdmin() ? '<button class="btn pri" data-act="nuevaRoca">+ Roca</button>' : ''}</div>
  <div class="filtros"><select data-filtro="rocas.trimestre" aria-label="Trimestre">${[...qs].sort().map(x => `<option value="${x}" ${x === q ? 'selected' : ''}>${x.replace('-T', ' · trimestre ')}</option>`).join('')}</select>
  <span class="chip ${activas.length > MAX_ROCAS ? 'bad' : activas.length >= 3 ? 'ok' : 'warn'}" style="align-self:center">${activas.length} activas · entre 3 y ${MAX_ROCAS}</span>
  <span class="small muted" style="align-self:center">${esc(fmtDia(qi))} al ${esc(fmtFechaAnio(qf))}</span></div>
  ${activas.length > MAX_ROCAS ? `<div class="aviso bad" style="margin-bottom:12px">Hay ${activas.length} rocas activas en este trimestre. Con más de ${MAX_ROCAS} cuesta cumplirlas: considerá pasar alguna a Ideas.</div>` : ''}
  ${activas.length ? `<div class="grid g2">${activas.map(card).join('')}</div>` : '<div class="vacio">No hay rocas activas en este trimestre.</div>'}
  ${otras.length ? `<div class="seccion"><h2>Cumplidas, devueltas y canceladas</h2></div><div class="grid g2">${otras.map(card).join('')}</div>` : ''}`;
}

function calcularFondo(f) {
  const vals = S.db.valores.filter(v => v.metrica_id === f.metrica_id);
  const h = hoyISO();
  if (f.calculo === 'suma_anio') return vals.filter(v => v.semana.slice(0, 4) === String(f.anio || h.slice(0, 4))).reduce((s, v) => s + Number(v.valor), 0);
  if (f.calculo === 'suma_mes') return vals.filter(v => v.semana.slice(0, 7) === h.slice(0, 7)).reduce((s, v) => s + Number(v.valor), 0);
  const ult = vals.sort((a, b) => a.semana < b.semana ? 1 : -1)[0]; return ult ? Number(ult.valor) : 0;
}
const CALCULOS = { suma_anio: 'Suma del año', suma_mes: 'Suma del mes', ultimo: 'Último valor' };
function fondosHTML() {
  if (!vePlata() || !S.db.fondos.length) return '';
  return `<div class="seccion"><h2>Fondos</h2>${esAdmin() ? '<button class="btn chico" data-act="nuevoFondo">+ Fondo</button>' : ''}</div>
  <div class="grid g2">${S.db.fondos.slice().sort(porOrden).map(f => {
    const v = calcularFondo(f); const pct = f.meta ? Math.min(100, Math.round(v / f.meta * 100)) : null;
    const m = metrica(f.metrica_id);
    return `<div class="card fondo"><div class="fila entre"><h3>${esc(f.nombre)}</h3>${esAdmin() ? `<button class="link" data-act="editarFondo" data-id="${f.id}">Editar</button>` : ''}</div>
      <div><span class="num">${esc(fmtNum(v, f.unidad))}</span>${f.meta ? ` <span class="muted">de ${esc(fmtNum(f.meta, f.unidad))} · ${pct}%</span>` : ' <span class="muted">· sin meta</span>'}</div>
      ${f.meta ? `<div class="barra ${pct >= 100 ? 'ok' : ''}"><i style="width:${pct}%"></i></div>` : ''}
      <div class="tiny muted">${esc(f.para_que || '')}${m ? ` · ${CALCULOS[f.calculo]} de “${esc(m.nombre)}”${f.calculo === 'suma_anio' ? ' ' + (f.anio || '') : ''}` : ''}</div></div>`;
  }).join('')}</div>`;
}
function colorValor(m, v) {
  if (v == null) return 'vacia';
  if (m.meta == null || m.meta === '') return '';
  return (m.sentido === 'menor' ? Number(v) <= Number(m.meta) : Number(v) >= Number(m.meta)) ? 'verde' : 'rojo';
}
function vistaScorecard() {
  const actual = lunesDe(hoyISO());
  const sems = Array.from({ length: 8 }, (_, i) => sumarDias(actual, -7 * (7 - i)));
  const ms = S.db.metricas.filter(m => m.activa !== false).sort(porOrden);
  return `
  <div class="cabecera"><div><h1>Números</h1><p class="muted small">El scorecard de la semana. Verde si llega a la meta, rojo si no. Tocá una celda para cargar o corregir.</p></div>
  ${esAdmin() ? '<button class="btn pri" data-act="nuevaMetrica">+ Número</button>' : ''}</div>
  ${ms.length ? `<div class="tabla-wrap"><table class="score"><thead><tr><th class="nom">Número</th><th>Meta</th>${sems.map(s => `<th title="Semana del ${esc(fmtSemana(s))}">${esc(fmtDia(s))}</th>`).join('')}</tr></thead><tbody>
  ${ms.map(m => `<tr><td class="nom">${esAdmin() ? `<button class="link" style="text-align:left;color:var(--ink);text-decoration:none;font-size:14px;font-weight:500" data-act="editarMetrica" data-id="${m.id}">${esc(m.nombre)}</button>` : `<b style="font-weight:500">${esc(m.nombre)}</b>`}
      <div class="tarea-meta">${chipPersona(m.responsable_id)}${m.fuente === 'meta_ads' ? '<span class="chip auto">⚡ Meta Ads</span>' : ''}</div></td>
      <td>${esc(m.meta == null ? 'sin meta' : (m.sentido === 'menor' ? '≤ ' : '≥ ') + fmtNum(m.meta, m.unidad))}</td>
      ${sems.map(s => { const v = valorDe(m.id, s); const c = colorValor(m, v && v.valor); const txt = v ? fmtNum(v.valor, m.unidad === 'USD' ? '' : m.unidad).replace(/^—$/, '') : '·';
        return `<td>${puedeCargar(m) ? `<button class="celda ${c}" data-act="cargarValor" data-id="${m.id}" data-semana="${s}">${esc(txt)}${v && v.corregido ? '*' : ''}</button>` : `<span class="celda ${c}">${esc(txt)}</span>`}</td>`; }).join('')}</tr>`).join('')}
  </tbody></table></div><p class="tiny muted" style="margin-top:6px">Cada columna es una semana (de lunes a domingo). * = número de Meta corregido a mano. Los montos están en USD.</p>`
  : '<div class="vacio">No tenés números asignados para ver.</div>'}
  ${fondosHTML()}`;
}

function vistaTareas() {
  const f = S.ui.tareas;
  let ts = S.db.tareas.slice();
  if (f.persona) ts = ts.filter(t => t.responsable_id === f.persona);
  if (f.area) ts = ts.filter(t => t.area_id === f.area);
  if (f.roca) ts = ts.filter(t => t.roca_id === f.roca);
  if (f.estado === 'pendientes') ts = ts.filter(t => !t.hecha);
  if (f.estado === 'hechas') ts = ts.filter(t => t.hecha);
  ts.sort(ordenTareas);
  const grupos = areasActivas().map(a => ({ a, ts: ts.filter(t => t.area_id === a.id) })).concat([{ a: null, ts: ts.filter(t => !area(t.area_id)) }]).filter(g => g.ts.length);
  const opt = (v, l, sel) => `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(l)}</option>`;
  return `
  <div class="cabecera"><div><h1>Tareas</h1><p class="muted small">${esAdmin() ? 'Todas las tareas, ordenadas por negocio.' : 'Tus tareas, ordenadas por negocio.'}</p></div>
  ${esAdmin() ? '<button class="btn pri" data-act="nuevaTarea">+ Tarea</button>' : ''}</div>
  <div class="filtros">
    <select data-filtro="tareas.estado" aria-label="Estado">${opt('pendientes', 'Pendientes', f.estado)}${opt('hechas', 'Hechas', f.estado)}${opt('todas', 'Todas', f.estado)}</select>
    ${esAdmin() ? `<select data-filtro="tareas.persona" aria-label="Persona">${opt('', 'Todas las personas', f.persona)}${personasActivas().map(p => opt(p.id, p.nombre, f.persona)).join('')}</select>` : ''}
    <select data-filtro="tareas.area" aria-label="Área">${opt('', 'Todos los negocios', f.area)}${areasActivas().map(a => opt(a.id, a.nombre, f.area)).join('')}</select>
    <select data-filtro="tareas.roca" aria-label="Roca">${opt('', 'Todas las rocas', f.roca)}${rocasActivas().map(r => opt(r.id, r.titulo, f.roca)).join('')}</select>
  </div>
  ${grupos.length ? grupos.map(g => `<div class="grupo-titulo">${esc(g.a ? g.a.nombre : 'Sin área')} · ${g.ts.length}</div>${listaTareas(g.ts, { area: false, persona: esAdmin() })}`).join('') : '<div class="vacio">No hay tareas con estos filtros.</div>'}`;
}

function ideaHTML(i) {
  const autor = persona(i.creada_por);
  return `<div class="card"><div class="fila entre"><div class="fila">${i.tipo === 'problema' ? '<span class="chip bad">Problema</span>' : ''}${chipArea(i.area_id)}${i.para_cuando ? `<span class="chip">Para ${esc(i.para_cuando)}</span>` : ''}${i.veces_devuelta ? `<span class="chip warn">Volvió ${i.veces_devuelta} ${i.veces_devuelta === 1 ? 'vez' : 'veces'} de las rocas</span>` : ''}</div>
    ${esAdmin() ? `<button class="link" data-act="editarIdea" data-id="${i.id}">Editar</button>` : ''}</div>
    <h3 style="margin-top:8px">${esc(i.titulo)}</h3>
    ${i.detalle ? `<div class="tarea-detalle" style="font-size:14px">${esc(i.detalle)}</div>` : ''}
    <div class="fila entre" style="margin-top:10px"><span class="tiny muted">${autor ? 'Sumada por ' + esc(autor.nombre) : ''}</span>
    ${esAdmin() ? `<div class="fila">${i.estado === 'espera' ? `<button class="btn chico" data-act="descartarIdea" data-id="${i.id}">Descartar</button><button class="btn chico pri" data-act="ideaARoca" data-id="${i.id}">Pasar a roca</button>` : `<button class="btn chico" data-act="reactivarIdea" data-id="${i.id}">Volver a Ideas</button>`}</div>` : ''}</div></div>`;
}
function vistaIdeas() {
  const f = S.ui.ideas;
  let is = S.db.ideas.filter(i => f.estado === 'espera' ? i.estado === 'espera' : f.estado === 'en_roca' ? i.estado === 'en_roca' : ['descartada', 'resuelta'].includes(i.estado));
  if (f.area) is = is.filter(i => i.area_id === f.area);
  is.sort((a, b) => (a.creada_en < b.creada_en ? 1 : -1));
  const opt = (v, l, sel) => `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(l)}</option>`;
  return `
  <div class="cabecera"><div><h1>Ideas y problemas</h1><p class="muted small">Todo lo que no entra en el trimestre espera acá, con el mayor detalle posible.</p></div>
  <button class="btn pri" data-act="nuevaIdea">+ Idea o problema</button></div>
  <div class="filtros"><select data-filtro="ideas.estado" aria-label="Estado">${opt('espera', 'En espera', f.estado)}${opt('en_roca', 'Ya son rocas', f.estado)}${opt('cerradas', 'Descartadas', f.estado)}</select>
  <select data-filtro="ideas.area" aria-label="Área">${opt('', 'Todos los negocios', f.area)}${areasActivas().map(a => opt(a.id, a.nombre, f.area)).join('')}</select></div>
  ${is.length ? `<div class="grid g2">${is.map(ideaHTML).join('')}</div>` : '<div class="vacio">No hay ideas acá.</div>'}`;
}

function vistaVision() {
  const v = S.db.vision[0] || {};
  const bloque = (t, x) => `<div class="card"><div class="grupo-titulo" style="margin-top:0">${t}</div><p style="font-family:var(--display);font-size:20px;margin:6px 0 0;color:var(--ink)">${esc(x || '—')}</p></div>`;
  return `
  <div class="cabecera"><div><h1>Visión</h1><p class="muted small">Hacia dónde va Malenity World.</p></div>${esAdmin() ? '<button class="btn" data-act="editarVision">Editar visión</button>' : ''}</div>
  <div class="grid">${bloque('Meta general', v.meta_mensual)}<div class="grid g2">${bloque('A 1 año', v.meta_1_anio)}${bloque('A 3 años', v.meta_3_anios)}</div>${bloque('Mindset', v.mindset)}</div>
  <div class="seccion"><h2>Los negocios y para qué es la plata</h2>${esAdmin() ? '<button class="btn chico" data-ir="ajustes">Editar áreas</button>' : ''}</div>
  <div class="grid g2">${areasActivas().map(a => `<div class="card"><div class="fila"><span class="chip"><span class="punto" style="background:${esc(a.color)}"></span>Área</span></div><h3 style="margin-top:8px">${esc(a.nombre)}</h3>
    ${a.que_vende ? `<div class="small" style="margin-top:4px"><b>Qué vende:</b> ${esc(a.que_vende)}</div>` : ''}${a.para_que ? `<div class="small"><b>Para qué es la plata:</b> ${esc(a.para_que)}</div>` : ''}</div>`).join('')}</div>`;
}

function vistaEquipo() {
  const h = hoyISO();
  const ps = S.db.personas.slice().sort(porOrden);
  const ESTADO = { activa: ['ok', 'Activa'], a_contratar: ['warn', 'A contratar'], inactiva: ['', 'Inactiva'] };
  return `
  <div class="cabecera"><div><h1>Equipo</h1><p class="muted small">Quién es responsable de qué. Cada roca, número y tarea tiene un solo dueño.</p></div>${esAdmin() ? '<button class="btn pri" data-act="nuevaPersona">+ Persona</button>' : ''}</div>
  ${esAdmin() ? `<div class="aviso info" style="margin-bottom:14px"><span><b>Cómo invito a alguien:</b> 1) Tocá “+ Persona” (o “Editar” en un puesto “a contratar”) y poné su mail. 2) Mandale el link de Malenity OS. 3) Que toque “Crear cuenta” con ese mismo mail (o “Entrar con Google”). Entra directo a su pantalla “Hoy”.</span></div>` : ''}
  <div class="grid g2">${ps.map(p => {
    const rocas = S.db.rocas.filter(r => r.responsable_id === p.id && r.estado === 'activa').length;
    const nums = S.db.metricas.filter(m => m.responsable_id === p.id && m.activa !== false).length;
    const pend = S.db.tareas.filter(t => t.responsable_id === p.id && !t.hecha).length;
    const atr = S.db.tareas.filter(t => t.responsable_id === p.id && !t.hecha && t.fecha && t.fecha < h).length;
    const cuenta = p.usuario_id ? '<span class="chip ok">Ya entró</span>' : p.email ? '<span class="chip warn">Invitada · todavía no entró</span>' : '<span class="chip">Sin mail · no puede entrar</span>';
    return `<div class="card persona"><div class="fila entre"><div class="fila"><div class="avatar">${esc(inicial(p.nombre))}</div><div><h3>${esc(p.nombre)}</h3><div class="small muted">${esc(p.puesto || '')}</div></div></div>
      ${esAdmin() ? `<button class="link" data-act="editarPersona" data-id="${p.id}">Editar</button>` : ''}</div>
      <div class="tarea-meta" style="margin-top:10px"><span class="chip ${ESTADO[p.estado][0]}">${ESTADO[p.estado][1]}</span><span class="chip">${p.rol === 'admin' ? 'Administradora' : 'Equipo'}</span>${p.rol !== 'admin' && p.ve_plata ? '<span class="chip">Ve la plata</span>' : ''}${esAdmin() ? cuenta : ''}</div>
      ${p.responsabilidades ? `<ul>${p.responsabilidades.split(/[,;\n]/).map(x => x.trim()).filter(Boolean).map(x => `<li>${esc(x.charAt(0).toUpperCase() + x.slice(1))}</li>`).join('')}</ul>` : ''}
      <div class="small muted" style="margin-top:10px">${rocas} ${rocas === 1 ? 'roca' : 'rocas'} · ${nums} ${nums === 1 ? 'número' : 'números'}${esAdmin() || p.id === S.yo.id ? ` · ${pend} tareas pendientes${atr ? ` (<span style="color:var(--bad)">${atr} atrasadas</span>)` : ''}` : ''}</div>
      ${esAdmin() && p.email ? `<div class="tiny muted" style="margin-top:4px">${esc(p.email)}</div>` : ''}</div>`;
  }).join('')}</div>`;
}

function vistaAjustes() {
  const tema = leer('malenity-os-tema') || 'auto';
  const fila = (txt, sub, act, id) => `<div class="reset-fila"><div class="info"><b style="font-weight:500">${esc(txt)}</b>${sub ? `<div class="small muted">${sub}</div>` : ''}</div><button class="btn chico" data-act="${act}" data-id="${id}">Editar</button></div>`;
  return `
  <div class="cabecera"><div><h1>Ajustes</h1><p class="muted small">Cambiá áreas, números y fondos sin tocar código. Las rocas se editan en Rocas, las personas en Equipo y la visión en Visión.</p></div></div>
  <div class="seccion"><h2>Áreas (negocios)</h2><button class="btn chico" data-act="nuevaArea">+ Área</button></div>
  <div class="card">${S.db.areas.slice().sort(porOrden).map(a => fila(a.nombre + (a.activa === false ? ' (oculta)' : ''), esc(a.para_que || ''), 'editarArea', a.id)).join('')}</div>
  <div class="seccion"><h2>Números del scorecard</h2><button class="btn chico" data-act="nuevaMetrica">+ Número</button></div>
  <div class="card">${S.db.metricas.slice().sort(porOrden).map(m => fila(m.nombre + (m.activa === false ? ' (oculto)' : ''), `Meta: ${esc(m.meta == null ? 'sin meta' : fmtNum(m.meta, m.unidad))} · ${esc((persona(m.responsable_id) || {}).nombre || 'sin responsable')}${m.es_plata ? ' · 💲 solo quien ve la plata' : ''}`, 'editarMetrica', m.id)).join('')}</div>
  <div class="seccion"><h2>Fondos</h2><button class="btn chico" data-act="nuevoFondo">+ Fondo</button></div>
  <div class="card">${S.db.fondos.slice().sort(porOrden).map(f => fila(f.nombre, `Meta: ${esc(f.meta == null ? 'sin meta' : fmtNum(f.meta, f.unidad))} · ${CALCULOS[f.calculo]}`, 'editarFondo', f.id)).join('') || '<div class="vacio">Sin fondos.</div>'}</div>
  <div class="seccion"><h2>Apariencia</h2></div>
  <div class="card"><div class="filtros" style="margin:0"><select data-act-change="tema" aria-label="Tema">${[['auto', 'Como el celular'], ['light', 'Claro'], ['dark', 'Oscuro']].map(([v, l]) => `<option value="${v}" ${v === tema ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
  <div class="seccion"><h2>Conexión</h2></div>
  <div class="card small">${api.modo === 'demo' ? '<b>Modo prueba.</b> Los datos se guardan solo en este navegador. Cuando conectemos Supabase, la app usa la base real con copias de seguridad.' : '<b>Conectada a la base de datos.</b> Los datos están en Supabase, con copia de seguridad diaria.'}</div>`;
}

let registroCache = null;
function vistaRegistro() {
  if (!registroCache) { api.registro().then(r => { registroCache = r || []; render(); }).catch(e => toast(e.message)); return '<div class="vacio">Cargando…</div>'; }
  return `<div class="cabecera"><div><h1>Registro</h1><p class="muted small">Quién hizo qué y cuándo (últimos 200 movimientos, hora de Argentina).</p></div><button class="btn chico" data-act="recargarRegistro">Actualizar</button></div>
  <div class="card">${registroCache.length ? registroCache.map(r => `<div class="log"><time>${esc(fmtHora(r.cuando))}</time><div><b style="font-weight:600">${esc(r.persona_nombre || 'Sistema')}</b> ${esc(r.tabla === 'valores' && r.accion === 'creó' ? 'cargó' : r.tabla === 'roca_semanas' ? 'marcó' : r.accion)} <span class="muted">${esc({ tareas: 'la tarea', rocas: 'la roca', ideas: 'la idea', valores: 'el número', roca_semanas: 'el semáforo', personas: 'a', metricas: 'el número', areas: 'el área', fondos: 'el fondo', vision: 'la' }[r.tabla] || r.tabla)}</span> ${esc(r.descripcion || '')}</div></div>`).join('') : '<div class="vacio">Todavía no hay movimientos.</div>'}</div>`;
}

/* ---------- Reset semanal ---------- */
function vistaReset() {
  const R = S.ui.reset; if (!R.semana) R.semana = semanaReset();
  const sem = R.semana, plan = sumarDias(sem, 7);
  const ms = S.db.metricas.filter(m => m.activa !== false && puedeCargar(m)).sort(porOrden);
  const rs = rocasActivas();
  const listo1 = ms.length && ms.every(m => m.meta == null || valorDe(m.id, sem));
  const listo2 = rs.length && rs.every(r => marcaDe(r.id, sem));
  const pasos = [['1', 'Números', listo1], ['2', 'Rocas', listo2], ['3', 'Planificar', false], ['4', 'Ideas', false]];
  let cuerpo = '';
  if (R.paso === 1) {
    cuerpo = `<div class="card"><h2>1 · Cargá el scorecard</h2><p class="small muted">Semana del ${esc(fmtSemana(sem))}. Los de Meta Ads se van a cargar solos (Fase 2); igual los podés corregir.</p>
    <form data-form="numeros">${ms.map(m => { const v = valorDe(m.id, sem); const c = colorValor(m, v && v.valor);
      return `<div class="reset-fila"><div class="info"><b style="font-weight:500">${esc(m.nombre)}</b><div class="small muted">Meta: ${esc(m.meta == null ? 'sin meta' : fmtNum(m.meta, m.unidad))}${m.fuente === 'meta_ads' ? ' · ⚡ Meta Ads' : ''}</div></div>
      <div class="fila">${c && c !== 'vacia' ? `<span class="chip ${c === 'verde' ? 'ok' : 'bad'}">${c}</span>` : ''}<input class="input-num" type="number" step="any" inputmode="decimal" name="${m.id}" value="${v ? esc(v.valor) : ''}" placeholder="${esc(m.unidad || '')}" aria-label="${esc(m.nombre)}"></div></div>`; }).join('') || '<div class="vacio">No hay números para cargar.</div>'}
    <div class="modal-acciones"><button class="btn pri" type="submit">Guardar y seguir</button></div></form></div>`;
  } else if (R.paso === 2) {
    cuerpo = `<div class="card"><h2>2 · Marcá las rocas</h2><p class="small muted">Semana del ${esc(fmtSemana(sem))}. Verde si cumpliste lo de la semana; rojo si no. Se toleran ${MAX_ROJOS} rojos; al 4.º la roca vuelve a Ideas.</p>
    ${rs.map(r => { const m = marcaDe(r.id, sem);
      return `<div class="reset-fila"><div class="info"><b style="font-weight:500">${esc(r.titulo)}</b><div class="tarea-meta">${chipPersona(r.responsable_id)}${rojosHTML(r)}</div></div>
      <div class="fila"><button class="btn ${m && m.color === 'verde' ? 'sel-ok' : 'ok'}" data-act="semaforo" data-id="${r.id}" data-color="verde">Verde</button><button class="btn ${m && m.color === 'rojo' ? 'sel-bad' : 'bad'}" data-act="semaforo" data-id="${r.id}" data-color="rojo">Rojo</button></div>
      <input class="nota" data-nota="${r.id}" placeholder="Nota (opcional): qué pasó esta semana" value="${esc(m && m.nota || '')}" ${m ? '' : 'disabled'}></div>`; }).join('') || '<div class="vacio">No hay rocas activas.</div>'}
    <div class="modal-acciones"><button class="btn" data-paso="1">Atrás</button><button class="btn pri" data-paso="3">Seguir</button></div></div>`;
  } else if (R.paso === 3) {
    const fin = sumarDias(plan, 6);
    const pendientes = S.db.tareas.filter(t => !t.hecha && (!t.fecha || t.fecha < plan)).sort(ordenTareas);
    const semana = S.db.tareas.filter(t => t.fecha && t.fecha >= plan && t.fecha <= fin).sort(ordenTareas);
    const grupos = areasActivas().map(a => ({ a, ts: semana.filter(t => t.area_id === a.id) })).concat([{ a: null, ts: semana.filter(t => !area(t.area_id)) }]).filter(g => g.ts.length);
    cuerpo = `<div class="card"><h2>3 · Planificá la semana</h2><p class="small muted">Semana del ${esc(fmtSemana(plan))}. Dividí cada roca en pasos chicos, ubicalos en un día y un bloque, y sumá lo de otras áreas de tu vida.</p>
    <div class="fila" style="margin:10px 0"><button class="btn pri" data-act="nuevaTarea" data-fecha="${plan}">+ Tarea para esta semana</button></div>
    ${rocasActivas().map(r => { const n = semana.filter(t => t.roca_id === r.id).length; return `<div class="fila entre small" style="padding:4px 0"><span>⛰ ${esc(r.titulo)}</span><span class="chip ${n ? 'ok' : 'warn'}">${n ? n + ' tareas esta semana' : 'Sin tareas esta semana'}</span></div>`; }).join('')}
    </div>
    <div class="seccion"><h2>La semana, por negocio</h2></div>
    ${grupos.length ? grupos.map(g => `<div class="grupo-titulo">${esc(g.a ? g.a.nombre : 'Sin área')}</div>${listaTareas(g.ts, { area: false, persona: true })}`).join('') : '<div class="vacio">Todavía no hay tareas en esta semana.</div>'}
    ${pendientes.length ? `<div class="seccion"><h2>Pendientes para reubicar (${pendientes.length})</h2></div><p class="small muted" style="margin-top:-6px">Atrasadas o sin fecha. Tocá el lápiz para pasarlas a un día de esta semana.</p>${listaTareas(pendientes, { persona: true })}` : ''}
    <div class="modal-acciones"><button class="btn" data-paso="2">Atrás</button><button class="btn pri" data-paso="4">Seguir</button></div>`;
  } else {
    const is = S.db.ideas.filter(i => i.estado === 'espera').sort((a, b) => (a.creada_en < b.creada_en ? 1 : -1));
    cuerpo = `<div class="card"><h2>4 · Revisá las ideas</h2><p class="small muted">¿Alguna pasa a ser prioridad? ¿Alguna ya no va? Si no hay lugar en el trimestre, que espere.</p>
    <div class="fila" style="margin-top:10px"><button class="btn" data-act="nuevaIdea">+ Idea o problema</button></div></div>
    <div class="grid g2" style="margin-top:12px">${is.map(ideaHTML).join('') || '<div class="vacio">No hay ideas en espera.</div>'}</div>
    <div class="modal-acciones"><button class="btn" data-paso="3">Atrás</button><button class="btn pri" data-act="terminarReset">Terminar reset</button></div>`;
  }
  return `
  <div class="cabecera"><div><h1>Reset semanal</h1><p class="muted small">4 pasos. Roma no se hizo en dos días.</p></div>
  <div class="fila"><button class="btn chico" data-act="semanaReset" data-d="-7" aria-label="Semana anterior">‹</button><span class="small">Semana del <b>${esc(fmtSemana(sem))}</b></span><button class="btn chico" data-act="semanaReset" data-d="7" aria-label="Semana siguiente">›</button></div></div>
  <div class="pasos">${pasos.map(([n, t, l]) => `<button class="paso ${+n === R.paso ? 'activo' : ''} ${l ? 'listo' : ''}" data-paso="${n}"><b>Paso ${n}</b>${t}</button>`).join('')}</div>
  ${cuerpo}`;
}

/* =================== Layout =================== */
function navItems() {
  return Object.entries(VISTAS).filter(([, v]) => !v.admin || esAdmin()).filter(([k]) => k !== 'scorecard' || S.db.metricas.length || esAdmin());
}
function render() {
  if (!S.yo) return;
  const v = S.db.vision[0] || {};
  const vista = VISTAS[S.vista] && (!VISTAS[S.vista].admin || esAdmin()) ? S.vista : 'hoy';
  S.vista = vista;
  const cuerpo = { hoy: vistaHoy, reset: vistaReset, rocas: vistaRocas, scorecard: vistaScorecard, tareas: vistaTareas, ideas: vistaIdeas, vision: vistaVision, equipo: vistaEquipo, ajustes: vistaAjustes, registro: vistaRegistro }[vista]();
  const abajo = esAdmin() ? ['hoy', 'tareas', 'rocas', 'reset'] : ['hoy', 'tareas', 'rocas', 'ideas'];
  const demo = api.modo === 'demo' ? `<div class="demo-bar"><b>Modo prueba</b> · datos de ejemplo en este navegador · Ver como:
    <select data-act-change="verComo" aria-label="Ver como">${[['demo-malena', 'Malena (admin)'], ['demo-asistente', 'Asistente (equipo)']].map(([u, l]) => `<option value="${u}" ${api.usuarioActual() === u ? 'selected' : ''}>${l}</option>`).join('')}</select>
    <button class="link" data-act="reiniciarDemo">Reiniciar datos</button></div>` : '';
  const scroll = window.scrollY, mismaVista = document.body.dataset.vista === vista;
  $('#app').innerHTML = `<div class="layout">
    <aside class="side"><div class="marca"><div class="monograma">M</div><div><b>Malenity OS</b><small>Malenity World</small></div></div>
      ${navItems().map(([k, x]) => `${k === 'ajustes' ? '<div class="nav-sep"></div>' : ''}<button class="nav-item ${k === vista ? 'activo' : ''}" data-ir="${k}">${icono(k)}${x.t}</button>`).join('')}
      <div class="side-pie"><div class="quien">${esc(S.yo.nombre)}</div><div class="muted tiny">${esAdmin() ? 'Administradora' : esc(S.yo.puesto || 'Equipo')}</div>${api.modo !== 'demo' ? '<button class="link" data-act="salir">Salir</button>' : ''}</div></aside>
    <main class="main">${demo}
      <div class="vision-bar ${S.visionAbierta ? 'abierta' : ''}"><button data-act="toggleVision" aria-expanded="${S.visionAbierta}"><span class="vb-tag">Visión</span><span class="vb-txt"><b>1 año:</b> ${esc(v.meta_1_anio || '—')} &nbsp;·&nbsp; <b>3 años:</b> ${esc(v.meta_3_anios || '—')}</span></button></div>
      <div class="contenido">${cuerpo}</div></main>
    <nav class="bottom">${abajo.map(k => `<button class="${k === vista ? 'activo' : ''}" data-ir="${k}">${icono(k)}${k === 'reset' ? 'Reset' : VISTAS[k].t}</button>`).join('')}<button class="${abajo.includes(vista) ? '' : 'activo'}" data-act="hoja">${icono('mas')}Más</button></nav>
    ${S.hoja ? `<div class="modal-fondo" data-act="cerrarHoja" style="align-items:flex-end;background:rgba(30,20,16,.3)"></div><div class="hoja">${navItems().filter(([k]) => !abajo.includes(k)).map(([k, x]) => `<button class="nav-item ${k === vista ? 'activo' : ''}" data-ir="${k}">${icono(k)}${x.t}</button>`).join('')}
      <div class="nav-sep"></div><div class="small muted" style="padding:4px 12px">${esc(S.yo.nombre)}</div>${api.modo !== 'demo' ? '<button class="nav-item" data-act="salir">Salir</button>' : ''}</div>` : ''}
  </div>`;
  document.body.dataset.vista = vista;
  document.querySelectorAll('.tabla-wrap').forEach(w => { w.scrollLeft = w.scrollWidth; });
  if (mismaVista) window.scrollTo(0, scroll);
}

/* =================== Formularios =================== */
function modal(html) {
  const raiz = $('#modal-raiz');
  raiz.innerHTML = `<div class="modal-fondo" data-cerrar-fondo><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
  const primer = raiz.querySelector('input:not([type=hidden]),textarea,select'); if (primer && window.innerWidth > 700) primer.focus();
  return raiz;
}
const cerrarModal = () => { $('#modal-raiz').innerHTML = ''; };

function confirmar(msg, si = 'Sí, seguir') {
  return new Promise(res => {
    const r = modal(`<h2>¿Seguro?</h2><p>${esc(msg)}</p><div class="modal-acciones"><button class="btn" data-r="0">Cancelar</button><button class="btn pri" data-r="1">${esc(si)}</button></div>`);
    r.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { cerrarModal(); res(b.dataset.r === '1'); });
  });
}

/* campos: [{k, l, tipo, ops:[[v,l]], req, ayuda}] */
function formulario({ titulo, campos, valores = {}, guardar, borrar, textoGuardar = 'Guardar', intro = '' }) {
  const campo = (c) => {
    const v = valores[c.k] == null ? '' : valores[c.k];
    const ayuda = c.ayuda ? `<small>${c.ayuda}</small>` : '';
    if (c.tipo === 'check') return `<label class="campo check-campo"><input type="checkbox" name="${c.k}" ${v ? 'checked' : ''}><span>${esc(c.l)}</span></label>${ayuda}`;
    let input;
    if (c.tipo === 'textarea') input = `<textarea name="${c.k}" ${c.req ? 'required' : ''}>${esc(v)}</textarea>`;
    else if (c.tipo === 'select') input = `<select name="${c.k}" ${c.req ? 'required' : ''}>${c.ops.map(([ov, ol]) => `<option value="${esc(ov)}" ${String(ov) === String(v) ? 'selected' : ''}>${esc(ol)}</option>`).join('')}</select>`;
    else input = `<input type="${c.tipo || 'text'}" name="${c.k}" value="${esc(v)}" ${c.tipo === 'number' ? 'step="any" inputmode="decimal"' : ''} ${c.req ? 'required' : ''} ${c.pattern ? `pattern="${c.pattern}"` : ''} ${c.placeholder ? `placeholder="${esc(c.placeholder)}"` : ''}>`;
    return `<label class="campo"><span>${esc(c.l)}${c.req ? ' *' : ''}</span>${input}${ayuda}</label>`;
  };
  const r = modal(`<h2>${esc(titulo)}</h2>${intro}<form>${campos.map(campo).join('')}
    <div class="modal-acciones">${borrar ? '<button type="button" class="btn bad izq" data-borrar>Borrar</button>' : ''}<button type="button" class="btn" data-cancelar>Cancelar</button><button class="btn pri" type="submit">${esc(textoGuardar)}</button></div></form>`);
  const form = r.querySelector('form');
  r.querySelector('[data-cancelar]').onclick = cerrarModal;
  if (borrar) r.querySelector('[data-borrar]').onclick = async () => { cerrarModal(); if (await confirmar('Se borra para siempre.', 'Borrar')) borrar(); };
  form.onsubmit = async (e) => {
    e.preventDefault();
    const out = {};
    campos.forEach(c => {
      const el = form.elements[c.k];
      if (c.tipo === 'check') out[c.k] = el.checked;
      else if (c.tipo === 'number') out[c.k] = el.value === '' ? null : Number(el.value);
      else out[c.k] = el.value.trim() === '' ? null : el.value.trim();
    });
    const btn = form.querySelector('[type=submit]'); btn.disabled = true;
    const ok = await guardar(out);
    if (ok === false) { btn.disabled = false; return; }
    cerrarModal();
  };
}

const opsPersonas = (vacio) => (vacio ? [['', vacio]] : []).concat(personasActivas().map(p => [p.id, p.nombre + (p.estado === 'a_contratar' ? ' (a contratar)' : '')]));
const opsAreas = (vacio = 'Sin área') => [['', vacio]].concat(areasActivas().map(a => [a.id, a.nombre]));
const opsRocas = () => [['', 'No aporta a una roca']].concat(rocasActivas().map(r => [r.id, r.titulo]));

function formTarea(t = {}) {
  const auto = t.origen === 'automatica';
  formulario({
    titulo: t.id ? 'Editar tarea' : 'Nueva tarea',
    intro: auto ? `<div class="aviso" style="margin-bottom:12px"><span>⚡ Tarea automática. <b>Regla:</b> ${esc(t.regla || '')}${t.disparador ? ` · <b>Número:</b> ${esc(t.disparador)}` : ''}</span></div>` : '',
    valores: Object.assign({ responsable_id: S.yo.id }, t),
    campos: [
      { k: 'titulo', l: 'Qué hay que hacer', req: true, placeholder: 'Un paso chico y concreto' },
      { k: 'detalle', l: 'Detalle', tipo: 'textarea' },
      { k: 'responsable_id', l: 'Responsable (uno solo)', tipo: 'select', ops: opsPersonas(), req: true },
      { k: 'area_id', l: 'Negocio / área', tipo: 'select', ops: opsAreas() },
      { k: 'roca_id', l: 'Roca a la que aporta', tipo: 'select', ops: opsRocas() },
      { k: 'fecha', l: 'Fecha (opcional)', tipo: 'date' },
      { k: 'bloque', l: 'Bloque de trabajo', tipo: 'select', ops: [['', 'Sin bloque']].concat(BLOQUES.map(b => [b, b])) },
    ],
    guardar: (v) => {
      if (v.roca_id && !v.area_id) v.area_id = (roca(v.roca_id) || {}).area_id || null;
      return hacer(() => t.id ? api.actualizar('tareas', t.id, v) : api.insertar('tareas', v), t.id ? 'Tarea guardada' : 'Tarea creada');
    },
    borrar: t.id ? () => hacer(() => api.borrar('tareas', t.id), 'Tarea borrada') : null,
  });
}

async function chequearLimite(trimestre, excluir) {
  const n = S.db.rocas.filter(r => r.estado === 'activa' && r.trimestre === trimestre && r.id !== excluir).length;
  if (n < MAX_ROCAS) return true;
  return confirmar(`Ya hay ${n} rocas activas en ${trimestre}. Traction recomienda entre 3 y 5 para poder cumplirlas. Si la cargás, quedan ${n + 1}. ¿La cargo igual?`, 'Cargar igual');
}
function formRoca(r = {}, idea = null) {
  const qDef = (idea && idea.para_cuando) || trimestreSiguiente(trimestreDe(hoyISO()));
  formulario({
    titulo: r.id ? 'Editar roca' : idea ? 'Pasar idea a roca' : 'Nueva roca',
    intro: idea ? `<p class="small muted">Definí la medida de éxito, el deadline y el por qué. Después dividila en tareas semanales.</p>` : '',
    valores: Object.assign({ trimestre: qDef, responsable_id: S.yo.id, estado: 'activa' }, idea ? { titulo: idea.titulo, area_id: idea.area_id } : {}, r),
    campos: [
      { k: 'titulo', l: 'Roca', req: true },
      { k: 'se_cumple_si', l: 'Se cumple si… (medida de éxito)', req: true, tipo: 'textarea' },
      { k: 'por_que', l: 'Por qué', tipo: 'textarea' },
      { k: 'responsable_id', l: 'Responsable (una sola persona)', tipo: 'select', ops: opsPersonas(), req: true },
      { k: 'area_id', l: 'Negocio / área', tipo: 'select', ops: opsAreas() },
      { k: 'trimestre', l: 'Trimestre', req: true, pattern: '\\d{4}-T[1-4]', ayuda: 'Formato: 2027-T1 (enero a marzo), 2027-T2 (abril a junio)…' },
      { k: 'inicio', l: 'Inicio', tipo: 'date', ayuda: 'Si lo dejás vacío, el primer día del trimestre.' },
      { k: 'deadline', l: 'Deadline', tipo: 'date', ayuda: 'Si lo dejás vacío, el último día del trimestre.' },
    ].concat(r.id ? [{ k: 'estado', l: 'Estado', tipo: 'select', ops: [['activa', 'Activa'], ['cumplida', 'Cumplida'], ['devuelta', 'Volvió a Ideas'], ['cancelada', 'Cancelada']] }] : []),
    guardar: async (v) => {
      const [qi, qf] = rangoTrimestre(v.trimestre);
      v.inicio = v.inicio || qi; v.deadline = v.deadline || qf;
      const pasaActiva = (v.estado || 'activa') === 'activa' && (r.estado !== 'activa' || r.trimestre !== v.trimestre);
      if (pasaActiva && !(await chequearLimite(v.trimestre, r.id))) return false;
      if (r.id) return hacer(() => api.actualizar('rocas', r.id, v), 'Roca guardada');
      if (idea) v.idea_id = idea.id;
      v.orden = S.db.rocas.filter(x => x.trimestre === v.trimestre).length + 1;
      S.ui.rocas.trimestre = v.trimestre;
      return hacer(async () => { await api.insertar('rocas', v); if (idea) await api.actualizar('ideas', idea.id, { estado: 'en_roca' }); }, idea ? 'La idea ya es una roca. Ahora dividila en tareas.' : 'Roca creada');
    },
    borrar: r.id ? () => hacer(() => api.borrar('rocas', r.id), 'Roca borrada') : null,
  });
}
function formIdea(i = {}) {
  formulario({
    titulo: i.id ? 'Editar idea' : 'Nueva idea o problema',
    valores: Object.assign({ tipo: 'idea' }, i),
    campos: [
      { k: 'titulo', l: 'Título', req: true },
      { k: 'detalle', l: 'Detalle (cuanto más, mejor)', tipo: 'textarea' },
      { k: 'tipo', l: 'Tipo', tipo: 'select', ops: [['idea', 'Idea'], ['problema', 'Problema']] },
      { k: 'area_id', l: 'Negocio / área', tipo: 'select', ops: opsAreas() },
      { k: 'para_cuando', l: 'Para cuándo (opcional)', placeholder: '2027-T2', pattern: '\\d{4}-T[1-4]' },
    ].concat(i.id ? [{ k: 'estado', l: 'Estado', tipo: 'select', ops: [['espera', 'En espera'], ['en_roca', 'Ya es roca'], ['descartada', 'Descartada'], ['resuelta', 'Resuelta']] }] : []),
    guardar: (v) => hacer(() => i.id ? api.actualizar('ideas', i.id, v) : api.insertar('ideas', v), i.id ? 'Idea guardada' : 'Idea sumada'),
    borrar: i.id && esAdmin() ? () => hacer(() => api.borrar('ideas', i.id), 'Idea borrada') : null,
  });
}
function formMetrica(m = {}) {
  formulario({
    titulo: m.id ? 'Editar número' : 'Nuevo número del scorecard',
    valores: Object.assign({ sentido: 'mayor', activa: true, responsable_id: S.yo.id, fuente: 'manual' }, m),
    campos: [
      { k: 'nombre', l: 'Número', req: true },
      { k: 'meta', l: 'Meta semanal', tipo: 'number', ayuda: 'Vacío = sin meta (no se pinta de color).' },
      { k: 'sentido', l: 'Está bien si es…', tipo: 'select', ops: [['mayor', 'Igual o mayor que la meta'], ['menor', 'Igual o menor que la meta']] },
      { k: 'unidad', l: 'Unidad', placeholder: 'USD, mochilas, miembros…' },
      { k: 'para_que', l: 'Para qué' },
      { k: 'responsable_id', l: 'Responsable (carga el número)', tipo: 'select', ops: opsPersonas(), req: true },
      { k: 'area_id', l: 'Negocio / área', tipo: 'select', ops: opsAreas() },
      { k: 'fuente', l: 'De dónde sale', tipo: 'select', ops: [['manual', 'Se carga a mano'], ['meta_ads', 'Meta Ads (automático en Fase 2)']] },
      { k: 'es_plata', l: 'Es plata: solo lo ve la administradora y quien tenga “ve la plata”', tipo: 'check' },
      { k: 'activa', l: 'Visible en el scorecard', tipo: 'check' },
      { k: 'orden', l: 'Orden', tipo: 'number' },
    ],
    guardar: (v) => hacer(() => m.id ? api.actualizar('metricas', m.id, v) : api.insertar('metricas', v), 'Número guardado'),
    borrar: m.id ? () => hacer(() => api.borrar('metricas', m.id), 'Número borrado') : null,
  });
}
function formFondo(f = {}) {
  formulario({
    titulo: f.id ? 'Editar fondo' : 'Nuevo fondo',
    valores: Object.assign({ calculo: 'suma_anio', anio: +hoyISO().slice(0, 4) + 1 }, f),
    campos: [
      { k: 'nombre', l: 'Nombre', req: true },
      { k: 'metrica_id', l: 'Se calcula con el número', tipo: 'select', ops: S.db.metricas.map(m => [m.id, m.nombre]), req: true },
      { k: 'calculo', l: 'Cálculo', tipo: 'select', ops: Object.entries(CALCULOS) },
      { k: 'anio', l: 'Año (para “suma del año”)', tipo: 'number' },
      { k: 'meta', l: 'Meta', tipo: 'number' },
      { k: 'unidad', l: 'Unidad', placeholder: 'USD' },
      { k: 'para_que', l: 'Para qué' },
      { k: 'orden', l: 'Orden', tipo: 'number' },
    ],
    guardar: (v) => hacer(() => f.id ? api.actualizar('fondos', f.id, v) : api.insertar('fondos', v), 'Fondo guardado'),
    borrar: f.id ? () => hacer(() => api.borrar('fondos', f.id), 'Fondo borrado') : null,
  });
}
function formArea(a = {}) {
  formulario({
    titulo: a.id ? 'Editar área' : 'Nueva área',
    valores: Object.assign({ color: '#B5423C', activa: true }, a),
    campos: [
      { k: 'nombre', l: 'Nombre', req: true },
      { k: 'que_vende', l: 'Qué vende' },
      { k: 'para_que', l: 'Para qué es la plata' },
      { k: 'color', l: 'Color', tipo: 'color' },
      { k: 'orden', l: 'Orden', tipo: 'number' },
      { k: 'activa', l: 'Visible', tipo: 'check' },
    ],
    guardar: (v) => hacer(() => a.id ? api.actualizar('areas', a.id, v) : api.insertar('areas', v), 'Área guardada'),
    borrar: a.id ? () => hacer(() => api.borrar('areas', a.id), 'Área borrada') : null,
  });
}
function formPersona(p = {}) {
  const yoMisma = p.id === S.yo.id;
  formulario({
    titulo: p.id ? 'Editar persona' : 'Nueva persona',
    intro: '<p class="small muted">Con el mail que pongas acá, la persona crea su cuenta (o entra con Google) y queda conectada a este puesto.</p>',
    valores: Object.assign({ rol: 'equipo', estado: 'activa' }, p),
    campos: [
      { k: 'nombre', l: 'Nombre', req: true },
      { k: 'puesto', l: 'Puesto', placeholder: 'Asistente Malenity Shop' },
      { k: 'responsabilidades', l: 'Responsabilidades (separadas por comas)', tipo: 'textarea' },
      { k: 'email', l: 'Mail para entrar', tipo: 'email' },
      { k: 'estado', l: 'Estado', tipo: 'select', ops: [['activa', 'Activa'], ['a_contratar', 'A contratar'], ['inactiva', 'Inactiva (no puede entrar)']] },
    ].concat(yoMisma ? [] : [
      { k: 'rol', l: 'Permisos', tipo: 'select', ops: [['equipo', 'Equipo: sus tareas, rocas, visión, ideas y sus números'], ['admin', 'Administradora: ve y edita todo']] },
      { k: 've_plata', l: 'Puede ver la plata (ganancia neta y fondos)', tipo: 'check' },
    ]).concat([{ k: 'orden', l: 'Orden', tipo: 'number' }]),
    guardar: (v) => { if (v.email) v.email = v.email.toLowerCase(); return hacer(() => p.id ? api.actualizar('personas', p.id, v) : api.insertar('personas', v), 'Persona guardada'); },
    borrar: p.id && !yoMisma ? () => hacer(() => api.borrar('personas', p.id), 'Persona borrada') : null,
  });
}
function formVision() {
  const v = S.db.vision[0] || { id: 1 };
  formulario({
    titulo: 'Editar visión', valores: v,
    campos: [
      { k: 'meta_mensual', l: 'Meta general', tipo: 'textarea' },
      { k: 'meta_1_anio', l: 'Meta a 1 año', tipo: 'textarea' },
      { k: 'meta_3_anios', l: 'Meta a 3 años', tipo: 'textarea' },
      { k: 'mindset', l: 'Mindset', tipo: 'textarea' },
    ],
    guardar: (x) => hacer(() => api.actualizar('vision', 1, Object.assign(x, { actualizado_en: new Date().toISOString() })), 'Visión guardada'),
  });
}
function formValor(m, sem) {
  const v = valorDe(m.id, sem);
  formulario({
    titulo: m.nombre,
    intro: `<p class="small muted">Semana del ${esc(fmtSemana(sem))}. Meta: ${esc(m.meta == null ? 'sin meta' : fmtNum(m.meta, m.unidad))}.${v && v.fuente === 'meta_ads' ? ' Este número vino de Meta Ads' + (v.corregido ? ' y ya fue corregido.' : '; si lo cambiás queda marcado como corregido.') : ''}</p>`,
    valores: { valor: v ? v.valor : null },
    campos: [{ k: 'valor', l: m.unidad ? `Valor (${m.unidad})` : 'Valor', tipo: 'number', ayuda: 'Dejalo vacío y guardá para borrarlo.' }],
    guardar: (x) => hacer(() => x.valor == null ? (v ? api.borrarSemana('valores', { metrica_id: m.id, semana: sem }) : null) : api.guardarSemana('valores', { metrica_id: m.id, semana: sem, valor: x.valor }), 'Número guardado'),
  });
}
function formMarcarRoca(r, sem) {
  const sems = semanasRoca(r); if (!sems.includes(sem)) sems.push(sem); sems.sort();
  const m = marcaDe(r.id, sem);
  formulario({
    titulo: 'Semáforo de la semana', intro: `<p class="small"><b>${esc(r.titulo)}</b><br><span class="muted">${esc(r.se_cumple_si)}</span></p>`,
    valores: { semana: sem, color: m ? m.color : 'verde', nota: m ? m.nota : '' },
    campos: [
      { k: 'semana', l: 'Semana', tipo: 'select', ops: sems.map((s, i) => [s, `Semana ${i + 1} · ${fmtSemana(s)}`]) },
      { k: 'color', l: '¿Cumpliste lo de la semana?', tipo: 'select', ops: [['verde', 'Verde: sí'], ['rojo', 'Rojo: no'], ['', 'Sin marcar (borrar)']] },
      { k: 'nota', l: 'Nota', tipo: 'textarea' },
    ],
    guardar: async (x) => {
      if (!x.color) { await hacer(() => api.borrarSemana('roca_semanas', { roca_id: r.id, semana: x.semana }), 'Marca borrada'); return; }
      return marcarSemana(r, x.semana, x.color, x.nota);
    },
  });
}
async function marcarSemana(r, sem, color, nota) {
  const prev = marcaDe(r.id, sem);
  if (color === 'rojo' && (!prev || prev.color !== 'rojo') && rojosDe(r.id) >= MAX_ROJOS) {
    if (!(await confirmar(`Este sería el 4.º rojo de “${r.titulo}”. Según tu regla, la roca sale de las prioridades y vuelve a Ideas. ¿Lo marco?`, 'Marcar rojo'))) return false;
  }
  const fila = { roca_id: r.id, semana: sem, color };
  if (nota !== undefined) fila.nota = nota;
  await hacer(() => api.guardarSemana('roca_semanas', fila));
  const ahora = roca(r.id);
  if (ahora && ahora.estado === 'devuelta' && r.estado === 'activa') toast('4.º rojo: la roca volvió a Ideas. Liberaste lugar para otra prioridad.');
  else toast(color === 'verde' ? 'Verde ✓' : 'Rojo marcado');
}

/* =================== Acciones =================== */
const ACC = {
  async tildar(d) { const t = S.db.tareas.find(x => x.id === d.id); if (!t) return; await hacer(() => api.actualizar('tareas', t.id, { hecha: !t.hecha }), t.hecha ? 'Tarea reabierta' : '¡Hecha! Un paso más.'); },
  nuevaTarea(d) { formTarea({ fecha: d.fecha === 'hoy' ? hoyISO() : d.fecha || null, roca_id: d.roca || null, area_id: d.roca ? (roca(d.roca) || {}).area_id : null }); },
  editarTarea(d) { formTarea(S.db.tareas.find(x => x.id === d.id)); },
  nuevaRoca() { formRoca(); },
  editarRoca(d) { formRoca(roca(d.id)); },
  marcarRoca(d) { formMarcarRoca(roca(d.id), d.semana); },
  async semaforo(d) { const r = roca(d.id); const m = marcaDe(r.id, S.ui.reset.semana); await marcarSemana(r, S.ui.reset.semana, d.color, m ? m.nota : undefined); },
  nuevaIdea() { formIdea(); },
  editarIdea(d) { formIdea(S.db.ideas.find(x => x.id === d.id)); },
  ideaARoca(d) { formRoca({}, S.db.ideas.find(x => x.id === d.id)); },
  descartarIdea(d) { hacer(() => api.actualizar('ideas', d.id, { estado: 'descartada' }), 'Idea descartada'); },
  reactivarIdea(d) { hacer(() => api.actualizar('ideas', d.id, { estado: 'espera' }), 'Volvió a Ideas'); },
  nuevaMetrica() { formMetrica(); },
  editarMetrica(d) { formMetrica(metrica(d.id)); },
  cargarValor(d) { formValor(metrica(d.id), d.semana); },
  nuevoFondo() { formFondo(); },
  editarFondo(d) { formFondo(S.db.fondos.find(x => x.id === d.id)); },
  nuevaArea() { formArea(); },
  editarArea(d) { formArea(area(d.id)); },
  nuevaPersona() { formPersona(); },
  editarPersona(d) { formPersona(persona(d.id)); },
  editarVision() { formVision(); },
  toggleVision() { S.visionAbierta = !S.visionAbierta; render(); },
  hoja() { S.hoja = !S.hoja; render(); },
  cerrarHoja() { S.hoja = false; render(); },
  semanaReset(d) { S.ui.reset.semana = sumarDias(S.ui.reset.semana, +d.d); render(); },
  terminarReset() { S.ui.reset.paso = 1; S.vista = 'hoy'; render(); window.scrollTo(0, 0); toast('Reset listo. ¡Buena semana!'); },
  recargarRegistro() { registroCache = null; render(); },
  async reiniciarDemo() { if (await confirmar('Vuelven los datos de ejemplo y se pierde lo que cargaste en modo prueba.', 'Reiniciar')) { api.reiniciar(); await refrescar(); render(); toast('Datos de ejemplo reiniciados'); } },
  async salir() { await api.salir(); location.reload(); },
};

document.addEventListener('click', (e) => {
  if (e.target.matches('[data-cerrar-fondo]')) { cerrarModal(); return; }
  const ir = e.target.closest('[data-ir]');
  if (ir) { S.vista = ir.dataset.ir; S.hoja = false; if (S.vista === 'registro') registroCache = null; render(); window.scrollTo(0, 0); try { history.replaceState(null, '', '#' + S.vista); } catch (_) {} return; }
  const paso = e.target.closest('[data-paso]');
  if (paso) { S.ui.reset.paso = +paso.dataset.paso; render(); window.scrollTo(0, 0); return; }
  const el = e.target.closest('[data-act]');
  if (el && ACC[el.dataset.act] && !el.closest('#modal-raiz')) { e.preventDefault(); ACC[el.dataset.act](el.dataset, el); }
});
document.addEventListener('change', async (e) => {
  const f = e.target.dataset.filtro;
  if (f) { const [a, b] = f.split('.'); S.ui[a][b] = e.target.value; render(); return; }
  const n = e.target.dataset.nota;
  if (n) { const r = roca(n); const m = marcaDe(n, S.ui.reset.semana); if (m) await hacer(() => api.guardarSemana('roca_semanas', { roca_id: r.id, semana: m.semana, color: m.color, nota: e.target.value.trim() || null }), 'Nota guardada'); return; }
  const a = e.target.dataset.actChange;
  if (a === 'tema') { aplicarTema(e.target.value); return; }
  if (a === 'verComo') { api.cambiarUsuario(e.target.value); S.yoId = await api.vincular(); await refrescar(); S.vista = 'hoy'; render(); }
});
document.addEventListener('submit', async (e) => {
  if (e.target.dataset.form !== 'numeros') return;
  e.preventDefault();
  const sem = S.ui.reset.semana; const cambios = [];
  [...e.target.elements].filter(x => x.name).forEach(x => {
    const m = metrica(x.name); const v = valorDe(x.name, sem);
    if (x.value === '' && !v) return;
    if (v && x.value !== '' && Number(x.value) === Number(v.valor)) return;
    cambios.push(x.value === '' ? () => api.borrarSemana('valores', { metrica_id: m.id, semana: sem }) : () => api.guardarSemana('valores', { metrica_id: m.id, semana: sem, valor: Number(x.value) }));
  });
  S.ui.reset.paso = 2;
  await hacer(async () => { for (const c of cambios) await c(); }, cambios.length ? 'Números guardados' : null);
  window.scrollTo(0, 0);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarModal(); });

/* =================== Tema =================== */
function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function aplicarTema(t) {
  try { localStorage.setItem('malenity-os-tema', t); } catch (e) {}
  if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
}
aplicarTema(leer('malenity-os-tema') || 'auto');

/* =================== Entrar =================== */
function pantallaLogin(modo = 'entrar', msg = '') {
  const T = { entrar: 'Entrar', crear: 'Crear cuenta', olvide: 'Recuperar contraseña', nueva: 'Nueva contraseña' };
  $('#app').innerHTML = `<div class="login"><div class="card"><div class="monograma">M</div><h1>Malenity OS</h1><div class="sub">Malenity World</div>
    <form id="f-login">
      ${modo !== 'nueva' ? '<label class="campo"><span>Mail</span><input type="email" name="email" required autocomplete="email"></label>' : ''}
      ${modo !== 'olvide' ? `<label class="campo"><span>${modo === 'nueva' ? 'Nueva contraseña' : 'Contraseña'}</span><input type="password" name="pass" required minlength="8" autocomplete="${modo === 'entrar' ? 'current-password' : 'new-password'}"></label>` : ''}
      ${modo === 'crear' ? '<p class="small muted" style="margin-top:-4px">Usá el mismo mail con el que te invitaron. Mínimo 8 caracteres.</p>' : ''}
      <button class="btn pri" type="submit">${T[modo]}</button>
      <div class="error">${esc(msg)}</div>
    </form>
    ${modo === 'entrar' || modo === 'crear' ? '<div class="separador">o</div><button class="btn" id="b-google">Entrar con Google</button>' : ''}
    <div class="fila entre" style="margin-top:16px">
      ${modo === 'entrar' ? '<button class="link" data-modo="crear">Crear cuenta</button><button class="link" data-modo="olvide">Me olvidé la contraseña</button>' : modo !== 'nueva' ? '<button class="link" data-modo="entrar">Volver a entrar</button>' : ''}
    </div></div></div>`;
  document.querySelectorAll('[data-modo]').forEach(b => b.onclick = () => pantallaLogin(b.dataset.modo));
  const g = $('#b-google'); if (g) g.onclick = async () => { const { error } = await api.sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } }); if (error) pantallaLogin(modo, error.message); };
  $('#f-login').onsubmit = async (e) => {
    e.preventDefault(); const f = e.target; const email = f.email && f.email.value.trim().toLowerCase(); const pass = f.pass && f.pass.value;
    f.querySelector('button').disabled = true;
    const red = location.origin + location.pathname;
    let r;
    if (modo === 'entrar') r = await api.sb.auth.signInWithPassword({ email, password: pass });
    if (modo === 'crear') { r = await api.sb.auth.signUp({ email, password: pass, options: { emailRedirectTo: red } }); if (!r.error && !r.data.session) return pantallaLogin('entrar', 'Listo. Te mandamos un mail para confirmar la cuenta; tocá el link y después entrá.'); }
    if (modo === 'olvide') { r = await api.sb.auth.resetPasswordForEmail(email, { redirectTo: red }); if (!r.error) return pantallaLogin('entrar', 'Si el mail existe, te llegó un link para cambiar la contraseña.'); }
    if (modo === 'nueva') { r = await api.sb.auth.updateUser({ password: pass }); if (!r.error) { toast('Contraseña cambiada'); return iniciar(); } }
    if (r && r.error) {
      const m = /Invalid login/i.test(r.error.message) ? 'Mail o contraseña incorrectos.' : /confirm/i.test(r.error.message) ? 'Falta confirmar la cuenta: revisá tu mail.' : r.error.message;
      pantallaLogin(modo, m);
    }
  };
}
function pantallaSinAcceso(email) {
  $('#app').innerHTML = `<div class="login"><div class="card"><div class="monograma">M</div><h1>Todavía no tenés acceso</h1>
    <p class="small" style="text-align:center">Entraste como <b>${esc(email || '')}</b>, pero ese mail no está invitado al equipo.</p>
    <p class="small muted" style="text-align:center">Pedile a Malena que te agregue en <b>Equipo</b> con este mismo mail y después tocá “Reintentar”.</p>
    <div class="modal-acciones" style="justify-content:center"><button class="btn" id="b-salir">Salir</button><button class="btn pri" id="b-re">Reintentar</button></div></div></div>`;
  $('#b-salir').onclick = async () => { await api.salir(); location.reload(); };
  $('#b-re').onclick = () => iniciar();
}

let iniciando = false;
async function iniciar() {
  if (iniciando) return; iniciando = true;
  try {
    const u = await api.sesion();
    if (!u) { pantallaLogin(); return; }
    S.yoId = await api.vincular();
    if (!S.yoId) { pantallaSinAcceso(u.email); return; }
    await refrescar();
    if (!S.yo) { pantallaSinAcceso(u.email); return; }
    const h = location.hash.slice(1); if (VISTAS[h]) S.vista = h;
    render();
  } catch (e) {
    console.error(e);
    $('#app').innerHTML = `<div class="login"><div class="card"><h1>Algo falló</h1><p class="small">${esc(e.message || e)}</p><button class="btn pri" onclick="location.reload()">Reintentar</button></div></div>`;
  } finally { iniciando = false; }
}

function cargarScript(src) { return new Promise((ok, mal) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => mal(new Error('No se pudo cargar ' + src)); document.head.appendChild(s); }); }

(async function arrancar() {
  const cfg = window.MALENITY_CONFIG || {};
  if (cfg.supabaseUrl && cfg.supabaseKey) {
    try { await cargarScript(SUPABASE_CDN); } catch (e) { $('#app').innerHTML = `<div class="login"><div class="card"><h1>Sin conexión</h1><p class="small">No se pudo cargar la app. Revisá internet y recargá.</p></div></div>`; return; }
    api = crearSupabase(cfg);
    api.sb.auth.onAuthStateChange((ev) => {
      if (ev === 'PASSWORD_RECOVERY') pantallaLogin('nueva');
      else if (ev === 'SIGNED_IN' && !S.yo) setTimeout(iniciar, 0);
    });
  } else {
    api = window.MalenityDemo;
  }
  iniciar();
})();
})();
