# CVs · Tutores y Directores Académicos ISEIE

Carpeta con un CV en markdown por cada Director Académico publicado en [iseie.com/mentores-y-tutores](https://iseie.com/mentores-y-tutores/).

**Fuente de datos:** endpoint público `https://iseie.com/wp-json/iseie/v1/directores` (sin autenticación, devuelve 19 perfiles completos al momento de la extracción), complementado con información ampliada provista directamente por ISEIE para los perfiles que carecían de bio pública (Julia Bovis Benavides) y confirmaciones para perfiles con datos a validar (Luz Marina Zuluaga).

**Fecha de extracción y consolidación:** 2026-05-19.

---

## Índice por facultad

### Derecho (1)

- [01 · Ramón Miralles López](01-ramon-miralles-lopez.md) — Socio en ECIJA. *Máster en Derecho Digital.*

### Educación (1)

- [02 · Mildreth Plata López](02-mildreth-plata-lopez.md) — Tecnología e Innovación Educativa. *4 programas.*

### Medicina (15)

- [03 · Alberto Jurado Arévalo](03-alberto-jurado-arevalo.md) — Medicina Estética y Trasplante Capilar. Director ADVAN-HAIR.
- [04 · Cristina Moreno Martín](04-cristina-moreno-martin.md) — Medicina Hiperbárica.
- [05 · Dra. Irene Pulido García](05-dra-irene-pulido-garcia.md) — Neuropsicología y Logopedia.
- [06 · Elena María Granados Alarcón](06-elena-maria-granados-alarcon.md) — Alergología + Medicina Estética. Ruber Juan Bravo / Vithas.
- [07 · Iria Graña Somoza](07-iria-grana-somoza.md) — Podología pediátrica.
- [08 · Julia Bovis Benavides](08-julia-bovis-benavides.md) — Óptico-Optometrista. Directora Multiópticas Bovis Vision. Contactología avanzada y control de miopía.
- [09 · Lidia Isabel de Sus Martínez](09-lidia-isabel-de-sus-martinez.md) — Doctora. Obesidad y Nutrición. Publicaciones JCR.
- [10 · Luz Marina Zuluaga](10-luz-marina-zuluaga.md) — Cirugía pie diabético (UCM). Confirmada por ISEIE.
- [11 · María Dolores Flores Romero](11-maria-dolores-flores-romero.md) — Química / Dermocosmética.
- [12 · María Pedreira Pernas](12-maria-pedreira-pernas.md) — Enfermería de urgencias.
- [13 · Miguel Ángel Vega Maqueda](13-miguel-angel-vega-maqueda.md) — Reproducción Asistida.
- [14 · Rosa Inmaculada Monje López](14-rosa-inmaculada-monje-lopez.md) — Nutrición.
- [15 · Rubén Broncano Martínez](15-ruben-broncano-martinez.md) — Psicología y psicoanálisis. Autor.
- [16 · Susana Lucas Ballesteros](16-susana-lucas-ballesteros.md) — Wellness, reflexología.
- [17 · Yacnira Loreleis Martínez Bazán](17-yacnira-loreleis-martinez-bazan.md) — Anestesiología y Reanimación.

### Odontología (2)

- [18 · Dra. María Josep Albert López](18-dra-maria-josep-albert-lopez.md) — Periodoncia y Estética Facial. UCV.
- [19 · Luis David Romero García](19-luis-david-romero.md) — Odontología Forense.

---

## Observaciones y hallazgos

1. **Concentración en Medicina:** 15 de 19 directores (79%).
2. **Facultades sin director publicado:** Farmacia, Fisioterapia, Ingeniería, Negocios, Recursos Humanos, Veterinaria, Videojuegos. Los bloques existen en la web pero están vacíos.
3. **Códigos faltantes en la numeración interna:** Los `PROF-*` saltan números (no se ven 0001, 0002, 0012) — posibles perfiles en borrador no publicados aún.
4. **Perfil con encaje atípico:** María Dolores Flores Romero (#11) tiene perfil químico/docente y está ubicada en Facultad de Medicina por su área (dermocosmética). Encaje correcto pero atípico.

### Estado de fichas previamente pendientes (resueltas el 2026-05-19)

- **#08 Julia Bovis Benavides:** ficha completada con información ampliada provista por ISEIE. Óptico-Optometrista por la Universidad de Alicante, 10+ años de experiencia, Directora Técnica de Multiópticas Bovis Vision, especialista en contactología avanzada (esclerales, multifocales, ortoqueratología) y control de miopía (MiSight 1 day de Coopervision). Voluntariado en Fundación Jorge Alió.
- **#10 Luz Marina Zuluaga Ríos:** bio confirmada por ISEIE. El encaje entre su perfil clínico (cirugía pie diabético, vascular, adultos) y el Curso de Podología Pediátrica que dirige es una decisión académica de ISEIE y queda como está.

---

## Notas sobre los CVs

- Los datos provienen del endpoint público de ISEIE y, en los dos casos indicados, de información ampliada provista directamente por ISEIE. **No se ha inventado información.**
- Campos no derivables del bio (email, teléfono, dirección, fechas exactas de ciertos roles) se marcan como pendientes en lugar de inventarlos.
- Inferencias de idiomas (catalán, gallego, valenciano) están marcadas explícitamente como "probable" con su razón.
- Cada archivo incluye el código interno de profesor de ISEIE (`PROF-XXXX`) por trazabilidad.

---

## Despliegue a YourCVPassport

La carga a la base de datos se realiza mediante la migración SQL:

- [`supabase/migrations/20260519_seed_iseie_directors.sql`](../supabase/migrations/20260519_seed_iseie_directors.sql)

Sigue el mismo patrón del seed de PsikoAprende. Antes de ejecutarla:

1. Crear los 19 `auth.users` en el dashboard de Supabase con emails tipo `<slug>@iseie.com`.
2. Reemplazar los 19 UUID placeholders (`p1`..`p19`) en el bloque `DECLARE` del SQL con los UUIDs reales de Supabase.
3. Ejecutar la migración (`supabase db push` o desde el SQL Editor).
