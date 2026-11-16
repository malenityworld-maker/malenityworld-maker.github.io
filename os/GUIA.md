# Malenity OS · Guía

El sistema operativo de Malenity World, basado en Traction (EOS) y en el método de Malena:
idea → plan → organización → deadline → trackear → tolerancia (máximo 3 rojos) → pasos chicos.

- **Link:** https://malenityworld-maker.github.io/os/
- **Cómo está hecho:** una página web en GitHub Pages (gratis) y una base de datos en Supabase (plan gratis, con login y permisos por persona). Una copia de seguridad cifrada se guarda todos los días en GitHub.
- **Fecha y hora:** todo se muestra con la hora de Argentina (America/Argentina/Buenos_Aires). Las semanas van de lunes a domingo.

---

## 1. Puesta en marcha (una sola vez)

Mientras estos pasos no estén hechos, la app abre en **modo prueba**: tiene datos de ejemplo que se guardan solo en ese navegador, y arriba hay un selector "Ver como" para probar la vista de la dueña y la del equipo.

### A. Crear la base en Supabase (10 minutos)
1. Entrá a https://supabase.com, tocá **Start your project** y creá una cuenta (podés usar tu Google).
2. **New project** → nombre `malenity-os`, región **South America (São Paulo)**, inventá una contraseña de base de datos y **guardala** (la vas a usar en el paso D).
3. Cuando termine de crearse, andá a **SQL Editor** → **New query**. Pegá todo el contenido de `os/supabase/01_esquema.sql` y tocá **Run**. Después hacé lo mismo con `os/supabase/02_datos_iniciales.sql`.
4. Andá a **Authentication → URL Configuration**:
   - **Site URL:** `https://malenityworld-maker.github.io/os/`
   - **Redirect URLs:** agregá `https://malenityworld-maker.github.io/os/`
5. En **Authentication → Sign In / Providers → Email**, dejá activado **Confirm email** (así nadie puede crear una cuenta con un mail que no es suyo).

### B. Pasarle las claves a GitHub (sin que queden en el código)
1. En Supabase: **Project Settings → API Keys**. Copiá la **Publishable key** (empieza con `sb_publishable_`; si ves "anon public", sirve igual). En **Project Settings → Data API** copiá la **Project URL**.
2. En GitHub, en el repositorio: **Settings → Secrets and variables → Actions → New repository secret**. Creá dos:
   - `SUPABASE_URL` → la Project URL
   - `SUPABASE_PUBLISHABLE_KEY` → la Publishable key
3. **Settings → Pages → Build and deployment → Source:** elegí **GitHub Actions**.

> La "publishable key" está pensada para viajar al navegador: sola no abre nada, porque cada dato está protegido por los permisos de la base. Las claves secretas de verdad (la contraseña de la base, y en la Fase 2 las de Windsor y Meta) nunca van a la web: quedan en los secretos de GitHub o de Supabase.

### C. Entrar por primera vez
1. Abrí el link, tocá **Crear cuenta** con tu mail y una contraseña, y confirmá el mail.
2. Entrá. **La primera persona que entra queda como administradora (Malena)**, así que hacelo vos antes de invitar a nadie.

### D. Copia de seguridad diaria
1. En Supabase: botón **Connect** (arriba) → **Session pooler** → copiá la "connection string" y reemplazá `[YOUR-PASSWORD]` por la contraseña del paso A.2.
2. En GitHub creá dos secretos más:
   - `SUPABASE_DB_URL` → esa connection string
   - `BACKUP_PASSPHRASE` → una frase larga que inventes y guardes en un lugar seguro (sin ella, la copia no se puede abrir)
3. Para probar: **Actions → Copia de seguridad → Run workflow**. Las copias quedan 30 días en cada ejecución, en "Artifacts".

> El plan gratis de Supabase pausa los proyectos que pasan una semana sin uso. Si usás la app todos los días no pasa; si un día lo ves pausado, se reactiva desde el panel de Supabase con un botón. Si algún día querés cero riesgo, el plan Pro (USD 25 por mes) suma copias automáticas propias y no se pausa.

### E. (Opcional) Entrar con Google
En Supabase: **Authentication → Sign In / Providers → Google**. Supabase te muestra los pasos para crear el "OAuth client" en Google Cloud (pegás un Client ID y un Client Secret). Hasta que lo actives, se entra con mail y contraseña.

---

## 2. Cómo invito a una persona del equipo
1. **Equipo → + Persona** (o **Editar** en un puesto "a contratar"). Completá nombre, puesto, responsabilidades y **su mail**. Permisos: **Equipo**.
2. Mandale el link: https://malenityworld-maker.github.io/os/
3. Que toque **Crear cuenta** con ese mismo mail (o **Entrar con Google** con ese mail) y lo confirme.
4. Listo: entra directo a su pantalla **Hoy**. En Equipo vas a ver "Ya entró".

Para que alguien del equipo vea la plata (ganancia neta y fondos): **Equipo → Editar → Puede ver la plata**.
Para sacarle el acceso: **Estado → Inactiva**.

