-- =====================================================
-- SETUP: Módulo de Hojas de Trabajo (Work Sheets)
-- =====================================================
-- Este archivo contiene todas las instrucciones SQL necesarias
-- para configurar el módulo de Hojas de Trabajo en Supabase.
--
-- Ejecutar en el SQL Editor de Supabase en este orden:
-- 1. Crear tabla work_sheets
-- 2. Agregar columna a work_orders
-- 3. Crear políticas RLS
-- 4. Crear bucket de Storage
-- 5. Crear políticas de Storage
-- =====================================================

-- =====================================================
-- 1. CREAR TABLA work_sheets
-- =====================================================

CREATE TABLE IF NOT EXISTS work_sheets (
  -- Identificadores
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,

  -- Datos del servicio (algunos pre-llenados de OT)
  responsable TEXT NOT NULL,
  destino TEXT,
  acompanante_1 TEXT,
  acompanante_2 TEXT,
  cliente TEXT NOT NULL,
  permiso_viaje BOOLEAN DEFAULT false,
  area_ejecucion TEXT,
  fecha_servicio DATE NOT NULL,
  descripcion_servicio TEXT,

  -- Planificación del servicio (checkboxes)
  -- Estructura: {"checkList": true, "permisoViaje": false, ...}
  planificacion JSONB DEFAULT '{}'::jsonb,

  -- Tareas realizadas (tabla dinámica)
  -- Estructura: [{"numero": 1, "detalle": "...", "responsable": "..."}, ...]
  tareas_realizadas JSONB DEFAULT '[]'::jsonb,

  -- Riesgos identificados (checkboxes)
  -- Estructura: {"atrapamiento": false, "caidasMismoNivel": true, ...}
  riesgos JSONB DEFAULT '{}'::jsonb,

  -- Descripción y evaluación
  observaciones_ejecucion TEXT,

  -- Firmas digitales (Base64 PNG)
  firma_tecnico TEXT, -- Data URL de la firma
  firma_cliente TEXT, -- Data URL de la firma
  nombre_tecnico TEXT,
  nombre_cliente TEXT,
  fecha_firma DATE DEFAULT CURRENT_DATE,

  -- PDF generado
  pdf_url TEXT, -- URL del PDF en Supabase Storage

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Restricciones
  CONSTRAINT unique_work_order UNIQUE(work_order_id)
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_work_sheets_wo ON work_sheets(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_sheets_created ON work_sheets(created_at DESC);

-- Comentarios en la tabla
COMMENT ON TABLE work_sheets IS 'Hojas de trabajo detalladas completadas por técnicos al cerrar OTs';
COMMENT ON COLUMN work_sheets.planificacion IS 'Checkboxes de planificación del servicio (JSONB)';
COMMENT ON COLUMN work_sheets.tareas_realizadas IS 'Lista de tareas realizadas con detalle y responsable (JSONB)';
COMMENT ON COLUMN work_sheets.riesgos IS 'Checkboxes de riesgos identificados (JSONB)';
COMMENT ON COLUMN work_sheets.firma_tecnico IS 'Firma digital del técnico en formato Base64 PNG';
COMMENT ON COLUMN work_sheets.firma_cliente IS 'Firma digital del cliente en formato Base64 PNG';
COMMENT ON COLUMN work_sheets.pdf_url IS 'URL pública del PDF generado en Supabase Storage';

-- =====================================================
-- 2. ACTUALIZAR TABLA work_orders
-- =====================================================

-- Agregar columna para tracking de hoja de trabajo completada
ALTER TABLE work_orders
ADD COLUMN IF NOT EXISTS work_sheet_completed BOOLEAN DEFAULT false;

COMMENT ON COLUMN work_orders.work_sheet_completed IS 'Indica si la hoja de trabajo fue llenada para esta OT';

-- =====================================================
-- 3. POLÍTICAS RLS PARA work_sheets
-- =====================================================

-- Habilitar RLS en la tabla
ALTER TABLE work_sheets ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas si ya existen (para evitar errores)
DROP POLICY IF EXISTS "work_sheets_select" ON work_sheets;
DROP POLICY IF EXISTS "work_sheets_insert" ON work_sheets;
DROP POLICY IF EXISTS "work_sheets_update" ON work_sheets;
DROP POLICY IF EXISTS "work_sheets_delete" ON work_sheets;

-- Política: Ver hojas de trabajo
-- ADMIN y PLANNER pueden ver todas
-- TECH solo ve las de sus OTs asignadas
CREATE POLICY "work_sheets_select" ON work_sheets
  FOR SELECT USING (
    (auth.jwt() ->> 'role') IN ('ADMIN', 'PLANNER')
    OR (
      (auth.jwt() ->> 'role') = 'TECH'
      AND work_order_id IN (
        SELECT id FROM work_orders
        WHERE (auth.jwt() ->> 'email') = ANY(asignados)
      )
    )
  );

-- Política: Crear hojas de trabajo
-- ADMIN, PLANNER y TECH pueden crear
CREATE POLICY "work_sheets_insert" ON work_sheets
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'role') IN ('ADMIN', 'PLANNER', 'TECH')
  );

