import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';
import '../services/audio_feedback_service.dart';
import '../theme/tokens.dart';

/// Modal Elegante del Registro de Versiones y Mejoras del Sistema (Changelog)
class SystemChangelogModal extends StatefulWidget {
  const SystemChangelogModal({super.key});

  static const String currentVersion = 'v2.4.0-Titanium-Nova';
  static const String releaseDate = '11 Octubre 2026';

  static void show(BuildContext context) {
    AudioFeedbackService.click();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const SystemChangelogModal(),
    );
  }

  @override
  State<SystemChangelogModal> createState() => _SystemChangelogModalState();
}

class _SystemChangelogModalState extends State<SystemChangelogModal> {
  bool _isMuted = AudioFeedbackService.isMuted;

  void _toggleMute() {
    AudioFeedbackService.toggleMute();
    setState(() {
      _isMuted = AudioFeedbackService.isMuted;
    });
    if (!_isMuted) {
      AudioFeedbackService.click();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final surfaceColor = isDark ? AppTokens.darkSurface : AppTokens.lightSurface;
    final borderColor = isDark ? AppTokens.darkBorder : AppTokens.lightBorder;
    final textPrimary = isDark ? AppTokens.darkTextPrimary : AppTokens.lightTextPrimary;
    final textSecondary = isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
      ),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border.all(color: borderColor, width: 1),
      ),
      child: Column(
        children: [
          // Handle superior
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 44,
            height: 4,
            decoration: BoxDecoration(
              color: isDark ? Colors.white24 : Colors.black12,
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header con Versión y Botón de Sonido
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTokens.emeraldPrimary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(
                    Icons.verified_outlined,
                    color: AppTokens.emeraldLight,
                    size: 26,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            SystemChangelogModal.currentVersion,
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: textPrimary,
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.optimal.withValues(alpha: 0.18),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.optimal.withValues(alpha: 0.3)),
                            ),
                            child: const Text(
                              'PRODUCCIÓN',
                              style: TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w800,
                                color: AppColors.optimal,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Actualizado: ${SystemChangelogModal.releaseDate} • Firebase Spark 0 USD',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),

                // Botón de alternar audio
                IconButton(
                  tooltip: _isMuted ? 'Activar Sonidos' : 'Silenciar Sonidos',
                  onPressed: _toggleMute,
                  icon: Icon(
                    _isMuted ? Icons.volume_off : Icons.volume_up,
                    color: _isMuted ? AppColors.outOfStock : AppTokens.emeraldLight,
                  ),
                ),
                IconButton(
                  onPressed: () {
                    AudioFeedbackService.click();
                    Navigator.pop(context);
                  },
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
          ),

          const Divider(height: 1),

          // Banco de Prueba de Sonido
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF141A1E) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isDark ? const Color(0xFF233038) : const Color(0xFFCBD5E1),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.music_note, size: 16, color: AppTokens.emeraldLight),
                    const SizedBox(width: 6),
                    Text(
                      'BANCO DE PRUEBA DE AUDIO SENSORIAL (WEB AUDIO API)',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                        color: textSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    _AudioTestButton(
                      label: 'Clic Táctil',
                      icon: Icons.touch_app,
                      onTap: AudioFeedbackService.click,
                    ),
                    _AudioTestButton(
                      label: 'Éxito Armónico',
                      icon: Icons.check_circle,
                      color: AppColors.optimal,
                      onTap: AudioFeedbackService.success,
                    ),
                    _AudioTestButton(
                      label: 'Alerta / Stock',
                      icon: Icons.warning_amber,
                      color: AppColors.low,
                      onTap: AudioFeedbackService.warning,
                    ),
                    _AudioTestButton(
                      label: 'Cocina Chef',
                      icon: Icons.restaurant,
                      color: const Color(0xFF8B5CF6),
                      onTap: AudioFeedbackService.cook,
                    ),
                    _AudioTestButton(
                      label: 'Borrado',
                      icon: Icons.delete_outline,
                      color: AppColors.outOfStock,
                      onTap: AudioFeedbackService.delete,
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Lista de Mejoras (Timeline de Changelog)
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              children: const [
                _ChangelogItem(
                  tag: 'v2.4.0',
                  badge: 'HOY',
                  badgeColor: AppTokens.emeraldLight,
                  title: 'Captura Manual Rápida, Zonas Editables y Motor de Audio',
                  date: '11 Octubre 2026',
                  changes: [
                    '✨ Botón prominente "+ Capturar Producto" sin necesidad de escaneo de barras.',
                    '✏️ Gestión de Zonas Físicas Inline: Edición y renombrado con 1 toque en chips de Cava, Cuarto Frío, etc.',
                    '🔊 Motor de Audio Sensorial (Web Audio API): Retroalimentación acústica instantánea para clics, guardado y alertas.',
                    '🏷️ Moneda Estricta MXN (\$): Eliminación total de divisas extranjeras en compras, recetas e inventario.',
                    '📌 Badge de Versión Visible y Log interactivo de mejoras del sistema en tiempo real.',
                  ],
                ),
                _ChangelogItem(
                  tag: 'v2.3.0',
                  badge: 'RECIENTE',
                  badgeColor: Color(0xFF3B82F6),
                  title: 'Módulo de Recetas de Restaurante y Deducción Automática',
                  date: '11 Octubre 2026',
                  changes: [
                    '🍳 Sistema de Recetas con cálculo de costo por porción en Pesos Mexicanos (MXN).',
                    '⚡ Función "Cocinar y Descontar": Descuenta insumos exactos del inventario y solicita quién realizó la preparación.',
                    '🛡️ Bitácora Forense de Auditoría (Audit Trail) con registro inmutable de fecha, hora y responsable.',
                    '📍 Selector Pill minimalista de residencias para cambio instantáneo de casa activa.',
                  ],
                ),
                _ChangelogItem(
                  tag: 'v2.0.0',
                  badge: 'ARQUITECTURA',
                  badgeColor: Color(0xFF8B5CF6),
                  title: 'Arquitectura Enterprise Firebase Spark 0 USD',
                  date: '10 Octubre 2026',
                  changes: [
                    '☁️ Integración completa de Cloud Firestore en tier gratuito Spark sin costos mensuales.',
                    '🔐 Reglas de seguridad RBAC para Administrador y Personal de Cocina/Servicio.',
                    '📊 Dashboard financiero con valuación patrimonial y proyecciones de gasto.',
                    '🍷 Cava inteligente con control sommelier, añadas y zonas climáticas.',
                  ],
                ),
                SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AudioTestButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color? color;
  final VoidCallback onTap;

  const _AudioTestButton({
    required this.label,
    required this.icon,
    this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final btnColor = color ?? (isDark ? Colors.white : Colors.black87);

    return InkWell(
      borderRadius: BorderRadius.circular(10),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: (color ?? (isDark ? Colors.white : Colors.black87)).withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: (color ?? (isDark ? Colors.white : Colors.black87)).withValues(alpha: 0.25),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: btnColor),
            const SizedBox(width: 5),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: btnColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChangelogItem extends StatelessWidget {
  final String tag;
  final String badge;
  final Color badgeColor;
  final String title;
  final String date;
  final List<String> changes;

  const _ChangelogItem({
    required this.tag,
    required this.badge,
    required this.badgeColor,
    required this.title,
    required this.date,
    required this.changes,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textPrimary = isDark ? AppTokens.darkTextPrimary : AppTokens.lightTextPrimary;
    final textSecondary = isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary;

    return Container(
      margin: const EdgeInsets.only(bottom: 18),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppTokens.darkSurfaceVariant : AppTokens.lightSurfaceVariant,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppTokens.darkBorder : AppTokens.lightBorder,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: badgeColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: badgeColor.withValues(alpha: 0.3)),
                ),
                child: Text(
                  tag,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: badgeColor,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: badgeColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  badge,
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w800,
                    color: badgeColor,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                date,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: textPrimary,
            ),
          ),
          const SizedBox(height: 10),
          ...changes.map(
            (c) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Text(
                c,
                style: GoogleFonts.inter(
                  fontSize: 12.5,
                  height: 1.35,
                  color: textSecondary,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
