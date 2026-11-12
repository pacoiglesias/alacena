import React, { useState } from 'react';
import {
  History, ShoppingCart, Wine, Utensils, Pencil, Trash2,
  FileText
} from 'lucide-react';
import { audio } from '../../services/audioService';

// Formato de tiempo relativo en español
function getRelativeTime(timestamp) {
  if (!timestamp) return 'reciente';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return 'hace un momento';
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `hace ${diffDays} d`;
}

// 3.14.0 (B-6): la bitácora es para la casa, no para un auditor de
// sistemas — las acciones se enseñan con su nombre humano, nunca con
// el código crudo (BAJA_ARTICULO y familia). Un código nuevo que aún
// no esté en el mapa se humaniza (guiones bajos fuera), jamás se
// muestra tal cual.
const ACTION_LABELS = {
  ALTA_MANUAL: 'Alta manual',
  ALTA_PRODUCTO_ESCANEO: 'Alta por escaneo',
  MODIFICACION_ARTICULO: 'Artículo modificado',
  BAJA_ARTICULO: 'Baja de artículo',
  INCREMENTO_STOCK: 'Entrada de stock',
  CONSUMO_STOCK: 'Consumo',
  INGRESO_MANUAL: 'Ingreso manual',
  INGRESO_DIRECTO: 'Ingreso directo',
  INGRESO_COMPRA_SUPER: 'Compra guardada en despensa',
  INGRESO_TICKET_DESPENSA: 'Ticket guardado en despensa',
  DEVOLUCION_COMPRA: 'Devolución de compra',
  DESCORCHE_VINO: 'Descorche',
  CALIFICACION_VINO: 'Calificación de vino',
  CONSUMO_RECETA: 'Receta cocinada',
  ALTA_RECETA: 'Receta creada',
  EDICION_RECETA: 'Receta editada',
  ELIMINACION_RECETA: 'Receta eliminada',
  CREACION_ZONA: 'Zona creada',
  EDICION_ZONA: 'Zona editada',
  ELIMINACION_ZONA: 'Zona eliminada',
  AJUSTE_ZONA: 'Ajuste de zona',
  RESTAURACION_RESPALDO: 'Respaldo restaurado',
  RESTAURACION_ARTICULO: 'Artículo restaurado',
  RESTAURACION_RECETA: 'Receta restaurada',
};

export function humanActionLabel(action) {
  if (!action) return '';
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  const humanized = String(action).replace(/_/g, ' ').toLowerCase();
  return humanized.charAt(0).toUpperCase() + humanized.slice(1);
}

// Configuración de icono y color por tipo de acción (Fase 8.8)
function getActionConfig(action = '') {
  const a = action.toLowerCase();
  if (a.includes('compra') || a.includes('recepción') || a.includes('ingreso') || a.includes('súper')) {
    return {
      icon: ShoppingCart,
      color: '#E5724A', // --accent-super
      bg: 'rgba(229, 114, 74, 0.15)',
      border: 'rgba(229, 114, 74, 0.4)',
      label: 'Compra / Súper'
    };
  }
  if (a.includes('descorche') || a.includes('vino') || a.includes('cata')) {
    return {
      icon: Wine,
      color: '#A83A50', // --accent-cava
      bg: 'rgba(168, 58, 80, 0.15)',
      border: 'rgba(168, 58, 80, 0.4)',
      label: 'Descorche'
    };
  }
  if (a.includes('cocina') || a.includes('receta') || a.includes('preparación')) {
    return {
      icon: Utensils,
      color: '#E0B441', // --accent-cocina
      bg: 'rgba(224, 180, 65, 0.15)',
      border: 'rgba(224, 180, 65, 0.4)',
      label: 'Cocina'
    };
  }
  if (a.includes('elimin') || a.includes('borr')) {
    return {
      icon: Trash2,
      color: '#B33A3A', // --danger
      bg: 'rgba(179, 58, 58, 0.15)',
      border: 'rgba(179, 58, 58, 0.4)',
      label: 'Eliminación'
    };
  }
  // Por defecto: Edición / Auditoría
  return {
    icon: Pencil,
    color: '#5C8894', // --accent-audit
    bg: 'rgba(92, 136, 148, 0.15)',
    border: 'rgba(92, 136, 148, 0.4)',
    label: 'Edición'
  };
}

