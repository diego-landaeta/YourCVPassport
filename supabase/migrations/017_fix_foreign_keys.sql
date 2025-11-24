-- =============================================
-- Arreglar Foreign Keys entre messages y leads
-- =============================================

-- PASO 1: Eliminar foreign key existente si hay
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Buscar y eliminar constraints de foreign key en messages.lead_id
    FOR constraint_name IN
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_schema = 'public'
        AND tc.table_name = 'messages'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.column_name = 'lead_id'
    LOOP
        EXECUTE format('ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Constraint eliminado: %', constraint_name;
    END LOOP;
END $$;

-- PASO 2: Eliminar mensajes huérfanos (que no tienen lead correspondiente)
DELETE FROM public.messages m
WHERE NOT EXISTS (
    SELECT 1 FROM public.leads l WHERE l.id = m.lead_id
);

-- PASO 3: Recrear la foreign key correctamente
DO $$
BEGIN
    -- Solo agregar si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'messages_lead_id_fkey'
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE public.messages
        ADD CONSTRAINT messages_lead_id_fkey
        FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;
        RAISE NOTICE 'Foreign key creada';
    ELSE
        RAISE NOTICE 'Foreign key ya existe';
    END IF;
END $$;

-- PASO 4: Verificar que la relación funciona
SELECT
    '✅ FOREIGN KEY CREADA' as status,
    COUNT(*) as total_messages_con_lead_valido
FROM public.messages m
INNER JOIN public.leads l ON l.id = m.lead_id;

-- PASO 5: Verificar estado final
SELECT
    '📊 ESTADO FINAL' as status,
    (SELECT COUNT(*) FROM public.leads) as total_leads,
    (SELECT COUNT(*) FROM public.messages) as total_messages,
    (SELECT COUNT(*) FROM public.messages m
     WHERE EXISTS (SELECT 1 FROM public.leads l WHERE l.id = m.lead_id)) as messages_validos;
