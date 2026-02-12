# 📋 Mapping UUID-Email-Especialidad - Tutores ISEIH

**Fecha actualización**: 2026-02-12
**Total tutores**: ~40
**Propósito**: Referencia rápida para verificar UUIDs correctos

---

## ✅ UUIDs CORREGIDOS (Críticos)

| Nombre | Email | UUID | Especialidad | Status |
|--------|-------|------|--------------|--------|
| **Michelle Chang** | michelle.chang@iseih.edu | `7fe0c1a6-39ed-46ad-9388-116a3a0fb429` | Reiki & Energy Work | ✅ **CREADO** |
| **Nicole Taylor** | nicole.taylor@iseih.edu | `1b90b431-de09-4b75-af6a-c94975b68746` | Dance/Movement Therapy | ✅ **CREADO** |

---

## 📝 Tutores ISEIH con UUIDs Conocidos

### Nuevos Tutores (10 creados recientemente)

| Nombre | Email | Especialidad | Script |
|--------|-------|--------------|--------|
| Rebecca Anderson | rebecca.anderson@iseih.edu | Naturopathy | create-missing-iseih-tutors.sql |
| Karen White | karen.white@iseih.edu | Holistic Nutrition | create-missing-iseih-tutors.sql |
| Paul Henderson | paul.henderson@iseih.edu | Herbal Medicine | create-missing-iseih-tutors.sql |
| Jessica Porter | jessica.porter@iseih.edu | Biofeedback Technology | create-missing-iseih-tutors-part2.sql |
| Alex Martinez | alex.martinez@iseih.edu | AI in Health | create-missing-iseih-tutors-part2.sql |
| Diana Russell | diana.russell@iseih.edu | Massage Therapy | create-missing-iseih-tutors-part2.sql |
| Michelle Chang | michelle.chang@iseih.edu | Reiki & Energy Work | FIX-michelle-chang-uuid-CORRECTED.sql |
| Robert Kim | robert.kim@iseih.edu | Acupressure | create-missing-iseih-tutors-part3.sql |
| Catherine Adams | catherine.adams@iseih.edu | Couples Therapy | create-missing-iseih-tutors-part3.sql |
| Mark Davidson | mark.davidson@iseih.edu | Nonviolent Communication | create-missing-iseih-tutors-part3.sql |

### Tutores Existentes (según PROFILE-QUALITY-REPORT.md)

| Nombre | Email | Especialidad |
|--------|-------|--------------|
| Amanda Rodriguez | amanda.rodriguez@iseih.edu | Conscious Leadership |
| Angela Roberts | angela.roberts@iseih.edu | Personal Growth/Life Coaching |
| Brian Cooper | brian.cooper@iseih.edu | Energy Psychology |
| Christopher Barnes | christopher.barnes@iseih.edu | Movement Therapies |
| Daniel Foster | daniel.foster@iseih.edu | Data Analysis |
| David Chen | david.chen@iseih.edu | Mindful Eating |
| Elizabeth Morgan | elizabeth.morgan@iseih.edu | End-of-Life Care |
| Emily Harper | emily.harper@iseih.edu | Ecopsychology |
| James Wilson | james.wilson@iseih.edu | Emotional Education |
| Janet Lee | janet.lee@iseih.edu | Elder Care / Gerontological Social Work |
| Jennifer Martinez | jennifer.martinez@iseih.edu | Family Therapy |
| Kevin Park | kevin.park@iseih.edu | Conscious Entrepreneurship |
| Linda Zhang | linda.zhang@iseih.edu | Traditional Chinese Medicine / Acupuncture |
| Lisa Morrison | lisa.morrison@iseih.edu | Art Therapy |
| Marcus Williams | marcus.williams@iseih.edu | Drama Therapy |
| Margaret Sullivan | margaret.sullivan@iseih.edu | Contemplative Practices |
| Maria Gonzalez | maria.gonzalez@iseih.edu | Family & Cultural Therapy |
| Michael Thompson | michael.thompson@iseih.edu | Addictions & Recovery |
| Nicole Taylor | nicole.taylor@iseih.edu | Dance Therapy |
| Patricia Coleman | patricia.coleman@iseih.edu | Research Methodology |
| Priya Sharma | priya.sharma@iseih.edu | Ayurveda |
| Rachel Stevens | rachel.stevens@iseih.edu | Holistic Nutrition |
| Richard Hamilton | richard.hamilton@iseih.edu | Grief Counseling |
| Robert Green | robert.green@iseih.edu | Sustainable Living |
| Sarah Bennett | sarah.bennett@iseih.edu | Alternative Pedagogy |
| Steven Mitchell | steven.mitchell@iseih.edu | Transpersonal Psychology |
| Thomas Rivera | thomas.rivera@iseih.edu | Perennial Philosophies |

---

## ⚠️ Perfiles NO ISEIH (Ocultos/Archivados)

| Nombre | Email | Status |
|--------|-------|--------|
| Carlos Saiz | carlos.saiz@... | ❌ OCULTADO (role = 'archived') |
| Javier Torres Gimeno | javier.torres@... | ⚠️ No es tutor ISEIH |
| Laura Martínez Vidal | laura.martinez@... | ⚠️ No es tutor ISEIH |
| Marta Ruiz Serrano | marta.ruiz@... | ⚠️ No es tutor ISEIH |

---

## 🔍 Cómo Usar Este Documento

### Verificar UUID correcto de un tutor:
1. Buscar nombre del tutor en la tabla
2. Verificar que el UUID en base de datos coincida
3. Si no coincide, ejecutar script de corrección

### Detectar perfiles duplicados:
```sql
-- Ejecutar para ver duplicados
SELECT email, COUNT(*)
FROM profiles
WHERE role = 'professional'
GROUP BY email
HAVING COUNT(*) > 1;
```

### Validar coherencia completa:
```sql
-- Ejecutar script de validación
\i scripts/sql/validate-all-tutors-content-consistency.sql
```

---

## 📌 Notas Importantes

1. **Michelle Chang**: UUID `7fe0c1a6-39ed-46ad-9388-116a3a0fb429` (creado limpio)
2. **Nicole Taylor**: UUID `1b90b431-de09-4b75-af6a-c94975b68746` (creado limpio)
3. **Slugs únicos**: Cada tutor debe tener slug único (formato: `nombre-apellido`)
4. **Template**: Todos los tutores ISEIH usan `template = 'passport'`

---

## 🛠️ Scripts de Mantenimiento

- **Creación Michelle Chang**: `CREATE-michelle-chang-LIMPIO.sql`
- **Creación Nicole Taylor**: `CREATE-nicole-taylor-LIMPIO.sql`
- **Validación completa**: `validate-all-tutors-content-consistency.sql`
- **Extender headlines**: `fix-headlines-cortos.sql`
- **Verificar fotos faltantes**: `check-tutors-missing-photos.sql`
- **Actualizar foto de tutor**: `update-tutor-photo.sql`

---

**Última verificación**: 2026-02-12
**Ejecutar validación**: `\i scripts/sql/validate-all-tutors-content-consistency.sql`
