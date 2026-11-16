/* Malenity OS · Modo prueba
   Cuando la app todavía no está conectada a la base de datos (Supabase),
   funciona con estos datos de ejemplo guardados solo en este navegador.
   Imita los mismos permisos y reglas que la base real. */
(function () {
  const CLAVE = 'malenity-os-demo-v1';
  const TABLAS = ['personas','areas','vision','ideas','rocas','roca_semanas','metricas','valores','fondos','tareas'];
  const id = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now());
  const ahora = () => new Date().toISOString();

  function hoyAR() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
  }
  function sumar(iso, n) { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function lunes(iso) { const d = new Date(iso + 'T12:00:00Z'); const w = (d.getUTCDay() + 6) % 7; return sumar(iso, -w); }

  function semilla() {
    const db = {}; TABLAS.forEach(t => db[t] = []); db.registro = [];
    const P = (o) => { const r = Object.assign({ id: id(), email: null, usuario_id: null, rol: 'equipo', ve_plata: false, estado: 'activa', creado_en: ahora() }, o); db.personas.push(r); return r; };
    const male = P({ nombre: 'Malena', puesto: 'Dueña', responsabilidades: 'Anuncios, landings, clases y decisiones', rol: 'admin', ve_plata: true, orden: 1, usuario_id: 'demo-malena' });
    const asis = P({ nombre: 'Asistente Malenity Shop', puesto: 'Asistente Malenity Shop', responsabilidades: 'Historias, reels, pedidos y envíos', estado: 'a_contratar', orden: 2, email: 'asistente@ejemplo.com', usuario_id: 'demo-asistente' });
    P({ nombre: 'Editor de video', puesto: 'Editor de video', responsabilidades: 'Edición de anuncios y de clases', estado: 'a_contratar', orden: 3 });

    const A = (nombre, que_vende, para_que, color, orden) => { const r = { id: id(), nombre, que_vende, para_que, color, orden, activa: true }; db.areas.push(r); return r; };
    const shop = A('Malenity Shop', 'Mochilas', 'Flujo del día a día, fondo de emergencia y sueldos del equipo', '#A9824E', 1);
    const memb = A('Membresía', 'Curso de idiomas, USD 40 por mes, 4 meses', 'Pagar el alquiler de mi casa', '#5E7A6B', 2);
    const arg = A('Malenity Digital · Argentina', "Ebooks: Italiano para viajar, Girando l'Italia, Inglés para viajar", 'Fondo de viajes 2027 (USD 10.000)', '#B5423C', 3);
    const latam = A('Malenity Digital · LATAM e internacional', 'Los mismos ebooks en LATAM y Spanish for Travelers en inglés', 'Ahorro en MALENITY WORLD LLC', '#4F6A8C', 4);
    const vida = A('Vida y otras áreas', 'Lo personal y lo que no es de un negocio', 'Que la semana entre en el calendario', '#8A7A6E', 5);

    db.vision.push({ id: 1, meta_mensual: 'USD 30.000 netos por mes, después de anuncios, comisiones e impuestos.',
      meta_1_anio: 'Diciembre 2027: fondo de viajes de USD 10.000 cumplido, 15 membresías pagando el alquiler, Malenity Shop delegada y ahorro creciendo en la LLC.',
      meta_3_anios: 'Diciembre 2029: USD 30.000 netos por mes con un equipo que hace funcionar el día a día.',
      mindset: 'Pasos chicos y constantes. Roma no se hizo en dos días.', actualizado_en: ahora() });

    const R = (titulo, se_cumple_si, por_que, area, orden) => { const r = { id: id(), titulo, se_cumple_si, por_que, responsable_id: male.id, area_id: area.id, trimestre: '2027-T1', inicio: '2027-01-01', deadline: '2027-03-31', estado: 'activa', idea_id: null, orden, creada_en: ahora() }; db.rocas.push(r); return r; };
    const r1 = R('Malenity Digital a USD 200 netos por día', '4 semanas seguidas en ese número', 'Llenar el fondo de viajes 2027 y el ahorro de la LLC', arg, 1);
    const r2 = R('Membresía: curso grabado y 15 membresías activas', 'Todas las clases grabadas y 15 miembros pagando', 'Que la membresía pague el alquiler', memb, 2);
    R('Spanish for Travelers relanzado en enero', '30 ventas con el CPA por debajo del equilibrio', 'Abrir el mercado internacional y sumar ahorro en la LLC', latam, 3);
    const r4 = R('Malenity Shop delegada y vendiendo 24 mochilas por mes', 'Asistente con manual, 24 mochilas por mes y yo sin tocar pedidos', 'Flujo del día a día, fondo de emergencia y sueldos, sin depender de mí', shop, 4);

    const M = (nombre, meta, unidad, para_que, area, es_plata, fuente, orden, resp) => { const r = { id: id(), nombre, meta, sentido: 'mayor', unidad, para_que, responsable_id: (resp || male).id, area_id: area.id, es_plata, fuente, orden, activa: true }; db.metricas.push(r); return r; };
    const mMoch = M('Mochilas vendidas por semana', 6, 'mochilas', 'Flujo diario y sueldos (24 por mes)', shop, false, 'manual', 1, asis);
    const mMemb = M('Membresías activas', 15, 'miembros', 'Alquiler', memb, false, 'manual', 2);
    const mArg = M('Ganancia neta Malenity Digital Argentina por semana', 192, 'USD', 'USD 10.000 de viajes en 2027', arg, true, 'meta_ads', 3);
    const mLat = M('Ganancia neta LATAM + internacional por semana', null, 'USD', 'Ahorro en la LLC', latam, true, 'manual', 4);
    const mDia = M('Ganancia neta diaria de anuncios (promedio semanal)', 200, 'USD', 'Roca 1', arg, true, 'meta_ads', 5);

    const F = (nombre, m, calculo, anio, meta, unidad, para_que, orden) => db.fondos.push({ id: id(), nombre, metrica_id: m.id, calculo, anio, meta, unidad, para_que, orden });
    F('Viajes 2027', mArg, 'suma_anio', 2027, 10000, 'USD', 'Suma anual de la ganancia de Argentina', 1);
    F('Ahorro LLC', mLat, 'suma_anio', 2027, null, 'USD', 'Suma anual de LATAM + internacional', 2);
    F('Alquiler', mMemb, 'ultimo', null, 15, 'miembros', 'Membresías activas contra 15', 3);
    F('Flujo de Malenity Shop', mMoch, 'suma_mes', null, 24, 'mochilas', 'Mochilas del mes contra 24', 4);

    const I = (titulo, detalle, area, para_cuando) => db.ideas.push({ id: id(), titulo, detalle, tipo: 'idea', area_id: area.id, para_cuando, estado: 'espera', veces_devuelta: 0, creada_por: male.id, creada_en: ahora() });
    I('Spagnolo per i tuoi viaggi', 'Ebook de español para viajeros italianos. Se vende en Italia, facturado por la LLC.', latam, '2027-T2');
    I('Terminar el ebook Viajar más y mejor', 'Terminar de escribir y lanzar el ebook.', arg, null);
    I('Anuncios de Italiano per lavorare', 'Armar campaña de anuncios para el producto Italiano per lavorare.', arg, null);
    I('Lanzar Inglés para trabajar', 'Nuevo producto: inglés para el trabajo.', arg, null);
    I('Italiano conversacional', 'Producto o curso de italiano conversacional.', memb, null);
    I('Web personal', 'Una web personal propia.', vida, null);
    I('6 reels fijos para el feed', 'Seis reels fijados en el perfil que presenten la marca.', shop, null);
    I('Flashcards de italiano', 'Flashcards de italiano como venta cruzada de los ebooks.', arg, null);

    // --- Solo para el modo prueba: tareas y números de ejemplo ---
    const hoy = hoyAR();
    const T = (titulo, resp, area, roca, fecha, bloque, extra) => db.tareas.push(Object.assign({ id: id(), titulo, detalle: null, responsable_id: resp.id, area_id: area.id, roca_id: roca ? roca.id : null, fecha, bloque, hecha: false, hecha_en: null, origen: 'manual', regla: null, disparador: null, creada_por: male.id, creada_en: ahora() }, extra || {}));
    T('Grabar clase 3 de la membresía', male, memb, r2, hoy, 'Mañana');
    T('Escribir guion del anuncio de Italiano para viajar', male, arg, r1, hoy, 'Tarde');
    T('Pausar el anuncio "Carrusel 2"', male, arg, r1, hoy, 'Mañana', { origen: 'automatica', regla: 'CPA por encima del equilibrio 3 días seguidos', disparador: 'CPA USD 9,40 (equilibrio USD 7,10)', detalle: 'Ejemplo de tarea que va a generar el reporte diario de Meta (Fase 2).' });
    T('Revisar landing de Girando l\'Italia', male, arg, null, sumar(hoy, -2), 'Tarde');
    T('Escribir el manual de pedidos para la asistente', male, shop, r4, sumar(hoy, 2), 'Mañana');
    T('Subir 3 historias de mochilas', asis, shop, r4, hoy, 'Mañana');
    T('Despachar pedidos del fin de semana', asis, shop, r4, hoy, 'Tarde');
    T('Turno médico', male, vida, null, sumar(hoy, 1), 'Mañana');

    const sem = lunes(hoy);
    const V = (m, semana, valor, fuente) => db.valores.push({ id: id(), metrica_id: m.id, semana, valor, fuente: fuente || 'manual', corregido: false, cargado_por: male.id, cargado_en: ahora() });
    [[-35, 4, 9, 150, 40, 140], [-28, 6, 10, 210, 55, 180], [-21, 5, 11, 170, 30, 165], [-14, 7, 11, 230, 60, 205], [-7, 6, 12, 198, 45, 190]].forEach(([d, mo, me, ar, la, di]) => {
      const s = sumar(sem, d); V(mMoch, s, mo); V(mMemb, s, me); V(mArg, s, ar, 'meta_ads'); V(mLat, s, la); V(mDia, s, di, 'meta_ads');
    });
    return db;
  }

  function cargarDB() {
    try { const t = localStorage.getItem(CLAVE); if (t) return JSON.parse(t); } catch (e) {}
    const db = semilla(); guardarDB(db); return db;
  }
  function guardarDB(db) { try { localStorage.setItem(CLAVE, JSON.stringify(db)); } catch (e) {} }

  let db = cargarDB();
  let usuario = null;
  try { usuario = localStorage.getItem(CLAVE + '-usuario') || 'demo-malena'; } catch (e) { usuario = 'demo-malena'; }

  const yo = () => db.personas.find(p => p.usuario_id === usuario && p.estado !== 'inactiva');
  const esAdmin = () => (yo() || {}).rol === 'admin';
  const vePlata = () => { const p = yo(); return !!p && (p.rol === 'admin' || p.ve_plata); };
  const clon = (x) => JSON.parse(JSON.stringify(x));

  function registrar(tabla, accion, descripcion, sistema) {
    const p = sistema ? null : yo();
    db.registro.unshift({ id: Date.now() + Math.random(), cuando: ahora(), persona_id: p ? p.id : null, persona_nombre: p ? p.nombre : 'Sistema', tabla, accion, descripcion });
    db.registro = db.registro.slice(0, 300);
  }
  function descripcion(tabla, r) {
    if (tabla === 'valores') { const m = db.metricas.find(x => x.id === r.metrica_id); return (m ? m.nombre : '') + ' · semana ' + r.semana + ' = ' + r.valor; }
    if (tabla === 'roca_semanas') { const k = db.rocas.find(x => x.id === r.roca_id); return (k ? k.titulo : '') + ' · semana ' + r.semana + ' → ' + r.color; }
    if (tabla === 'vision') return 'Visión';
    return r.titulo || r.nombre || '';
  }
  const DEFAULTS = {
    personas: () => ({ rol: 'equipo', ve_plata: false, estado: 'activa', orden: 9, usuario_id: null, creado_en: ahora() }),
    areas: () => ({ color: '#B5423C', orden: 9, activa: true }),
    ideas: () => ({ tipo: 'idea', estado: 'espera', veces_devuelta: 0, creada_por: (yo() || {}).id, creada_en: ahora() }),
    rocas: () => ({ estado: 'activa', orden: 9, creada_en: ahora() }),
    metricas: () => ({ sentido: 'mayor', es_plata: false, fuente: 'manual', orden: 9, activa: true }),
    fondos: () => ({ orden: 9 }),
    tareas: () => ({ hecha: false, origen: 'manual', creada_por: (yo() || {}).id, creada_en: ahora() }),
    roca_semanas: () => ({ marcada_en: ahora() }),
    valores: () => ({ fuente: 'manual', corregido: false, cargado_por: (yo() || {}).id, cargado_en: ahora() }),
  };

  function reglaCuatroRojos(rocaId) {
    const rojos = db.roca_semanas.filter(s => s.roca_id === rocaId && s.color === 'rojo').length;
    const r = db.rocas.find(x => x.id === rocaId);
    if (!r || rojos < 4 || r.estado !== 'activa') return false;
    let idea = r.idea_id && db.ideas.find(i => i.id === r.idea_id);
    if (idea) {
      idea.estado = 'espera'; idea.veces_devuelta = (idea.veces_devuelta || 0) + 1;
      idea.detalle = (idea.detalle || '') + '\n\nVolvió de las rocas (' + r.trimestre + ') por 4 rojos.';
    } else {
      idea = { id: id(), titulo: r.titulo, detalle: 'Se cumplía si: ' + r.se_cumple_si + (r.por_que ? '\nPor qué: ' + r.por_que : '') + '\n\nVolvió de las rocas (' + r.trimestre + ') por 4 rojos.', tipo: 'idea', area_id: r.area_id, para_cuando: null, estado: 'espera', veces_devuelta: 1, creada_por: r.responsable_id, creada_en: ahora() };
      db.ideas.push(idea);
    }
    r.estado = 'devuelta'; r.idea_id = idea.id;
    registrar('rocas', 'volvió a Ideas (4 rojos)', r.titulo, true);
    return true;
  }

  window.MalenityDemo = {
    modo: 'demo',
    usuarioActual: () => usuario,
    cambiarUsuario(u) { usuario = u; try { localStorage.setItem(CLAVE + '-usuario', u); } catch (e) {} },
    reiniciar() { db = semilla(); guardarDB(db); },
    async sesion() { return { email: (yo() || {}).email || 'demo' }; },
    async vincular() { return (yo() || {}).id || null; },
    async salir() {},
    async cargar() {
      const p = yo(); if (!p) return null;
      const out = {};
      TABLAS.forEach(t => out[t] = clon(db[t]));
      if (!vePlata()) {
        const ocultas = new Set(db.metricas.filter(m => m.es_plata).map(m => m.id));
        out.metricas = out.metricas.filter(m => !ocultas.has(m.id));
        out.valores = out.valores.filter(v => !ocultas.has(v.metrica_id));
        out.fondos = [];
      }
      if (!esAdmin()) out.tareas = out.tareas.filter(t => t.responsable_id === p.id);
      return out;
    },
    async insertar(tabla, fila) {
      const r = Object.assign({ id: id() }, (DEFAULTS[tabla] || (() => ({})))(), fila);
      if (tabla === 'tareas' && r.hecha) r.hecha_en = ahora();
      db[tabla].push(r); registrar(tabla, 'creó', descripcion(tabla, r)); guardarDB(db); return clon(r);
    },
    async actualizar(tabla, idFila, cambios) {
      const r = db[tabla].find(x => String(x.id) === String(idFila)); if (!r) throw new Error('No encontrado');
      let accion = 'editó';
      if (tabla === 'tareas') {
        if (!esAdmin()) cambios = { hecha: cambios.hecha };
        if ('hecha' in cambios && cambios.hecha !== r.hecha) { accion = cambios.hecha ? 'completó' : 'reabrió'; cambios.hecha_en = cambios.hecha ? ahora() : null; }
      }
      Object.assign(r, cambios); registrar(tabla, accion, descripcion(tabla, r)); guardarDB(db); return clon(r);
    },
    async borrar(tabla, idFila) {
      const r = db[tabla].find(x => String(x.id) === String(idFila));
      db[tabla] = db[tabla].filter(x => String(x.id) !== String(idFila));
      if (tabla === 'rocas') db.roca_semanas = db.roca_semanas.filter(s => s.roca_id !== idFila);
      if (tabla === 'metricas') db.valores = db.valores.filter(s => s.metrica_id !== idFila);
      if (r) registrar(tabla, 'borró', descripcion(tabla, r)); guardarDB(db);
    },
    async guardarSemana(tabla, fila) { // upsert por (roca_id|metrica_id, semana)
      const k = tabla === 'valores' ? 'metrica_id' : 'roca_id';
      let r = db[tabla].find(x => x[k] === fila[k] && x.semana === fila.semana);
      let devuelta = false;
      if (r) {
        if (tabla === 'valores' && r.fuente === 'meta_ads' && Number(fila.valor) !== Number(r.valor)) fila.corregido = true;
        Object.assign(r, fila, tabla === 'valores' ? { cargado_por: (yo() || {}).id, cargado_en: ahora() } : { marcada_en: ahora() });
        registrar(tabla, 'editó', descripcion(tabla, r));
      } else {
        r = Object.assign({ id: id() }, DEFAULTS[tabla](), fila); db[tabla].push(r);
        registrar(tabla, 'creó', descripcion(tabla, r));
      }
      if (tabla === 'roca_semanas') devuelta = reglaCuatroRojos(r.roca_id);
      guardarDB(db); return { fila: clon(r), devuelta };
    },
    async borrarSemana(tabla, fila) {
      const k = tabla === 'valores' ? 'metrica_id' : 'roca_id';
      db[tabla] = db[tabla].filter(x => !(x[k] === fila[k] && x.semana === fila.semana)); guardarDB(db);
    },
    async registro() { return esAdmin() ? clon(db.registro.slice(0, 200)) : []; },
  };
})();