**Qué ve el equipo:** sus tareas (las de hoy, atrasadas y sin fecha), las rocas, la visión, las ideas y los números que no son plata. **Qué puede hacer:** tildar sus tareas, cargar los números de los que es responsable, marcar las rocas de las que es dueño y sumar ideas.

---

## 3. Recorrido por cada pantalla

**Visión (barra de arriba, siempre visible).** La meta a 1 año y a 3 años. Tocala para leerla completa. En la pantalla **Visión** están la meta general, el mindset y para qué es la plata de cada negocio.

**Hoy.** Lo primero que ve cada persona al entrar: tareas atrasadas (en rojo), las de hoy ordenadas por bloque (mañana, tarde, noche), las rocas a las que aporta, lo que queda de la semana y lo pendiente sin fecha. Tocá el cuadradito para tildar. Las tareas **⚡ Automáticas** (Fase 2, del reporte de Meta) muestran la regla y el número que las disparó. Domingo y lunes aparece el aviso del reset.

**Reset semanal.** La pantalla guiada de 4 pasos, para el domingo o el lunes:
1. **Números:** cargás el scorecard de la semana (el semáforo se pinta solo).
2. **Rocas:** verde o rojo para cada una, con nota opcional. Al 4.º rojo te pide confirmar y la roca vuelve a Ideas.
3. **Planificar:** ves la semana siguiente ordenada por negocio, qué rocas no tienen tareas, y las pendientes para reubicar. Sumás tareas con día y bloque, incluidas las de "Vida y otras áreas".
4. **Ideas:** revisás la lista; pasás alguna a roca o la descartás.
Con las flechas ‹ › cambiás de semana.

**Rocas.** Las prioridades del trimestre (elegís el trimestre arriba). Cada una con dueña, medida de éxito, deadline, por qué, semáforo semanal (13 cuadraditos; tocá uno para marcarlo), rojos acumulados y tareas hechas. Si intentás tener más de 5 activas en un trimestre, te avisa antes de cargarla.

**Números.** El scorecard: 8 semanas por número, verde si llega a la meta y rojo si no. Tocá una celda para cargar o corregir. Abajo, los **Fondos** con barra de avance (solo para quien ve la plata).

**Tareas.** Todas las tareas (el equipo ve solo las suyas), agrupadas por negocio. Filtros por estado, persona, negocio y roca. **+ Tarea** pide: qué, responsable (uno solo), negocio, roca a la que aporta, fecha opcional y bloque.

**Ideas.** Todo lo que no entra en el trimestre, con detalle. Cualquiera puede sumar ideas o problemas. Vos podés **Pasar a roca** (te pide medida, deadline y por qué) o **Descartar**.

**Equipo.** El Accountability Chart: cada persona con su puesto, responsabilidades, rocas, números y tareas a cargo, y si ya entró al sistema.

**Ajustes.** Áreas, números del scorecard y fondos. También el tema claro u oscuro.

**Registro.** Quién hizo qué y cuándo (últimos 200 movimientos).

---

## 4. Cómo cambio cosas sin tocar código

| Quiero cambiar… | Dónde |
|---|---|
| Una roca (texto, medida, deadline, dueña, estado) | Rocas → Editar |
| Crear una roca | Rocas → + Roca, o Ideas → Pasar a roca |
| Marcar verde/rojo | Reset paso 2, o tocar un cuadradito en Rocas |
| La meta de un número, o sumar uno nuevo | Números → tocar el nombre, o Ajustes → Números del scorecard |
| Un valor ya cargado | Números → tocar la celda |
| Los fondos (meta, cálculo, año) | Ajustes → Fondos |
| Áreas / negocios (nombre, para qué, color) | Ajustes → Áreas |
| Personas, puestos, permisos, ver la plata | Equipo → + Persona / Editar |
| Visión a 1 y 3 años, mindset | Visión → Editar visión |

---

## 5. Lo que viene

- **Fase 2:** el reporte diario de Meta adentro del sistema (Windsor, 8,5 % de comisión en Argentina, excluye "PARLIAMO CAMP 1", hasta 4 tareas automáticas por día en tu "Hoy"), la ganancia neta semanal de Argentina cargada sola en el scorecard (la podés corregir) y el mail o mensaje de la mañana. La base ya tiene los campos para esto.
- **Fase 3:** clientes y membresía, recordatorios en Google Calendar y tracker de hábitos de fin del día.

## Archivos
- `os/index.html`, `os/app.js`, `os/styles.css`: la app.
- `os/demo.js`: el modo prueba.
- `os/config.js`: vacío en el repositorio; se completa al publicar.
- `os/supabase/01_esquema.sql`: tablas, permisos y reglas (4 rojos, registro).
- `os/supabase/02_datos_iniciales.sql`: rocas, scorecard, fondos, ideas, áreas y equipo iniciales.
- `.github/workflows/publicar.yml` y `copia-de-seguridad.yml`: publicación y copia diaria.
