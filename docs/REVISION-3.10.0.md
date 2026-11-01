# Revisión integral de ALACENA · vista previa 3.10.0

Base: `305a0df`, versión 3.9.5. Rama: `codex/revision-integral-3-10`. No publicar en Firebase sin aprobación. No modificar reglas, Storage ni Functions. Los directorios locales `output/` y `tmp/` son ajenos a esta revisión.

## Diagnóstico reproducido antes de corregir

`node frontend/review/reproduce-baseline.mjs` ejecuta los manejadores originales en una máquina virtual sin red y con datos sintéticos:

| Hallazgo | Resultado observado en la base |
| --- | --- |
| Cocina: porciones | La vista evalúa porciones escaladas pero entrega la receta base al manejador. |
| Cocina: casas | Arroz con 10 kg en dos casas termina en 9 kg en ambas al consumir 1 kg en una casa. |
| Cocina: equivalencia | «cafe» no descuenta «Café». |
| Cocina: nube | Cero llamadas de escritura de productos. |
| Ticket masivo | Escritura de cantidad absoluta, sin delta. |
| Historial | 35 documentos del servidor producen sólo 30 elementos visibles. |
| Respaldo | Existe exportación pero no manejador de restauración. |
| Nube vacía | Un producto local pasa a cero filas visibles al recibir el primer resultado vacío del servidor. |
| Demo | No hay guardia de casa conectada. |

Otros diagnósticos: el acceso ya captura errores de Firebase, pero su mensaje es genérico y una promesa pendiente no tiene plazo; no se puede atribuir todo bloqueo a cerrar la ventana. La bitácora no ejecuta verificación SHA-256 y también presenta hashes de adorno para registros sin firma: no basta con ocultar el sello cuando está vacía. El asistente supone un ritmo semanal cuando no hay historial. Las pestañas de cava y zonas no tienen callbacks conectados desde App.

## Entrega

Pendiente completar implementación, mediciones comparables, pruebas, capturas y vista previa. Los resultados finales y límites se registrarán aquí antes de entregar la rama.
