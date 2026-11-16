-- =====================================================================
-- Malenity OS · Datos iniciales
-- Se pega UNA vez en Supabase → SQL Editor → Run, después de 01_esquema.sql.
-- Todo esto se puede cambiar después desde la app, sin tocar código.
-- =====================================================================

-- Equipo (Accountability Chart). La primera persona que entra a la app
-- queda vinculada a "Malena" como administradora.
insert into public.personas (nombre, puesto, responsabilidades, rol, ve_plata, estado, orden) values
  ('Malena', 'Dueña', 'Anuncios, landings, clases y decisiones', 'admin', true, 'activa', 1),
  ('Asistente Malenity Shop', 'Asistente Malenity Shop', 'Historias, reels, pedidos y envíos', 'equipo', false, 'a_contratar', 2),
  ('Editor de video', 'Editor de video', 'Edición de anuncios y de clases', 'equipo', false, 'a_contratar', 3);

-- Áreas (negocios)
insert into public.areas (nombre, que_vende, para_que, color, orden) values
  ('Malenity Shop', 'Mochilas', 'Flujo del día a día, fondo de emergencia y sueldos del equipo', '#A9824E', 1),
  ('Membresía', 'Curso de idiomas, USD 40 por mes, 4 meses', 'Pagar el alquiler de mi casa', '#5E7A6B', 2),
  ('Malenity Digital · Argentina', 'Ebooks: Italiano para viajar, Girando l''Italia, Inglés para viajar', 'Fondo de viajes 2027 (USD 10.000)', '#B5423C', 3),
  ('Malenity Digital · LATAM e internacional', 'Los mismos ebooks en LATAM y Spanish for Travelers en inglés', 'Ahorro en MALENITY WORLD LLC', '#4F6A8C', 4),
  ('Vida y otras áreas', 'Lo personal y lo que no es de un negocio', 'Que la semana entre en el calendario', '#8A7A6E', 5);

-- Visión
insert into public.vision (id, meta_mensual, meta_1_anio, meta_3_anios, mindset) values (1,
  'USD 30.000 netos por mes, después de anuncios, comisiones e impuestos.',
  'Diciembre 2027: fondo de viajes de USD 10.000 cumplido, 15 membresías pagando el alquiler, Malenity Shop delegada y ahorro creciendo en la LLC.',
  'Diciembre 2029: USD 30.000 netos por mes con un equipo que hace funcionar el día a día.',
  'Pasos chicos y constantes. Roma no se hizo en dos días.')
on conflict (id) do nothing;

-- Rocas enero a marzo 2027
insert into public.rocas (titulo, se_cumple_si, por_que, responsable_id, area_id, trimestre, inicio, deadline, orden)
select v.titulo, v.medida, v.por_que,
       (select id from public.personas where nombre = 'Malena'),
       (select id from public.areas where nombre = v.area),
       '2027-T1', date '2027-01-01', date '2027-03-31', v.orden
from (values
  ('Malenity Digital a USD 200 netos por día', '4 semanas seguidas en ese número',
   'Llenar el fondo de viajes 2027 y el ahorro de la LLC', 'Malenity Digital · Argentina', 1),
  ('Membresía: curso grabado y 15 membresías activas', 'Todas las clases grabadas y 15 miembros pagando',
   'Que la membresía pague el alquiler', 'Membresía', 2),
  ('Spanish for Travelers relanzado en enero', '30 ventas con el CPA por debajo del equilibrio',
   'Abrir el mercado internacional y sumar ahorro en la LLC', 'Malenity Digital · LATAM e internacional', 3),
  ('Malenity Shop delegada y vendiendo 24 mochilas por mes', 'Asistente con manual, 24 mochilas por mes y yo sin tocar pedidos',
   'Flujo del día a día, fondo de emergencia y sueldos, sin depender de mí', 'Malenity Shop', 4)
) as v(titulo, medida, por_que, area, orden);

