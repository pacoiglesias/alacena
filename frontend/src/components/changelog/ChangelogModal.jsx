import React, { useState } from 'react';
import {
  X, Sparkles, Volume2, VolumeX, ShieldCheck
} from 'lucide-react';
import { audio } from '../../services/audioService';

export const SYSTEM_VERSION = 'v3.14.0-Casa';
export const RELEASE_DATE = '12 Noviembre 2026';

export default function ChangelogModal({ isOpen, onClose }) {
  const [isMuted, setIsMuted] = useState(audio.isMuted());

  if (!isOpen) return null;

  const handleToggleMute = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-soft)] bg-[var(--bg-base)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[var(--wine)]/30 border border-[var(--wine-bright)]/40 text-[var(--gold)]">
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
            <button aria-label="Cerrar"
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

        {/* Historial de versiones — contenido único (3.14.0):
            fuera la pestaña «Plan Maestro» y el banco de audio. */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">

            {/* Funciones en la nube — 6 Noviembre 2026 */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-base)] border border-emerald-500 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 rounded-lg font-mono">
                    Funciones en la nube
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">DESPLEGADAS · PRODUCCIÓN</span>
                </div>
                <span className="text-xs text-gray-400">6 Noviembre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-display">
                El consumo predictivo y las alertas de stock ya corren en la nube
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Tres funciones en vivo:</strong> la búsqueda de códigos (EAN), las alertas de stock al cambiar un producto y el consumo predictivo diario ya están desplegados y corriendo. El despliegue es automático con cada cambio, sin claves guardadas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Reescritas al modelo real:</strong> ahora trabajan sobre tus productos, tu lista del súper y tu historial por casa, como hace la app. Antes usaban un modelo antiguo que la app ya no usa.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.14.0-Casa */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-base)] border border-emerald-500 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 rounded-lg font-mono">
                    v3.14.0-Casa
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">ACTUAL · PRODUCCIÓN</span>
                </div>
                <span className="text-xs text-gray-400">12 Noviembre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-display">
                Orden y diseño: cada número con su moneda y cada botón con su trabajo
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>La moneda de tu casa, en todo:</strong> una sola función pone los precios y Casa España ya no ve «$ MXN» en el Modo Súper, la despensa ni las recetas. El valor de la despensa ya no se redondea a enteros.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Nada inventado:</strong> un vino sin puntuar dice «Sin puntuar» (antes salían 92 puntos y 5 estrellas de fábrica), una receta sin tiempo no enseña «30m», el comparador sin datos no corona a ninguna tienda y la barra de stock sin referencia no inventa capacidad.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Bitácora de tu casa y en humano:</strong> solo enseña los movimientos de la casa que estás viendo, con las acciones por su nombre («Baja de artículo», sin códigos ni tecnicismos), y su botón es «Imprimir», que es lo que hace.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>«Por vencer» significa lo mismo en todas partes:</strong> caduca en 15 días o menos y aún queda — cabecera, Resumen Diario y Despensa cuentan igual, y la insignia de alertas cuenta productos, no conceptos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Botones que hacen lo que dicen:</strong> las tarjetas de la Lista y la Despensa llevan a su detalle; «Generar Lista del Súper» genera la lista; el Resumen Diario añade los faltantes de verdad; y borrar un producto o una receta ahora tiene Deshacer. En Despensa, la cantidad se corrige tocándola en la tarjeta, como en la Lista.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Orden visual:</strong> héroe de la Lista reducido para que el primer artículo se vea antes en el móvil; pendientes y estimado una sola vez por pantalla; fuera los duplicados del menú «…»; emojis fuera de los botones; y la barra móvil con las mismas pestañas del escritorio, Bitácora incluida. El botón de Google vive solo en la puerta de conexión.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.13.0-Casa */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-base)] border border-emerald-500 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 rounded-lg font-mono">
                    v3.13.0-Casa
                  </span>
                </div>
                <span className="text-xs text-gray-400">12 Noviembre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-display">
                Acceso por credencial: el botón oficial de Google, sin páginas intermedias
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Acceso nuevo de raíz:</strong> entrar con Google ya no pasa por la página intermediaria de Firebase, que en esta app fallaba al completar el acceso una y otra vez. Ahora verás el botón oficial de Google y la credencial entra directa: eliges tu cuenta y tu casa se conecta sola, como antes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>El error, donde tocas:</strong> si el botón de Google no puede cargar (sin conexión o un bloqueador), el aviso sale en el mismo panel con su motivo y un botón de reintento, no en un rincón lejos de tu dedo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Lo demás no cambia:</strong> la puerta «Tu casa aún no está conectada», el sello de conexión de la cabecera, la etiqueta «Lista de este dispositivo (sin conectar)» y la conexión automática de tu casa al abrir siguen exactamente igual.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.12.0-Casa */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-base)] border border-emerald-500 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 rounded-lg font-mono">
                    v3.12.0-Casa
                  </span>
                </div>
                <span className="text-xs text-gray-400">11 Noviembre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-display">
                Conexión siempre viva: tu casa se conecta sola y la app ya nunca se finge vacía
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Acceso reparado de raíz:</strong> el acceso de Google ahora se completa en el mismo dominio de la app (alacena.cobertores.com); antes saltaba a otro dominio y los navegadores actuales lo rompían en silencio, dejando la app «vacía» en pleno súper.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Tu casa se conecta sola:</strong> con tu sesión iniciada, la app conecta automáticamente la casa principal de tu cuenta en cada arranque y en cualquier dispositivo; ya no hay que buscar «Conectar mi casa».</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Nada de vacíos silenciosos:</strong> sin conectar, la primera pantalla lo dice con claridad («Tu casa aún no está conectada en este dispositivo»), la lista se etiqueta «Lista de este dispositivo (sin conectar)» y el Modo Súper avisa en grande. El modo sin conexión pasa a ser una elección tuya, no el arranque por defecto.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Acceso con respaldo:</strong> si la ventana de Google no puede abrirse, el acceso sigue solo en esta pestaña; y si la redirección vuelve sin completar, la app explica el motivo y ofrece la ventana, sin avisos muertos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Indicador de casa en la cabecera:</strong> junto al ONLINE de red verás siempre «Casa conectada», «Conectando…» o «Sin conectar», con el nombre de tu casa; y si la nube no responde, la lista muestra un error claro en vez de un falso vacío.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Lotes FEFO en todo:</strong> cocinar, descorchar una botella, devolver una compra y recibir la compra ya descuentan o alimentan los lotes por caducidad con la misma regla que el QR: primero vence, primero sale.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.11.0-Casa */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-base)] border border-emerald-500 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 rounded-lg font-mono">
                    v3.11.0-Casa
                  </span>
                </div>
                <span className="text-xs text-gray-400">10 Noviembre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-display">
                Inventario en serio: el stock bajo vuelve a la lista, el QR descuenta lo justo y cada ficha se completa
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Stock bajo que sí avisa:</strong> reparada la alerta que debía meter en tu lista lo que llega a su mínimo; ahora ningún producto bajo mínimo se queda fuera, y sin duplicar lo que ya está en la lista.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>QR con la cantidad de verdad:</strong> al escanear eliges cuánto consumes o repones (en kilos y litros: 0,1 · 0,25 · 0,5 · 1, a 3 decimales) y tienes «Deshacer» si el escaneo fue equivocado.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Fichas incompletas a la vista:</strong> Inventario marca «Incompleto» a lo que le falta código, caducidad, zona o stock mínimo, con contador y un filtro para ver solo esos productos y completarlos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Lotes por caducidad:</strong> un mismo producto puede tener varios lotes con su fecha; al consumir se gasta primero el que antes vence y la fecha que ves es siempre la del lote más próximo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Recibir la compra en un paso:</strong> al guardar la compra corriges cuánto compraste de verdad por artículo; lo comprado entra a la despensa y lo que faltó se queda pendiente en la lista, sin borrar la línea.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Alta rápida por zonas:</strong> el escáner tiene zona fija visible que se queda entre escaneos y entre visitas, el código desconocido te pide el nombre sin inventarlo, y el alta manual trae «Guardar y siguiente» para encadenar productos de la misma zona.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.10.2-Casa */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-base)] border border-emerald-500 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 rounded-lg font-mono">
                    v3.10.2-Casa
                  </span>
                </div>
                <span className="text-xs text-gray-400">5 Noviembre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-display">
                Cocinar descuenta bien, el súper afina los kilos y la nube ya separa las casas
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Cocinar sin sorpresas:</strong> antes de descontar se ve qué se descuenta y qué falta (porciones escaladas, unidades convertidas y solo la casa activa); si falta algo, no se descuenta nada y lo dice con nombres.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Súper y despensa a 3 decimales:</strong> los steppers de kilos y litros van de 0,1 en 0,1 y la cantidad de una tarjeta del súper se corrige tocándola, sin borrarla. El alta rápida ya sugiere litros o kilos según lo que escribas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Nube por casa:</strong> la sincronización ya solo trae la casa activa (la otra casa no se toca al cambiar) y el deshacer del súper recuerda los 3 últimos borrados.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Datos de ejemplo en zona de peligro:</strong> el botón ahora dice que borra todo, va en rojo y separado, y no se puede usar con una casa conectada. El silencio está a un toque en la barra principal y el botón Escanear ya no pulsa sin parar.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Foto propia y escáner simple:</strong> el alta manual admite foto del producto (cámara o galería) y el escáner abre en modo simple con el modo recordado visible y los demás colapsados.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.9.5-Casa */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-base)] border border-emerald-500 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 rounded-lg font-mono">
                    v3.9.5-Casa
                  </span>
                </div>
                <span className="text-xs text-gray-400">29 Octubre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-display">
                El escáner ya abre su propia cámara, y deja registro de lo que pasa
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Adiós a la cámara prestada:</strong> la app abre la cámara ella misma y muestra su propio video, en vez de depender de la librería que se quedaba en negro en el iPhone. Si el video no abre, ahora se sabe por qué.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Lectura en dos motores:</strong> si el teléfono trae detector nativo de códigos se usa; si no, o si falla, entra ZXing. Los mismos códigos de siempre: QR, EAN, UPC, Code 128, Code 39 e ITF.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Diagnóstico del escáner en el menú de herramientas:</strong> cada intento de cámara queda registrado (permiso, apertura, primer fotograma, reinicios, errores) con botones Copiar y Limpiar. Solo datos técnicos: sin fotos, sin códigos y sin contenido de tu lista. Si algo falla, copia el registro y pásalo a quien lo revisa.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Lo demás intacto:</strong> QR/Barras, Ticket, Escribir, las cuatro acciones al detectar, Modo Súper y Tomar Foto con Cámara Nativa siguen igual.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.9.4-Casa */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-base)] border border-emerald-500 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 rounded-lg font-mono">
                    v3.9.4-Casa
                  </span>
                </div>
                <span className="text-xs text-gray-400">29 Octubre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-display">
                La cámara nunca más en negro en silencio, y botones sin encimarse
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Aviso visible mientras conecta:</strong> con la cámara activa pero sin imagen todavía, el marco muestra "Conectando imagen…". Ya no hay cuadro negro sin explicación.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Error rápido, no a los 20 segundos:</strong> si en 12 segundos no llega un solo fotograma real, aparece el error con Reintentar y Tomar Foto, aunque queden reinicios. Y si la cámara tarda más de 15 segundos en abrir (aviso de permiso sin contestar), también avisa qué revisar.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>El vigilante solo sigue el video de verdad:</strong> ignora el video oculto sin stream que dejaba la librería, y al reiniciar deja 300 ms para que el iPhone libere la cámara antes de reabrirla.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>"Modo Súper" ya no tapa a "Guardar artículos":</strong> cuando la barra de guardar está visible, el botón naranja sube por encima de ella.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Una sola versión en toda la app:</strong> el menú Más y el menú de herramientas ya no presumen versiones sueltas (v5.0, v3.7.0): ambos muestran la versión real de Alacena.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Botones del escáner completos:</strong> las acciones ("+1 Entrada Despensa", "−1 Salida Consumo") ya no salen cortadas; el texto se ajusta en dos líneas si hace falta.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>El menú de herramientas ya se cierra al navegar:</strong> tocar fuera del menú (incluida la barra inferior) lo cierra; antes quedaba abierto tapando la vista nueva.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Modo Súper con salida a la vista:</strong> además del botón pequeño de arriba, ahora hay un botón grande "Salir del modo súper" abajo, y el contador solo muestra ✓ cuando de verdad llevas todo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Nada queda bajo la barra inferior:</strong> la lista deja aire al final para que el filtro "Todas las tiendas" y el último contenido nunca queden tapados por la navegación.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.9.3-Casa */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-base)] border border-emerald-500 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 rounded-lg font-mono">
                    v3.9.3-Casa
                  </span>
                </div>
                <span className="text-xs text-gray-400">28 Octubre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-display">
                Escáner con vigilante persistente: el video negro ya no se esconde tras los metadatos
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Sano solo si hay fotogramas de verdad:</strong> el vigilante ya no se fía de que el video tenga metadatos y ancho (en iOS eso puede ser negro total); ahora exige que el reloj del video avance entre muestras. Reloj quieto = video negro, aunque todo lo demás parezca bien.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>El vigilante ya no se retira nunca:</strong> mientras el escáner esté abierto y activo, sigue vigilando el flujo. Un apagón tardío (aviso del sistema, cambio de app) también se recupera: reinicia el escáner hasta 3 veces y, si sigue sin imagen, muestra el error con Reintentar y Foto en vez de un cuadro negro muerto.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>El fallo de play() ya no se traga en silencio:</strong> si arrancar el video falla (típico tras el aviso de permiso), reintenta una vez y si sigue fallando dispara el reinicio del vigilante.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.9.2-Casa */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-base)] border border-emerald-500 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 rounded-lg font-mono">
                    v3.9.2-Casa
                  </span>
                  <span className="text-xs font-semibold text-gray-400">ANTERIOR</span>
                </div>
                <span className="text-xs text-gray-400">28 Octubre 2026</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-display">
                Auditoría de practicidad: nada que borre datos sin respaldo, acciones diarias a un toque y botones de 44 px
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>"Datos de Ejemplo" ya no borra sin respaldo:</strong> antes de reemplazar despensa, lista, zonas, recetas, casas y bitácora, descarga automáticamente una copia de seguridad JSON de tus datos reales, y la confirmación advierte que los BORRA.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>📸 Foto de lista en el home del Súper:</strong> botón primario junto a "Modo Súper" y "Escanear / Ticket", ya no escondido en el menú "…". En la barra móvil, "Cava / Más" ahora es "Más".</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>El escáner recuerda su modo:</strong> el último modo elegido (Consultar, Entrada, Consumo o Súper) queda guardado y se restaura al abrir; solo la primera vez abre en Consultar. La foto de código ya abre la cámara directa.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Borrar una zona ya no deja huérfanos:</strong> sus productos se mueven a la primera ubicación restante y la confirmación lo dice así.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Foto-lista con OCR automático:</strong> al confirmar la foto, el OCR arranca solo (con botón Cancelar) y el botón queda solo como reintento.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Botones táctiles de 44 px en inventario y "+ Súper" visible en iPhone;</strong> cambiar a un rol no-admin avisa que el menú es reducido y cómo volver a Admin; el respaldo ya escribe la versión real de la app y las importaciones usan la tienda del ticket o "Supermercado", nunca una inventada.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.7.0-Enterprise-Luxe */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-base)] border border-emerald-500 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 rounded-lg font-mono">
                    v3.7.0-Enterprise-Luxe
                  </span>
                  <span className="text-xs font-semibold text-gray-400">ANTERIOR</span>
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
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-base)] border border-[var(--border-soft)] shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-[var(--gold)] bg-[var(--gold)]/20 border border-[var(--gold)]/40 rounded-lg font-mono">
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
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-base)] border border-[var(--border-soft)] shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-[var(--gold)] bg-[var(--gold)]/20 border border-[var(--gold)]/40 rounded-lg font-mono">
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
                  <span className="text-[var(--gold)] font-bold">✓</span>
                  <span><strong>Edición y Alta Completa de Catálogos:</strong> Interfaz responsiva que permite crear y modificar en línea tiendas, personal que registra, categorías y unidades de medida con selector de emojis.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--gold)] font-bold">✓</span>
                  <span><strong>Resolución de Hojas QR en Blanco:</strong> Corrección de interpolación en el motor HTML y dimensionamiento de iframe (900x1200px) para impresión física 100% nítida y fiel.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--gold)] font-bold">✓</span>
                  <span><strong>Diseño Web-Responsive Total:</strong> Optimización en teléfonos móviles (iPhone / Android) y tabletas con tap-targets de mínimo 44px y navegación sin recortes.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.5.2-Enterprise-Luxe */}
            <div className="p-5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-soft)] shadow-md">
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
                  <span className="text-[var(--gold)] font-bold">✓</span>
                  <span><strong>Motor de Deduplicación Fonética y Ortográfica (`deduplication.js`):</strong> Normalización de acentos, plurales (`tomates` vs `tomate`) y raíces compuestas. Se evitan duplicados en despensa, lista de compras y recetas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--gold)] font-bold">✓</span>
                  <span><strong>Steppers Táctiles Directos en Lista de Compra:</strong> Botones rápidos `+` y `-` integrados en cada tarjeta para alterar cantidades en un solo toque sin abrir formularios modales.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--gold)] font-bold">✓</span>
                  <span><strong>Impresión Física QR sin Páginas en Blanco:</strong> Generación a través de iframe aislado invisible que renderiza HTML puro blanco con códigos QR en base64 de alto contraste para impresión física infalible.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.5.1-Enterprise-Luxe */}
            <div className="p-5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-soft)] shadow-md">
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
                  <span className="text-[var(--gold)] font-bold">✓</span>
                  <span><strong>Corrección de Hook Ordering en Modal QR:</strong> Eliminación de condición temprana que rompía la ejecución de React (#310), asegurando apertura instantánea sin pantallas blancas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--gold)] font-bold">✓</span>
                  <span><strong>Aislamiento CSS @media print:</strong> Desbloqueo de contenedores con scroll para que la impresión física (`window.print()`) pagine limpiamente en papel blanco con tinta negra de máximo contraste.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--gold)] font-bold">✓</span>
                  <span><strong>Motor Vectorial de QR con qrcode:</strong> Generación de matrices QR reales en los 4 formatos (Stickers para frascos, Tablero maestro de cocina, Collarines de cava y Catálogo) para escaneo 100% certero con teléfonos móviles.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.5.0-Enterprise-Luxe */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-base)] border border-white/10 opacity-80">
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
                  <span className="text-[var(--gold)] font-bold">✓</span>
                  <span><strong>Personalización de Temas & Paletas:</strong> 6 temas de lujo (Luxe Noir, Cava Forest, Borgoña Gran Reserva, Zafiro Presidencial, Espresso Cobrizo y Modo Claro Luxe Cream) con inyección dinámica de CSS variables y guardado local.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--gold)] font-bold">✓</span>
                  <span><strong>Centro de Catálogos & Opciones Desplegables:</strong> Gestión centralizada y menús interactivos para Tiendas Habituales (Costco, City Market, etc.) y Personal que Registra (María, Chef, Chofer, Patrón) con chips de 1 toque y adición instantánea en formularios.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--gold)] font-bold">✓</span>
                  <span><strong>Motor de Desduplicación y Consolidación de Compras:</strong> Fusión estricta de insumos repetidos con suma de cantidades en vez de duplicar filas, más botón "🧹 Desduplicar" y "🗑️ Limpiar Marcados".</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--gold)] font-bold">✓</span>
                  <span><strong>Historial de Compras & Devoluciones:</strong> Registro de órdenes de compra con capacidad de eliminar o revertir artículos ingresados por error descontándolos automáticamente de la despensa.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--gold)] font-bold">✓</span>
                  <span><strong>Eliminación Directa en Inventario:</strong> Botón de borrado con confirmación en tarjetas de alacena, cava, tabla y modal de edición.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--gold)] font-bold">✓</span>
                  <span><strong>Ecosistema QR Vectorial:</strong> Generador de stickers con líneas de envasado/caducidad para botes/sobres, collarines de cava y tablero maestro de pedidos para puertas.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.4.0-Master */}
            <div className="p-5 rounded-2xl bg-[var(--bg-elevated)]/80 border border-[var(--border-soft)] hover:border-[var(--border-strong)] transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-[var(--ink-secondary)] bg-white/5 border border-white/10 rounded-lg font-mono">
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
                  <span className="text-[var(--gold)] font-bold">✓</span>
                  <span><strong>Importador Bidireccional & OCR:</strong> Extracción visual con visión artificial Tesseract.js de libretas y tickets con pre-procesamiento de contraste, además de soporte para WhatsApp y archivos PDF/TXT.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--gold)] font-bold">✓</span>
                  <span><strong>Auditoría & Test Suite Aprobada:</strong> 100% de éxito en pruebas automatizadas de extracción de datos, filtrado de saludos y normalización de fracciones (1/2 kg).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--gold)] font-bold">✓</span>
                  <span><strong>Menú Dinámico (Ocultar & Agregar Pestañas):</strong> Posibilidad de apagar visibilidad de secciones que no se utilicen, renombrar cualquiera y agregar nuevas pestañas personalizadas vinculadas a zonas del hogar.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--gold)] font-bold">✓</span>
                  <span><strong>Manual e Instructivo Integral en Pantalla:</strong> Guía interactiva de 9 secciones con buscador y opción de impresión/PDF para la carpeta del personal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--gold)] font-bold">✓</span>
                  <span><strong>Web NFC & Códigos ALC-XXXX:</strong> Grabación de chips adhesivos con 1 toque y auto-generación de códigos permanentes.</span>
                </li>
              </ul>
            </div>

            {/* Release v3.3.0-Perfection */}
            <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] transition-all">
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
            <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold text-[var(--gold)] bg-[var(--gold)]/20 border border-[var(--gold)]/40 rounded-lg">
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
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-[var(--border-soft)] hover:border-[var(--border-strong)] transition-all">
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

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[var(--bg-elevated)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Alacena · Novedades de la app</span>
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
