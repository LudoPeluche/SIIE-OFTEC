
# ESTATUS

## Progreso al 2025-12-18
- Roles mock: jefe/planner/t?cnico en TopBar con persistencia.
- OT: asignaci?n de t?cnicos/prioridad/compromiso, vista de pendientes del t?cnico, filtros/b?squeda, modal de detalle, confirmaci?n al borrar, responsive cards, skeletons, toasts, y cierre con datos reales (fechas reales, horas reales/extra, gastos, observaciones de cierre).
- Plan Semanal: asignaci?n de t?cnicos, vista de pendientes del t?cnico, importar CSV, drag-and-drop/reorder, botones crear OT desde fila, responsive cards, skeletons, y migraci?n de t?cnicos alineada.
- Puerto fijado en 5173; renombrado a SIIE-OFTEC en t?tulo/manifest.

## Pendientes (frontend)
1) Pulir UX accesible y toasts en Plan Semanal; loader/feedback coherente en todo.
2) Vista de detalle OT m?s completa (adjuntos/fotos, resumen horas programadas vs reales, bit?cora).
3) KPIs: c?lculo de horas productivas vs programadas usando horas reales capturadas al cierre.
4) Endurecer restricciones de rol en UI (ocultar/inhabilitar acciones no permitidas en m?s lugares).
5) Afinar estilos m?viles y estados vac?os; botones de reorden m?s compactos.

## C?mo correr en local
1) npm install
2) npm run dev
3) abrir http://localhost:5173