-- Scorecard
insert into public.metricas (nombre, meta, unidad, para_que, responsable_id, area_id, es_plata, fuente, orden)
select v.nombre, v.meta, v.unidad, v.para_que,
       (select id from public.personas where nombre = 'Malena'),
       (select id from public.areas where nombre = v.area),
       v.es_plata, v.fuente, v.orden
from (values
  ('Mochilas vendidas por semana', 6::numeric, 'mochilas', 'Flujo diario y sueldos (24 por mes)', 'Malenity Shop', false, 'manual', 1),
  ('Membresías activas', 15::numeric, 'miembros', 'Alquiler', 'Membresía', false, 'manual', 2),
  ('Ganancia neta Malenity Digital Argentina por semana', 192::numeric, 'USD', 'USD 10.000 de viajes en 2027', 'Malenity Digital · Argentina', true, 'meta_ads', 3),
  ('Ganancia neta LATAM + internacional por semana', null::numeric, 'USD', 'Ahorro en la LLC', 'Malenity Digital · LATAM e internacional', true, 'manual', 4),
  ('Ganancia neta diaria de anuncios (promedio semanal)', 200::numeric, 'USD', 'Roca 1', 'Malenity Digital · Argentina', true, 'meta_ads', 5)
) as v(nombre, meta, unidad, para_que, area, es_plata, fuente, orden);

-- Fondos
insert into public.fondos (nombre, metrica_id, calculo, anio, meta, unidad, para_que, orden)
select v.nombre, (select id from public.metricas where nombre = v.metrica), v.calculo, v.anio, v.meta, v.unidad, v.para_que, v.orden
from (values
  ('Viajes 2027', 'Ganancia neta Malenity Digital Argentina por semana', 'suma_anio', 2027, 10000::numeric, 'USD', 'Suma anual de la ganancia de Argentina', 1),
  ('Ahorro LLC', 'Ganancia neta LATAM + internacional por semana', 'suma_anio', 2027, null::numeric, 'USD', 'Suma anual de LATAM + internacional', 2),
  ('Alquiler', 'Membresías activas', 'ultimo', null::int, 15::numeric, 'miembros', 'Membresías activas contra 15', 3),
  ('Flujo de Malenity Shop', 'Mochilas vendidas por semana', 'suma_mes', null::int, 24::numeric, 'mochilas', 'Mochilas del mes contra 24', 4)
) as v(nombre, metrica, calculo, anio, meta, unidad, para_que, orden);

-- Ideas
insert into public.ideas (titulo, detalle, area_id, para_cuando, creada_por)
select v.titulo, v.detalle, (select id from public.areas where nombre = v.area), v.cuando,
       (select id from public.personas where nombre = 'Malena')
from (values
  ('Spagnolo per i tuoi viaggi', 'Ebook de español para viajeros italianos. Se vende en Italia, facturado por la LLC.', 'Malenity Digital · LATAM e internacional', '2027-T2'),
  ('Terminar el ebook Viajar más y mejor', 'Terminar de escribir y lanzar el ebook.', 'Malenity Digital · Argentina', null),
  ('Anuncios de Italiano per lavorare', 'Armar campaña de anuncios para el producto Italiano per lavorare.', 'Malenity Digital · Argentina', null),
  ('Lanzar Inglés para trabajar', 'Nuevo producto: inglés para el trabajo.', 'Malenity Digital · Argentina', null),
  ('Italiano conversacional', 'Producto o curso de italiano conversacional.', 'Membresía', null),
  ('Web personal', 'Una web personal propia.', 'Vida y otras áreas', null),
  ('6 reels fijos para el feed', 'Seis reels fijados en el perfil que presenten la marca.', 'Malenity Shop', null),
  ('Flashcards de italiano', 'Flashcards de italiano como venta cruzada de los ebooks.', 'Malenity Digital · Argentina', null)
) as v(titulo, detalle, area, cuando);

-- Limpio el registro de la carga inicial
delete from public.registro;
