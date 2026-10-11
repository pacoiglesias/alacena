import React, { useState } from 'react';
import { History, ShieldCheck, User, Calendar, Filter, Clock } from 'lucide-react';

export default function AuditTrailView({ logs }) {
  const [filterStaff, setFilterStaff] = useState('ALL');

  const staffNames = Array.from(new Set(logs.map((l) => l.staff)));

  const filteredLogs = logs.filter((l) => {
    if (filterStaff !== 'ALL' && l.staff !== filterStaff) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-blue-500/15 border border-blue-500/25 text-blue-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Bitácora Forense de Auditoría (Audit Log)
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Registro inmutable de quién consumió qué insumo, quién ingresó compras y qué platillo se preparó.
            </p>
          </div>
        </div>

        {/* Staff filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold">Personal:</span>
          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#1E293B] border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Todo el Personal</option>
            {staffNames.map((name, i) => (
              <option key={i} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Timeline */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">
            No hay registros de auditoría para el filtro seleccionado.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const date = new Date(log.timestamp);
              const formattedDate = date.toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              const formattedTime = date.toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white/5 text-blue-400 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {log.staff}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {log.action}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mt-1 font-medium">
                        {log.description}
                      </p>
                      {log.details && (
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono shrink-0">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span>{formattedDate} • {formattedTime}</span>
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
