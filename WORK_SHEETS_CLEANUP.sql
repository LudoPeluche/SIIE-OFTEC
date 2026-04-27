-- =====================================================
-- CLEANUP: Eliminar políticas y objetos existentes
-- =====================================================
-- Ejecuta este script SOLO si necesitas limpiar
-- las políticas anteriores antes de volver a crearlas
-- =====================================================

-- Eliminar políticas RLS de work_sheets (si existen)
DROP POLICY IF EXISTS "work_sheets_select" ON work_sheets;
DROP POLICY IF EXISTS "work_sheets_insert" ON work_sheets;
DROP POLICY IF EXISTS "work_sheets_update" ON work_sheets;
DROP POLICY IF EXISTS "work_sheets_delete" ON work_sheets;

-- Eliminar políticas de Storage (si existen)
DROP POLICY IF EXISTS "work_sheets_upload" ON storage.objects;
DROP POLICY IF EXISTS "work_sheets_read" ON storage.objects;
DROP POLICY IF EXISTS "work_sheets_update_storage" ON storage.objects;
DROP POLICY IF EXISTS "work_sheets_delete_storage" ON storage.objects;

-- =====================================================
-- FIN DEL CLEANUP
-- =====================================================
-- Ahora puedes ejecutar WORK_SHEETS_SETUP.sql de nuevo
-- =====================================================
