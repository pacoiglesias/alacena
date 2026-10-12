import React, { useState } from 'react';
import { 
  X, BookOpen, Search, Shield, Wine, Utensils, 
  ShoppingCart, Camera, QrCode, Layers, History, 
  WifiOff, Printer, ChevronRight, Sparkles, CheckCircle2,
  Sliders, Smartphone, HelpCircle
} from 'lucide-react';
import { audio } from '../../services/audioService';

const MANUAL_SECTIONS = [
  {
    id: 'roles',
    title: '1. Filosofía del Hogar & Roles de Personal',
    icon: Shield,
    color: '#E0B441',
    summary: 'Organización para dueños de casa, cocinera, chofer y personal doméstico.',
    content: (
      <div className="space-y-4 text-sm text-[#D1C9BF]">
        <p>
          <strong>ALACENA Enterprise</strong> no es un simple inventario de negocio; es un sistema diseñado para la dinámica real de un hogar de alto nivel donde interactúan distintas personas:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-[#1C1814] border border-[#3D3630]">
            <span className="text-xs font-bold font-mono text-amber-400 block mb-1">👑 Patrón / Administrador</span>
            <p className="text-xs text-[#A89F95]">
              Control total del hogar. Define casas (Principal, Rancho, Playa), zonas físicas, presupuestos en MXN, marcas de vino en cava y acceso global.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#1C1814] border border-[#3D3630]">
            <span className="text-xs font-bold font-mono text-purple-400 block mb-1">👩‍🍳 Cocinera Mayor / Chef</span>
            <p className="text-xs text-[#A89F95]">
              Consulta el recetario, escala porciones para comensales, descuenta automáticamente ingredientes al cocinar y solicita faltantes a la lista del súper.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#1C1814] border border-[#3D3630]">
            <span className="text-xs font-bold font-mono text-orange-400 block mb-1">🚗 Chofer / Abastecimiento</span>
            <p className="text-xs text-[#A89F95]">
              Recibe la lista organizada por pasillo o tienda (Costco, City Market, etc.), marca artículos en el carrito y escanea tickets para conciliar gastos.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#1C1814] border border-[#3D3630]">
            <span className="text-xs font-bold font-mono text-emerald-400 block mb-1">🧹 Camarista / Ama de Llaves</span>
            <p className="text-xs text-[#A89F95]">
              Registra entradas y salidas de despensas secundarias, blancos y artículos de limpieza mediante escaneo QR rápido.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'inventory',
    title: '2. Alacena & Control de Capacidad Máxima',
    icon: Layers,
    color: '#3D8B6E',
    summary: 'Cómo evitar desbordes de frascos y mantener existencias ideales.',
    content: (
      <div className="space-y-4 text-sm text-[#D1C9BF]">
        <p>
          En casa, cada frasco, especiero o repisa tiene un espacio físico limitado. A diferencia de un almacén industrial, comprar de más genera desorden en la cocina.
        </p>
        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Capacidad Máxima (Max Stock):</strong> Define cuánto cabe exactamente en tu contenedor o repisa (ej. un frasco de 2 kg de arroz). El sistema nunca te sugerirá comprar más de lo que cabe.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Punto de Reorden (Mínimo):</strong> Nivel de seguridad. Si bajas de este valor, el artículo se marca automáticamente en ámbar y se propone para el siguiente viaje al súper.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Zonas Físicas:</strong> Puedes crear tantas como requieras (<em>Alacena Principal</em>, <em>Cuarto Frío</em>, <em>Refrigerador</em>, <em>Bodega Jardín</em>) y filtrarlas con un solo clic.
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'cava',
    title: '3. CavaPro & Sommelier de Autor',
    icon: Wine,
    color: '#A83A50',
    summary: 'Control de botellas finas, añadas, ventanas de consumo y descorche.',
    content: (
      <div className="space-y-4 text-sm text-[#D1C9BF]">
        <p>
          La gestión de cava permite tratar cada botella como un activo valioso con valuación en Pesos Mexicanos (MXN):
        </p>
        <ul className="space-y-2 list-disc list-inside text-xs sm:text-sm text-[#B8AFA3]">
          <li><strong>Ventana de Consumo:</strong> Registra el año de inicio y madurez para descorchar en el momento óptimo de guarda sin que el vino se oxide.</li>
          <li><strong>Notas de Cata y Maridaje:</strong> Documenta las características aromáticas y qué platillos de tu recetario combinan mejor.</li>
          <li><strong>Bitácora de Descorche:</strong> Cada botella abierta descuenta inventario y registra quién la descorchó y el motivo (ej. Cena familiar, Evento).</li>
          <li><strong>Collares Imprimibles:</strong> En el menú de impresión puedes generar etiquetas de cuello para colgar de las botellas en los racks.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'recipes',
    title: '4. Cocina & Recetas Inteligentes (Zero-Waste)',
    icon: Utensils,
    color: '#E0B441',
    summary: 'Auditoría automática de despensa, escalado de porciones y pedidos en 1 clic.',
    content: (
      <div className="space-y-4 text-sm text-[#D1C9BF]">
        <p>
          El módulo de recetas se conecta en tiempo real con lo que hay en tu alacena:
        </p>
        <div className="space-y-2.5 text-xs sm:text-sm">
          <div className="p-3 rounded-xl bg-black/30 border border-[#3D3630]">
            <strong className="text-[#E0B441]">🟢 Semáforo en Vivo:</strong> Al abrir una receta, el sistema analiza tus existencias. Si tienes todo, marca <em>100% Listo para Cocinar</em>. Si falta algo, resalta exactamente qué ingrediente y cuántos gramos faltan.
          </div>
          <div className="p-3 rounded-xl bg-black/30 border border-[#3D3630]">
            <strong className="text-[#E0B441]">⚖️ Escalador de Porciones:</strong> Con los botones <strong>[-] 4 [+]</strong> comensales, todos los ingredientes y el costo en MXN se multiplican proporcionalmente.
          </div>
          <div className="p-3 rounded-xl bg-black/30 border border-[#3D3630]">
            <strong className="text-[#E0B441]">🛒 Botón "Pedir Faltantes":</strong> Un solo clic manda el déficit exacto de la receta a la Lista del Súper, asignándole la tienda correcta.
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'shopping',
    title: '5. Lista del Súper & Importador Inteligente / OCR',
    icon: ShoppingCart,
    color: '#E5724A',
    summary: 'Lectura de fotos de libretas, tickets, mensajes de WhatsApp y modo tienda.',
    content: (
      <div className="space-y-4 text-sm text-[#D1C9BF]">
        <p>
          Olvídate de teclear producto por producto. Tienes 4 maneras instantáneas de poblar tu lista:
        </p>
        <div className="space-y-2 text-xs sm:text-sm">
          <p><strong>1. Foto con OCR:</strong> Tómale foto con el celular a la lista en una servilleta o ticket. La visión artificial extrae cantidades, unidades y nombres.</p>
          <p><strong>2. Pegar WhatsApp:</strong> Si te mandan un mensaje de texto con viñetas o comas, pégalo directo. El parser detecta fracciones (1/2 kg), departamentos y tiendas.</p>
          <p><strong>3. Modo Caminata en Tienda:</strong> Pantalla táctil con casillas gigantes para marcar productos con una mano mientras empujas el carrito.</p>
          <p><strong>4. Ticket QR para Chofer:</strong> Genera un ticket en pantalla con código QR que el chofer puede escanear en su celular sin instalar nada.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'qr',
    title: '6. Códigos QR, Stickers de Cocina & Web NFC',
    icon: QrCode,
    color: '#3D8B6E',
    summary: 'Etiquetado físico de frascos y botellas con lectura multidireccional.',
    content: (
      <div className="space-y-4 text-sm text-[#D1C9BF]">
        <p>
          Cada producto de la casa puede tener su propio identificador físico permanente:
        </p>
        <ul className="space-y-2 list-disc list-inside text-xs sm:text-sm text-[#B8AFA3]">
          <li><strong>Generación Automática ALC-XXXX:</strong> Para especias o granos a granel sin código comercial, el sistema genera una clave única y guarda su sticker.</li>
          <li><strong>Impresión en Papel Blanco:</strong> En el librito QR puedes imprimir hojas de corte (✂️) para pegar en frascos herméticos o Tupperwares.</li>
          <li><strong>Grabación Web NFC:</strong> En teléfonos Android compatibles, abre el modal del producto, presiona <em>[📶 Grabar NFC]</em> y acerca una calcomanía NFC para grabarla en 1 segundo.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'scanner',
    title: '7. Cámara y Escáner Multidireccional',
    icon: Camera,
    color: '#E0B441',
    summary: '4 intenciones de escaneo para operar sin tocar botones.',
    content: (
      <div className="space-y-4 text-sm text-[#D1C9BF]">
        <p>
          El escáner del sistema tiene 4 modos preseleccionables para máxima velocidad:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/30">
            <strong className="text-emerald-400 block mb-1">➕ Modo Entrada (+1)</strong>
            Ideal al desempacar el súper. Pasas los artículos frente al lente y suma existencias solo.
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-amber-500/30">
            <strong className="text-amber-400 block mb-1">➖ Modo Consumo (-1)</strong>
            Para cuando la cocinera saca un frasco o descorchas un vino; descuenta stock sin pantallas extras.
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-orange-500/30">
            <strong className="text-orange-400 block mb-1">🛒 Modo Súper (Pedir)</strong>
            ¿Se vació el bote de avena? Escaneas el frasco vacío y se va directo a la lista de compras.
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-blue-500/30">
            <strong className="text-blue-400 block mb-1">🔍 Modo Interactivo</strong>
            Abre la ficha completa del producto para consultar su ficha técnica, precio y movimientos.
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'offline',
    title: '8. Modo Offline & Sincronización Automática',
    icon: WifiOff,
    color: '#5C8894',
    summary: 'Operación ininterrumpida en sótanos, cavas o supermercados sin señal.',
    content: (
      <div className="space-y-4 text-sm text-[#D1C9BF]">
        <p>
          Gracias a la persistencia interna con <strong>IndexedDB</strong>, el sistema nunca se congela si se cae el WiFi:
        </p>
        <ul className="space-y-2 list-disc list-inside text-xs sm:text-sm text-[#B8AFA3]">
          <li>Puedes tachar compras, buscar recetas o descontar vinos en cualquier sótano sin recepción.</li>
          <li>En cuanto el dispositivo vuelve a conectarse a internet, los cambios se sincronizan transparentemente en segundo plano con la base de datos central en la nube.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'menu',
    title: '9. Menú Configurable (Renombrar, Quitar & Agregar Pestañas)',
    icon: Sliders,
    color: '#E0B441',
    summary: 'Personaliza los nombres, oculta lo que no uses o añade accesos directos a tus zonas.',
    content: (
      <div className="space-y-4 text-sm text-[#D1C9BF]">
        <p>
          Cada hogar es único. Desde el botón <strong>[⚙️ Configurar Menú]</strong> en la barra superior puedes:
        </p>
        <ul className="space-y-2 list-disc list-inside text-xs sm:text-sm text-[#B8AFA3]">
          <li><strong>Ocultar / Quitar:</strong> Apaga el switch de cualquier pestaña que no uses (por ejemplo, si no tienes cava de vinos o no quieres ver la bitácora).</li>
          <li><strong>Renombrar:</strong> Cambia los nombres por los que use tu familia (ej. *"Mandado"*, *"Mi Cocina"*, *"Despensa"*).</li>
          <li><strong>Agregar Nuevas:</strong> Crea pestañas directas para una zona específica (ej. *"Cuarto Frío"*, *"Bodega"* o *"Bar"*).</li>
        </ul>
      </div>
    ),
  },
];

export default function SystemManualModal({ isOpen, onClose }) {
  const [activeSectionId, setActiveSectionId] = useState('roles');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Filtrado de secciones por búsqueda
  const filteredSections = MANUAL_SECTIONS.filter((sec) => {
    const q = searchQuery.toLowerCase();
    return sec.title.toLowerCase().includes(q) || sec.summary.toLowerCase().includes(q);
  });

  const activeSection = MANUAL_SECTIONS.find((s) => s.id === activeSectionId) || MANUAL_SECTIONS[0];

  const handlePrintManual = () => {
    audio.click();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl rounded-3xl bg-[#14110F] border border-[#E0B441]/35 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#2A2521] bg-[#1C1814]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#E0B441]/15 text-[#E0B441] border border-[#E0B441]/35">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-display font-bold text-[#F2EDE4]">
                Manual Operativo & Guía del Sistema
              </h2>
              <p className="text-xs text-[#B8AFA3]">
                Instructivo interactivo de funciones para dueños de casa, chefs y personal doméstico
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintManual}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#E0B441] border border-[#3D3630] transition-all"
              title="Imprimir manual o guardar en PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={() => {
                audio.click();
                onClose();
              }}
              className="p-2 rounded-xl text-[#B8AFA3] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 sm:px-6 border-b border-[#2A2521] bg-[#171412] flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8B8378] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en el manual (ej: nfc, ocr, recetas, cava, chofer, max stock)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1C1814] border border-[#3D3630] focus:border-[#E0B441] text-xs sm:text-sm text-[#F2EDE4] placeholder:text-[#6E655F] outline-none transition-all"
            />
          </div>
        </div>

        {/* Content Layout (Sidebar + Viewer) */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Sidebar Index */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[#2A2521] bg-[#14110F] overflow-y-auto p-3 space-y-1.5 custom-scrollbar max-h-56 md:max-h-none shrink-0">
            {filteredSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = sec.id === activeSection.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    audio.click();
                    setActiveSectionId(sec.id);
                  }}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 ${
                    isActive 
                      ? 'bg-[#1C1814] border border-[#E0B441]/40 shadow-sm' 
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div 
                    className="p-2 rounded-xl shrink-0 mt-0.5"
                    style={{ backgroundColor: `${sec.color}20`, color: sec.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-[#D1C9BF]'}`}>
                      {sec.title}
                    </h4>
                    <p className="text-[11px] text-[#8B8378] line-clamp-1 mt-0.5">
                      {sec.summary}
                    </p>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 self-center transition-transform ${isActive ? 'text-[#E0B441] translate-x-0.5' : 'text-[#5A524A]'}`} />
                </button>
              );
            })}
          </div>

          {/* Section Reader */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 bg-[#171412] custom-scrollbar">
            <div className="flex items-center gap-3 pb-3 border-b border-[#2A2521]">
              <div 
                className="p-2.5 rounded-2xl"
                style={{ backgroundColor: `${activeSection.color}20`, color: activeSection.color }}
              >
                {React.createElement(activeSection.icon, { className: 'w-6 h-6' })}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-display font-bold text-[#F2EDE4]">
                  {activeSection.title}
                </h3>
                <p className="text-xs text-[#B8AFA3]">
                  {activeSection.summary}
                </p>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              {activeSection.content}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2A2521] bg-[#1C1814] flex items-center justify-between text-xs text-[#8B8378]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>ALACENA Enterprise v3.3.0 Perfection · Sistema Operativo Residencial</span>
          </div>
          <button
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-all"
          >
            Entendido / Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