export default function AuditTrailView({ logs = [] }) {
  const [filterStaff, setFilterStaff] = useState('ALL');

  const staffNames = Array.from(new Set(logs.map((l) => l.staff).filter(Boolean)));

  const filteredLogs = logs.filter((l) => {
    if (filterStaff !== 'ALL' && l.staff !== filterStaff) return false;
    return true;
  });

  // 3.14.0: el botón imprime la vista (window.print) — se llama
  // «Imprimir», sin prometer un PDF firmado que no existe.
  const handlePrint = () => {
    audio.success();
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Encabezado — 3.14.0 (B-6): «Bitácora» a secas y un conteo
          simple; fuera el banner de integridad criptográfica. */}
      <div className="card-luxe p-6 border border-[var(--border-soft)] bg-[var(--bg-elevated)] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-audit)]/15 border border-[var(--accent-audit)]/30 flex items-center justify-center text-[var(--accent-audit)] shadow-md">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-white tracking-tight">
                Bitácora
              </h2>
              <p className="text-xs text-[var(--ink-tertiary)] mt-0.5">
                Historial de movimientos, consumos y descorches de esta casa.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtro de Personal */}
            <div className="flex items-center gap-2">
              <select
                value={filterStaff}
                onChange={(e) => setFilterStaff(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white text-xs font-semibold focus:outline-none focus:border-[var(--accent-audit)]"
              >
                <option value="ALL">Todo el Personal</option>
                {staffNames.map((name, i) => (
                  <option key={i} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Imprimir la vista */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-base)] hover:bg-[var(--border-soft)] border border-[var(--border-strong)] text-xs font-bold text-[var(--ink-primary)] transition-all"
              title="Imprimir la bitácora"
            >
              <FileText className="w-4 h-4 text-[var(--accent-audit)]" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </div>

        {/* Conteo simple de movimientos */}
        <div className="p-3.5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-soft)] flex flex-wrap items-center gap-3 text-xs">
          <History className="w-4 h-4 text-[var(--ink-secondary)] shrink-0" />
          <span className="text-[var(--ink-primary)] font-medium">
            {logs.length
              ? `${logs.length} ${logs.length === 1 ? 'movimiento registrado' : 'movimientos registrados'} en esta casa.`
              : 'Sin movimientos todavía.'}
          </span>
        </div>
      </div>

      {/* 2. Timeline Visual (NO Tabla - Fase 8.8) */}
      <div className="card-luxe p-6 border border-[var(--border-soft)] bg-[var(--bg-elevated)]">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[var(--border-strong)] rounded-3xl bg-[var(--bg-base)]/40 p-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-[var(--accent-audit)]/15 border border-[var(--accent-audit)]/30 flex items-center justify-center text-[var(--accent-audit)]">
              <History className="w-8 h-8" />
            </div>
            <h4 className="font-display text-xl font-bold text-white">
              La historia comienza con tu primera acción.
            </h4>
            <p className="text-xs text-[var(--ink-tertiary)] mt-1.5 max-w-sm mx-auto">
              Cada consumo, ingreso de compra, cocción o descorche aparecerá aquí como movimiento.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-[var(--border-soft)]">
            {filteredLogs.map((log) => {
              const relativeTime = getRelativeTime(log.timestamp);
              const config = getActionConfig(log.action);
              const ActionIcon = config.icon;

              return (
                <div key={log.id} className="relative group">

                  {/* Nodo Circular con Icono Según Acción */}
                  <div
                    className="absolute -left-[30px] sm:-left-[35px] top-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-md border"
                    style={{
                      backgroundColor: config.bg,
                      borderColor: config.border,
                      color: config.color,
                    }}
                  >
                    <ActionIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>

                  {/* Tarjeta de Entrada de la Bitácora */}
                  <div className="rounded-2xl bg-[var(--bg-base)] border border-[var(--border-soft)] hover:border-[var(--border-strong)] p-4 transition-all space-y-2">

                    {/* Encabezado: Actor + tipo de movimiento + hora */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-white">
                          {log.staff || 'Sin registrar'}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold border"
                          style={{
                            backgroundColor: config.bg,
                            borderColor: config.border,
                            color: config.color,
                          }}
                        >
                          {humanActionLabel(log.action) || config.label}
                        </span>
                      </div>

                      <span className="text-xs text-[var(--ink-tertiary)]">
                        {relativeTime}
                      </span>
                    </div>

                    {/* Descripción Principal */}
                    <p className="text-xs text-[var(--ink-primary)] font-medium leading-relaxed">
                      {log.description}
                    </p>

                    {/* Detalle o Notas */}
                    {log.details && (
                      <p className="text-[11px] text-[var(--ink-secondary)] bg-[var(--bg-elevated)] p-2.5 rounded-xl border border-[var(--border-soft)]">
                        {log.details}
                      </p>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