-- Política: Actualizar hojas de trabajo
-- ADMIN y PLANNER pueden actualizar cualquiera
-- TECH solo puede actualizar las de sus OTs asignadas
CREATE POLICY "work_sheets_update" ON work_sheets
  FOR UPDATE USING (
    (auth.jwt() ->> 'role') IN ('ADMIN', 'PLANNER')
    OR (
      (auth.jwt() ->> 'role') = 'TECH'
      AND work_order_id IN (
        SELECT id FROM work_orders
        WHERE (auth.jwt() ->> 'email') = ANY(asignados)
      )
    )
  );

-- Política: Eliminar hojas de trabajo
-- Solo ADMIN puede eliminar
CREATE POLICY "work_sheets_delete" ON work_sheets
  FOR DELETE USING (
    (auth.jwt() ->> 'role') = 'ADMIN'
  );

-- =====================================================
-- 4. CREAR BUCKET DE STORAGE
-- =====================================================

-- Crear bucket público para PDFs de hojas de trabajo
-- NOTA: Ejecutar esto en la sección de Storage si aún no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('work-sheets', 'work-sheets', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. POLÍTICAS DE STORAGE
-- =====================================================

-- Eliminar políticas de storage si ya existen
DROP POLICY IF EXISTS "work_sheets_upload" ON storage.objects;
DROP POLICY IF EXISTS "work_sheets_read" ON storage.objects;
DROP POLICY IF EXISTS "work_sheets_update_storage" ON storage.objects;
DROP POLICY IF EXISTS "work_sheets_delete_storage" ON storage.objects;

-- Política: Subir archivos al bucket
-- ADMIN, PLANNER y TECH pueden subir PDFs
CREATE POLICY "work_sheets_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'work-sheets'
    AND (auth.jwt() ->> 'role') IN ('ADMIN', 'PLANNER', 'TECH')
  );

-- Política: Leer archivos del bucket
-- Todos los usuarios autenticados pueden leer (bucket público)
CREATE POLICY "work_sheets_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'work-sheets'
  );

-- Política: Actualizar archivos (reemplazar PDFs)
-- ADMIN puede actualizar cualquier archivo
-- TECH puede actualizar solo si es de su OT
CREATE POLICY "work_sheets_update_storage" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'work-sheets'
    AND (auth.jwt() ->> 'role') IN ('ADMIN', 'PLANNER')
  );

-- Política: Eliminar archivos
-- Solo ADMIN puede eliminar PDFs
CREATE POLICY "work_sheets_delete_storage" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'work-sheets'
    AND (auth.jwt() ->> 'role') = 'ADMIN'
  );

-- =====================================================
-- 6. FUNCIÓN TRIGGER PARA ACTUALIZAR updated_at
-- =====================================================

-- Función para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_work_sheets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que ejecuta la función antes de cada UPDATE
CREATE TRIGGER work_sheets_updated_at_trigger
BEFORE UPDATE ON work_sheets
FOR EACH ROW
EXECUTE FUNCTION update_work_sheets_updated_at();

-- =====================================================
-- 7. VERIFICACIÓN
-- =====================================================

-- Consultar si todo se creó correctamente:

-- Verificar tabla
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'work_sheets'
ORDER BY ordinal_position;

-- Verificar políticas
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'work_sheets';

-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'work-sheets';

-- =====================================================
-- FIN DEL SETUP
-- =====================================================
-- Ahora puedes usar el módulo de Hojas de Trabajo
-- en tu aplicación React.
-- =====================================================
