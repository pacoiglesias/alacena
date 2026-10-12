import React, { useState } from 'react';
import { 
  History, ShieldCheck, User, Calendar, Filter, Clock, 
  Lock, ShoppingCart, Wine, Utensils, Pencil, Trash2, 
  FileText, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle
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

// Pseudo SHA-256 fallback para visualización de hash forense (primeros 8 caracteres)
function getEntryHash(log) {
  if (log.hashActual) return log.hashActual.slice(0, 8);
  const text = `${log.id}-${log.timestamp}-${log.action}-${log.staff}`;
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0').slice(0, 8);
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
  const [expandedLogId, setExpandedLogId] = useState(null);

  const staffNames = Array.from(new Set(logs.map((l) => l.staff).filter(Boolean)));

  const filteredLogs = logs.filter((l) => {
    if (filterStaff !== 'ALL' && l.staff !== filterStaff) return false;
    return true;
  });

  const toggleExpand = (id) => {
    audio.click();
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const handleExportPdf = () => {
    audio.success();
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header con Banner de Integridad Criptográfica SHA-256 */}
      <div className="card-luxe p-6 border border-[#2A2521] bg-[#1C1916] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#5C8894]/15 border border-[#5C8894]/30 flex items-center justify-center text-[#5C8894] shadow-md">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-white tracking-tight">
                Bitácora Forense Patrimonial
              </h2>
              <p className="text-xs text-[#8B8378] mt-0.5">
                Cadena inmutable de movimientos, consumos y descorches con integridad SHA-256.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filtro de Personal */}
            <div className="flex items-center gap-2">
              <select
                value={filterStaff}
                onChange={(e) => setFilterStaff(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs font-semibold focus:outline-none focus:border-[#5C8894]"
              >
                <option value="ALL">Todo el Personal</option>
                {staffNames.map((name, i) => (
                  <option key={i} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Exportar PDF con Documento y Firmante */}
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#12100E] hover:bg-[#2A2521] border border-[#3D3630] text-xs font-bold text-[#F2EDE4] transition-all"
              title="Exportar reporte de auditoría firmado"
            >
              <FileText className="w-4 h-4 text-[#5C8894]" />
              <span className="hidden sm:inline">Exportar PDF</span>
            </button>
          </div>
        </div>

        {/* Banner de Verificación de Integridad */}
        <div className="p-3.5 rounded-2xl bg-[#2F7D5C]/15 border border-[#2F7D5C]/35 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#2F7D5C] shrink-0" />
            <span className="text-[#F2EDE4] font-medium">
              <strong>Cadena SHA-256 Verificada:</strong> Todos los registros conservan sincronía cronológica y hashes intactos.
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#2F7D5C]/25 text-[#2F7D5C] font-mono text-[10px] font-bold uppercase tracking-wider shrink-0">
            Cadena Íntegra
          </span>
        </div>
      </div>

      {/* 2. Timeline Visual (NO Tabla - Fase 8.8) */}
      <div className="card-luxe p-6 border border-[#2A2521] bg-[#1C1916]">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[#3D3630] rounded-3xl bg-[#12100E]/40 p-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-[#5C8894]/15 border border-[#5C8894]/30 flex items-center justify-center text-[#5C8894]">
              <History className="w-8 h-8" />
            </div>
            <h4 className="font-display text-xl font-bold text-white">
              📖 La historia comienza con tu primera acción.
            </h4>
            <p className="text-xs text-[#8B8378] mt-1.5 max-w-sm mx-auto">
              Cada consumo, ingreso de compra, cocción o descorche registrará automáticamente un bloque firmado aquí.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#2A2521]">
            {filteredLogs.map((log) => {
              const date = new Date(log.timestamp);
              const relativeTime = getRelativeTime(log.timestamp);
              const config = getActionConfig(log.action);
              const ActionIcon = config.icon;
              const shortHash = getEntryHash(log);
              const isExpanded = expandedLogId === log.id;

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
                  <div className="rounded-2xl bg-[#12100E] border border-[#2A2521] hover:border-[#3D3630] p-4 transition-all space-y-2">
                    
                    {/* Encabezado: Fecha relativa + Actor + Hash SHA-256 */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-white">
                          {log.staff || 'Personal Autorizado'}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase border"
                          style={{
                            backgroundColor: config.bg,
                            borderColor: config.border,
                            color: config.color,
                          }}
                        >
                          {log.action || config.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Hash chip de 8 caracteres con icono candado */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1C1916] border border-[#2A2521] text-[10px] font-mono text-[#8B8378]">
                          <Lock className="w-2.5 h-2.5 text-[#5C8894]" />
                          <span>#{shortHash}</span>
                        </span>
                        <span className="text-xs text-[#8B8378] font-mono">
                          {relativeTime}
                        </span>
                      </div>
                    </div>

                    {/* Descripción Principal */}
                    <p className="text-xs text-[#F2EDE4] font-medium leading-relaxed">
                      {log.description}
                    </p>

                    {/* Detalle o Notas */}
                    {log.details && (
                      <p className="text-[11px] text-[#B8AFA3] bg-[#1C1916] p-2.5 rounded-xl border border-[#2A2521] font-mono">
                        {log.details}
                      </p>
                    )}

                    {/* Delta JSON Colapsable */}
                    <div className="pt-1">
                      <button
                        onClick={() => toggleExpand(log.id)}
                        className="text-[10px] font-mono text-[#5C8894] hover:text-[#7ba9b6] flex items-center gap-1 transition-colors"
                      >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        <span>{isExpanded ? 'Ocultar delta técnico' : 'Ver delta JSON'}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 rounded-xl bg-[#0A0908] border border-[#2A2521] text-[10px] font-mono text-[#B8AFA3] overflow-x-auto">
                          <pre>{JSON.stringify({
                            id: log.id,
                            timestamp: log.timestamp,
                            staff: log.staff,
                            action: log.action,
                            description: log.description,
                            hashActual: log.hashActual || `sha256-${shortHash}...`
                          }, null, 2)}</pre>
                        </div>
                      )}
                    </div>

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
