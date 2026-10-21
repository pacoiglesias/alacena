import React, { useState } from 'react';
import { 
  X, CheckCircle2, Sparkles, Volume2, VolumeX, ShieldCheck, 
  Terminal, History, Zap, Utensils, MapPin, DollarSign, ListOrdered, Check 
} from 'lucide-react';
import { audio } from '../../services/audioService';

export const SYSTEM_VERSION = 'v3.8.1-Casa';
export const RELEASE_DATE = '16 Octubre 2026';

export default function ChangelogModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('changelog'); // 'changelog' | 'plan30'
  const [isMuted, setIsMuted] = useState(audio.isMuted());

  if (!isOpen) return null;

  const handleToggleMute = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  const testAudio = (type) => {
    if (type === 'click') audio.click();
    if (type === 'success') audio.success();
    if (type === 'warning') audio.warning();
    if (type === 'cook') audio.cook();
    if (type === 'delete') audio.delete();
    if (type === 'super') audio.superCheck();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col rounded-3xl bg-[#1C1916] border border-[#3D3630] shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2A2521] bg-[#12100E]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#6B1F2E]/30 border border-[#A83A50]/40 text-[#E0B441]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white font-mono">{SYSTEM_VERSION}</h2>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-emerald-400 uppercase rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  Tu casa
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Versión del {RELEASE_DATE} · Lista, despensa y tickets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMute}
              className={`p-2 rounded-xl border transition-all ${
                isMuted 
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' 
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              }`}
              title={isMuted ? 'Activar Sonidos' : 'Silenciar Sonidos'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              onClick={() => {
                audio.click();
                onClose();
              }}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs inside modal */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-[#2A2521] bg-[#1C1916]">
          <button
            onClick={() => {
              audio.click();
              setActiveTab('changelog');
            }}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'changelog'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historial de Versiones</span>
          </button>
          <button
            onClick={() => {
              audio.click();
              setActiveTab('plan30');
            }}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'plan30'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Plan Maestro: 30 Mejoras por Etapas</span>
          </button>
        </div>

        {/* Audio Test Bench (Always accessible) */}
        <div className="p-3 mx-6 mt-4 rounded-2xl bg-[#12100E] border border-[#A83A50]/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-300 tracking-wider">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>BANCO DE PRUEBA DE AUDIO Y HÁPTICOS SENSORIALES</span>
            </div>
            <span className="text-[10px] text-amber-400 font-medium">Síntesis Web Audio Zero-Latency + Haptic</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            <button
              onClick={() => testAudio('click')}
              className="px-2 py-1.5 text-xs font-semibold text-gray-200 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-center"
            >
              🎯 Clic
            </button>
            <button
              onClick={() => testAudio('super')}
              className="px-2 py-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/30 text-center"
            >
              👟 660Hz Súper
            </button>
            <button
              onClick={() => testAudio('success')}
              className="px-2 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/25 text-center"
            >
              ✨ Éxito
            </button>
            <button
              onClick={() => testAudio('warning')}
              className="px-2 py-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/25 text-center"
            >
              ⚠️ Alerta
            </button>
            <button
              onClick={() => testAudio('cook')}
              className="px-2 py-1.5 text-xs font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl border border-purple-500/25 text-center"
            >
              🍳 Cocina
            </button>
            <button
              onClick={() => testAudio('delete')}
              className="px-2 py-1.5 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl border border-rose-500/25 text-center"
            >
              🗑️ Borrado
            </button>
          </div>
        </div>

        {/* Tab 1: Changelog */}
        {activeTab === 'changelog' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            
            {/* Release v3.7.0-Enterprise-Luxe */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1C1916] to-[#12100E] border border-emerald-500 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 rounded-lg font-mono">
                    v3.7.0-Enterprise-Luxe
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">ACTUAL · PRODUCCIÓN</span>
                </div>
                <span className="text-xs text-gray-400">13 Octubre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-display">
                Escáner Dual Acelerado por Hardware, Cámara OCR para Tickets y Rediseño Ergonómico Móvil
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Escáner de Códigos de Barra Reparado:</strong> Eliminación de restricciones restrictivas de resolución WebRTC que crasheaban la cámara en móviles; motor dual con detección nativa por BarcodeDetector (GPU/Hardware) y fallback instantáneo a Html5Qrcode para EAN-13, EAN-8, UPC y QR.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Lector de Tickets y Recibos con Cámara OCR:</strong> Nueva interfaz directa en el escáner para fotografiar tickets de compra (Mercadona, Costco, Chedraui, Walmart, Dia), extrayendo importes reales, unidades y nombres de producto con inserción en 1 toque en la Lista del Súper o ingreso directo a la Despensa.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Barra de Navegación Móvil Inferior (Bottom Navigation):</strong> Control ergonómico total con el pulgar para teléfonos móviles (Despensa, Súper, Botón central flotante de Escáner, Cocina y Cava).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Descongestión y Limpieza Visual Integral:</strong> Sustitución de la barra saturada de 12 botones en la Lista de Compras por 3 acciones primarias táctiles y menú de herramientas desplegable <code>⋯</code>. Header despejado con menú unificado de Ajustes del Hogar.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.5.4-Enterprise-Luxe */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1C1916] to-[#12100E] border border-[#2A2521] shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-[#E0B441] bg-[#E0B441]/20 border border-[#E0B441]/40 rounded-lg font-mono">
                    v3.5.4-Enterprise-Luxe
                  </span>
                  <span className="text-xs font-semibold text-gray-400">ANTERIOR</span>
                </div>
                <span className="text-xs text-gray-400">12 Octubre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-display">
                Reconciliación de Ticket de Compra, Canasta Básica Semanal, Resumen Diario y Chef Zero-Waste
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Reconciliación y Recepción de Ticket de Supermercado:</strong> Al ingresar las compras a la despensa, modal interactivo para declarar el cobro real de caja en $ MXN, quién realizó la compra (chofer, cocinera, etc.) y desglose de ahorro/varianza contra el estimado.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Canasta Básica Semanal del Hogar:</strong> Botón directo en la lista de compras que despliega los 12 insumos indispensables de la casa para agregarlos a la lista en 1 toque sin escribir.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Resumen Diario de Cocina & WhatsApp:</strong> Centro matutino en el encabezado que resume alimentos por caducar en ≤4 días, faltantes de stock y botón para enviar el reporte formateado a la cocinera por WhatsApp.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Chef Zero-Waste (Rescate de Insumos):</strong> Detector en el recetario que cruza ingredientes perecederos próximos a vencer con las recetas disponibles para sugerir qué cocinar de inmediato.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.5.3-Enterprise-Luxe */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1C1916] to-[#12100E] border border-[#2A2521] shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-[#E0B441] bg-[#E0B441]/20 border border-[#E0B441]/40 rounded-lg font-mono">
                    v3.5.3-Enterprise-Luxe
                  </span>
                  <span className="text-xs font-semibold text-gray-400">ANTERIOR</span>
                </div>
                <span className="text-xs text-gray-400">12 Octubre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-display">
                Edición de Catálogos en Línea, Búsqueda Instantánea y Corrección Integral de Impresión QR
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-[#E0B441] font-bold">✓</span>
                  <span><strong>Edición y Alta Completa de Catálogos:</strong> Interfaz responsiva que permite crear y modificar en línea tiendas, personal que registra, categorías y unidades de medida con selector de emojis.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#E0B441] font-bold">✓</span>
                  <span><strong>Resolución de Hojas QR en Blanco:</strong> Corrección de interpolación en el motor HTML y dimensionamiento de iframe (900x1200px) para impresión física 100% nítida y fiel.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#E0B441] font-bold">✓</span>
                  <span><strong>Diseño Web-Responsive Total:</strong> Optimización en teléfonos móviles (iPhone / Android) y tabletas con tap-targets de mínimo 44px y navegación sin recortes.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.5.2-Enterprise-Luxe */}
            <div className="p-5 rounded-2xl bg-[#171412] border border-[#2A2521] shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-gray-300 bg-white/5 border border-white/10 rounded-lg font-mono">
                    v3.5.2-Enterprise-Luxe
                  </span>
                </div>
                <span className="text-xs text-gray-400">12 Octubre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-display">
                Motor Anti-Duplicados Unificado, Ajuste Directo de Cantidades e Impresión QR en Iframe Aislado
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-[#E0B441] font-bold">✓</span>
                  <span><strong>Motor de Deduplicación Fonética y Ortográfica (`deduplication.js`):</strong> Normalización de acentos, plurales (`tomates` vs `tomate`) y raíces compuestas. Se evitan duplicados en despensa, lista de compras y recetas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#E0B441] font-bold">✓</span>
                  <span><strong>Steppers Táctiles Directos en Lista de Compra:</strong> Botones rápidos `+` y `-` integrados en cada tarjeta para alterar cantidades en un solo toque sin abrir formularios modales.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#E0B441] font-bold">✓</span>
                  <span><strong>Impresión Física QR sin Páginas en Blanco:</strong> Generación a través de iframe aislado invisible que renderiza HTML puro blanco con códigos QR en base64 de alto contraste para impresión física infalible.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.5.1-Enterprise-Luxe */}
            <div className="p-5 rounded-2xl bg-[#171412] border border-[#2A2521] shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-gray-300 bg-white/5 border border-white/10 rounded-lg font-mono">
                    v3.5.1-Enterprise-Luxe
                  </span>
                </div>
                <span className="text-xs text-gray-400">12 Octubre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-display">
                Resolución de Hojas QR en Blanco, Vectorización PDF Real y Aislamiento de Impresión
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-[#E0B441] font-bold">✓</span>
                  <span><strong>Corrección de Hook Ordering en Modal QR:</strong> Eliminación de condición temprana que rompía la ejecución de React (#310), asegurando apertura instantánea sin pantallas blancas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#E0B441] font-bold">✓</span>
                  <span><strong>Aislamiento CSS @media print:</strong> Desbloqueo de contenedores con scroll para que la impresión física (`window.print()`) pagine limpiamente en papel blanco con tinta negra de máximo contraste.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#E0B441] font-bold">✓</span>
                  <span><strong>Motor Vectorial de QR con qrcode:</strong> Generación de matrices QR reales en los 4 formatos (Stickers para frascos, Tablero maestro de cocina, Collarines de cava y Catálogo) para escaneo 100% certero con teléfonos móviles.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.5.0-Enterprise-Luxe */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1C1916] to-[#12100E] border border-white/10 opacity-80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-gray-400 bg-white/5 border border-white/10 rounded-lg font-mono">
                    v3.5.0-Enterprise-Luxe
                  </span>
                  <span className="text-xs font-medium text-gray-400">PREVIO</span>
                </div>
                <span className="text-xs text-gray-400">11 Octubre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-display">
                Multi-Tema y Colores, Catálogos Proactivos, Desduplicación Estricta y Devolución de Compras
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-[#E0B441] font-bold">✓</span>
                  <span><strong>Personalización de Temas & Paletas:</strong> 6 temas de lujo (Luxe Noir, Cava Forest, Borgoña Gran Reserva, Zafiro Presidencial, Espresso Cobrizo y Modo Claro Luxe Cream) con inyección dinámica de CSS variables y guardado local.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#E0B441] font-bold">✓</span>
                  <span><strong>Centro de Catálogos & Opciones Desplegables:</strong> Gestión centralizada y menús interactivos para Tiendas Habituales (Costco, City Market, etc.) y Personal que Registra (María, Chef, Chofer, Patrón) con chips de 1 toque y adición instantánea en formularios.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#E0B441] font-bold">✓</span>
                  <span><strong>Motor de Desduplicación y Consolidación de Compras:</strong> Fusión estricta de insumos repetidos con suma de cantidades en vez de duplicar filas, más botón "🧹 Desduplicar" y "🗑️ Limpiar Marcados".</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#E0B441] font-bold">✓</span>
                  <span><strong>Historial de Compras & Devoluciones:</strong> Registro de órdenes de compra con capacidad de eliminar o revertir artículos ingresados por error descontándolos automáticamente de la despensa.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#E0B441] font-bold">✓</span>
                  <span><strong>Eliminación Directa en Inventario:</strong> Botón de borrado con confirmación en tarjetas de alacena, cava, tabla y modal de edición.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#E0B441] font-bold">✓</span>
                  <span><strong>Ecosistema QR Vectorial:</strong> Generador de stickers con líneas de envasado/caducidad para botes/sobres, collarines de cava y tablero maestro de pedidos para puertas.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.4.0-Master */}
            <div className="p-5 rounded-2xl bg-[#1C1916]/80 border border-[#2A2521] hover:border-[#3D3630] transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-[#B8AFA3] bg-white/5 border border-white/10 rounded-lg font-mono">
                    v3.4.0-Master
                  </span>
                </div>
                <span className="text-xs text-gray-400">11 Octubre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-display">
                Importador Inteligente OCR, Manual Operativo y Menú Dinámico Configurable
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-[#E0B441] font-bold">✓</span>
                  <span><strong>Importador Bidireccional & OCR:</strong> Extracción visual con visión artificial Tesseract.js de libretas y tickets con pre-procesamiento de contraste, además de soporte para WhatsApp y archivos PDF/TXT.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#E0B441] font-bold">✓</span>
                  <span><strong>Auditoría & Test Suite Aprobada:</strong> 100% de éxito en pruebas automatizadas de extracción de datos, filtrado de saludos y normalización de fracciones (1/2 kg).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#E0B441] font-bold">✓</span>
                  <span><strong>Menú Dinámico (Ocultar & Agregar Pestañas):</strong> Posibilidad de apagar visibilidad de secciones que no se utilicen, renombrar cualquiera y agregar nuevas pestañas personalizadas vinculadas a zonas del hogar.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#E0B441] font-bold">✓</span>
                  <span><strong>Manual e Instructivo Integral en Pantalla:</strong> Guía interactiva de 9 secciones con buscador y opción de impresión/PDF para la carpeta del personal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#E0B441] font-bold">✓</span>
                  <span><strong>Web NFC & Códigos ALC-XXXX:</strong> Grabación de chips adhesivos con 1 toque y auto-generación de códigos permanentes.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.3.0-Perfection */}
            <div className="p-5 rounded-2xl bg-[#1C1916] border border-[#3D3630] transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 rounded-lg font-mono">
                    v3.3.0-Perfection
                  </span>
                  <span className="text-xs font-semibold text-gray-400">ANTERIOR</span>
                </div>
                <span className="text-xs text-gray-400">11 Octubre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-display">
                Operación Proactiva, Lista Imprimible A4/PDF, Maridaje Cava & Respaldo Integral
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Hoja de Compras Imprimible & PDF:</strong> Vista previa editorial A4/Carta en blanco y negro puro, casillas para pluma [ ], código QR de sincronización y firmas de entrega y recepción.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Alertas Proactivas de Despensa:</strong> Detección automática en tiempo real de insumos bajo stock mínimo de seguridad con generación de lista en 1 clic.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>CavaPro & Sommelier Maridaje Rápido:</strong> Filtros por ocasión (Cortes & Asados, Pescados, Brindis, Gran Reserva) y ventana óptima de consumo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Recepción Rápida de Compras:</strong> Transferencia atómica de insumos comprados a su zona física de alacena con actualización patrimonial en $ MXN.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Master Prompt Canónico v3.3.0:</strong> Documento de gobernanza unificado y respaldado en repositorio con auditoría completa.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.1.0-Luxe */}
            <div className="p-5 rounded-2xl bg-[#1C1916] border border-[#3D3630] transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-[#E0B441] bg-[#E0B441]/20 border border-[#E0B441]/40 rounded-lg">
                    v3.1.0-Luxe
                  </span>
                  <span className="text-xs font-semibold text-gray-400">ANTERIOR</span>
                </div>
                <span className="text-xs text-gray-400">11 Octubre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-display">
                Fase 8: Experiencia Visual Luxe & Sistema Editorial Patrimonial
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span><strong>Design Tokens Luxe & Tipografía Editorial:</strong> Tipografías Fraunces (títulos editoriales), Inter (cuerpo) y JetBrains Mono (valores numéricos tabulares).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span><strong>Paletas Duales:</strong> Luxe Cream y Midnight Cava con acentos por pilar (Súper, CavaPro, Cocina, Bitácora, Catálogo QR).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span><strong>Modo "Caminando por el Súper":</strong> Checkboxes táctiles gigantes 56px, tono Web Audio 660Hz 120ms, vibración háptica y contador sticky de avance.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span><strong>Fichas Sommelier CavaPro:</strong> Vista horizontal 2:1 editorial, silueta SVG de botellas, bordes por estilo de vino y descorche luxe con notas sensoriales.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span><strong>Layout Revista en Recetas:</strong> Portadas 16:9 full-bleed, pasos circulares grandes y modo cocina inmersivo a pantalla completa.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span><strong>Bitácora Forense Visual:</strong> Timeline vertical con nodos circulares por acción, hash SHA-256 de integridad y deltas colapsables.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span><strong>Persistencia Offline Dexie (IndexedDB):</strong> Sincronización transparente sin depender de conexión para cuartos fríos y cavas.</span>
                </li>
              </ul>
            </div>

            {/* Release v2.5.0 */}
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-[#2A2521] hover:border-[#3D3630] transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 rounded-lg">
                    v2.5.0
                  </span>
                  <span className="text-xs font-semibold text-gray-400">ANTERIOR</span>
                </div>
                <span className="text-xs text-gray-400">11 Octubre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2">
                Sommelier Pro, Escáner Dual Súper (EAN-13 / QR), Librito Físico Cocina y Modo Offline
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>1. Sommelier Pro & Añadas:</strong> Vinos con año, país con bandera 🇲🇽 🇪🇸 🇫🇷 🇮🇹, región D.O., bodega, uva y estantería de cava.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>2. Ficha de Cata & Calificación:</strong> 1 a 5 estrellas ⭐⭐⭐⭐⭐, puntos sommelier (80-100), notas de aroma, boca y descorche con registro a bitácora.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>3. Escáner Híbrido Universal:</strong> Lee códigos de barras lineales de súper (EAN-13 / UPC como Coca-Cola) y códigos QR de recipientes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>4. Librito Físico de Códigos QR:</strong> Catálogo imprimible para pegar en cocina; el personal sólo apunta la cámara de su celular al producto terminado.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>5. Captura Rápida "¿Qué Falta en Casa?":</strong> Botones táctiles de insumos frecuentes (Coca-Cola, Leche, Huevos) sin enredos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>6. Impresión y PDF de la Lista del Súper:</strong> Formato físico limpio organizado por pasillos con casillas [ ] para tachar con pluma.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>7. Modo Offline Resiliente:</strong> Funciona en sótanos, cámaras frías y supermercados sin señal; todo se guarda en el teléfono.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>8. Indicador de Red en Vivo:</strong> Insignia 🟢 Online o 🟡 Offline en la barra superior.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>9. WhatsApp por Pasillos:</strong> Envío de la lista ordenada por departamentos con casillas interactivas de texto.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>10. Trazabilidad Forense Automática:</strong> Registro de cada descorche y consumo de cocina con responsable y hora exacta.</span>
                </li>
              </ul>
            </div>

            {/* Release v2.4.0 */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-blue-400 bg-blue-500/15 border border-blue-500/30 rounded-lg">
                    v2.4.0
                  </span>
                  <span className="text-xs font-semibold text-blue-400">ANTERIOR</span>
                </div>
                <span className="text-xs text-gray-400">11 Octubre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2">
                Transformación a Web App de Lujo, Audio Sensorial y Control de Zonas
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Captura Manual Directa:</strong> Formulario moderno de alta sin escaneo obligatorio de código de barras.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Gestión de Zonas en 1 Clic:</strong> Renombra o elimina Cava, Cuarto Frío o Alacena directamente en los chips con el lápiz ✏️.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Motor de Audio Sensorial:</strong> Sonidos mecánicos y chimes armónicos instantáneos (Web Audio API) sin latencia.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Moneda Estricta MXN ($):</strong> Valuación total en Pesos Mexicanos con costeo por unidad y receta.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Version Badge Visible:</strong> Acceso permanente a esta bitácora y estado de salud de la plataforma.</span>
                </li>
              </ul>
            </div>

            {/* Release v2.3.0 */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-blue-400 bg-blue-500/15 border border-blue-500/30 rounded-lg">
                    v2.3.0
                  </span>
                  <span className="text-xs font-semibold text-blue-400">RECIENTE</span>
                </div>
                <span className="text-xs text-gray-400">11 Octubre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2">
                Motor de Cocina Tipo Restaurante y Deducción Automática
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">✓</span>
                  <span>Módulo de Recetas con costeo automático en tiempo real por porción.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">✓</span>
                  <span>Función "Cocinar y Descontar" con atribución al personal (María, Chef, etc.).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">✓</span>
                  <span>Bitácora Forense de Auditoría (Audit Trail) inmutable.</span>
                </li>
              </ul>
            </div>

            {/* Release v2.0.0 */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-purple-400 bg-purple-500/15 border border-purple-500/30 rounded-lg">
                    v2.0.0
                  </span>
                  <span className="text-xs font-semibold text-purple-400">ARQUITECTURA</span>
                </div>
                <span className="text-xs text-gray-400">10 Octubre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2">
                Infraestructura Firebase Spark 0 USD y Cava Sommelier
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">✓</span>
                  <span>Persistencia offline en Cloud Firestore sin costos de infraestructura.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold">✓</span>
                  <span>Cava digital con control de añadas, denominación y temperaturas.</span>
                </li>
              </ul>
            </div>

          </div>
        )}

        {/* Tab 2: Plan Maestro de 30 Mejoras por Etapas */}
        {activeTab === 'plan30' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-gray-300">
            
            {/* Etapa 1 */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 rounded">
                ETAPA 1 • SEMANA 1 (EN CURSO)
              </span>
              <h4 className="text-sm font-bold text-white mt-1.5 mb-2">
                Practicidad Inmediata, Compras por WhatsApp y Atajos
              </h4>
              <ul className="space-y-1.5 text-[11px]">
                <li>• <strong>14.</strong> Generador de Lista de Compras basado en Stock Ideal vs Real.</li>
                <li>• <strong>15.</strong> Envío de Lista de Compras formateada directamente por WhatsApp al chofer/comprador.</li>
                <li>• <strong>23.</strong> Atajos de teclado profesionales (`/` buscar, `N` nuevo producto, `C` cocinar).</li>
                <li>• <strong>27.</strong> Botón de Auto-Reabastecimiento con 1 clic ("Reponer al Stock Ideal").</li>
                <li>• <strong>29.</strong> Respaldo y descarga de backup en JSON con 1 clic.</li>
              </ul>
            </div>

            {/* Etapa 2 */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/25">
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-blue-500/20 text-blue-300 rounded">
                ETAPA 2 • SEMANA 2
              </span>
              <h4 className="text-sm font-bold text-white mt-1.5 mb-2">
                Visualización Financiera, Gráficas y Control de Caducidades
              </h4>
              <ul className="space-y-1.5 text-[11px]">
                <li>• <strong>1.</strong> Dashboard con Gráficas de Dona y Barras por categoría en $ MXN.</li>
                <li>• <strong>2.</strong> Semáforo de Caducidades con cuenta regresiva ("Vence en 48 hrs").</li>
                <li>• <strong>3.</strong> Modo Galería Visual con Fotos HD de botellas y carnes.</li>
                <li>• <strong>5.</strong> Medidores de temperatura y humedad para Cava y Cuarto Frío.</li>
                <li>• <strong>8.</strong> Indicador de Rotación de Inventario ABC (alta rotación vs estancado).</li>
              </ul>
            </div>

            {/* Etapa 3 */}
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/25">
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 rounded">
                ETAPA 3 • SEMANA 3
              </span>
              <h4 className="text-sm font-bold text-white mt-1.5 mb-2">
                Hardware, Escáner en Vivo e Impresión de Etiquetas QR
              </h4>
              <ul className="space-y-1.5 text-[11px]">
                <li>• <strong>21.</strong> Escáner de Códigos de Barras y QR con cámara web y móvil.</li>
                <li>• <strong>22.</strong> Generador de Etiquetas QR para recipientes de cuarto frío.</li>
                <li>• <strong>24.</strong> Exportación Ejecutiva a Excel (.xlsx) y PDF foliado.</li>
                <li>• <strong>25.</strong> Importación masiva desde archivo Excel / CSV en 20 segundos.</li>
              </ul>
            </div>

            {/* Etapa 4 */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 rounded">
                ETAPA 4 • SEMANA 4
              </span>
              <h4 className="text-sm font-bold text-white mt-1.5 mb-2">
                Seguridad, PIN de Cocina, Mermas y Desperdicio
              </h4>
              <ul className="space-y-1.5 text-[11px]">
                <li>• <strong>11.</strong> Módulo de Mermas y Desperdicio con impacto financiero en $ MXN.</li>
                <li>• <strong>17.</strong> Toma de Inventario Físico a Ciegas para reconciliación.</li>
                <li>• <strong>18.</strong> Acceso Rápido por PIN de 4 dígitos para tablet de cocina.</li>
                <li>• <strong>20.</strong> Comparativa de Precios entre Proveedores (Costco vs City Market).</li>
              </ul>
            </div>

            {/* Etapa 5 */}
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25">
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 rounded">
                ETAPA 5 • SEMANA 5
              </span>
              <h4 className="text-sm font-bold text-white mt-1.5 mb-2">
                Inteligencia Artificial y Modo Pantalla Completa PWA
              </h4>
              <ul className="space-y-1.5 text-[11px]">
                <li>• <strong>26.</strong> Chef Asistente con IA: Sugerencias según insumos disponibles.</li>
                <li>• <strong>16.</strong> Sub-recetas y fondos base conservados en cámara fría.</li>
                <li>• <strong>28.</strong> PWA instalable para iPad, iPhone y Android sin App Store.</li>
              </ul>
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#131C31] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Documentado en AUDITORIA_Y_PLAN_30_MEJORAS.md</span>
          </div>
          <button
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg shadow-emerald-900/30"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
