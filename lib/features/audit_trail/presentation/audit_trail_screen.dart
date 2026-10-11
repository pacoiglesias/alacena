import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/audit_trail_provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/tokens.dart';

class AuditTrailScreen extends ConsumerStatefulWidget {
  const AuditTrailScreen({super.key});

  @override
  ConsumerState<AuditTrailScreen> createState() => _AuditTrailScreenState();
}

class _AuditTrailScreenState extends ConsumerState<AuditTrailScreen> {
  String _searchQuery = '';
  String _selectedActionFilter = 'TODOS';

  @override
  Widget build(BuildContext context) {
    final logs = ref.watch(auditTrailProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');

    // Filtrado interactivo
    final filteredLogs = logs.where((log) {
      if (_selectedActionFilter == 'RECETAS' && !log.action.contains('RECIPE')) {
        return false;
      }
      if (_selectedActionFilter == 'CONSUMOS' && log.quantityDelta >= 0) {
        return false;
      }
      if (_selectedActionFilter == 'ENTRADAS' && log.quantityDelta <= 0) {
        return false;
      }

      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        final matchItem = log.itemName.toLowerCase().contains(query);
        final matchUser = log.userEmail.toLowerCase().contains(query) ||
            log.userId.toLowerCase().contains(query);
        final matchMethod = log.scanMethod.toLowerCase().contains(query);
        if (!matchItem && !matchUser && !matchMethod) {
          return false;
        }
      }

      return true;
    }).toList();

    // Métricas del Kardex Forense
    double totalConsumedMXN = 0.0;
    double totalRestockedMXN = 0.0;
    for (final l in logs) {
      if (l.economicValueDelta < 0) {
        totalConsumedMXN += l.economicValueDelta.abs();
      } else if (l.economicValueDelta > 0) {
        totalRestockedMXN += l.economicValueDelta;
      }
    }

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header con Título y Estado Inalterable
          Padding(
            padding: const EdgeInsets.fromLTRB(AppTokens.s20, AppTokens.s16, AppTokens.s20, AppTokens.s8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTokens.emeraldPrimary.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.history_edu, color: AppTokens.emeraldLight, size: 22),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Bitácora Forense & Kardex de Usuarios',
                              style: GoogleFonts.inter(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                letterSpacing: -0.5,
                              ),
                            ),
                            Text(
                              'Trazabilidad total: quién registró cada artículo y quién consumió insumos para cada receta.',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppColors.optimal.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.optimal.withValues(alpha: 0.3)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.shield_outlined, color: AppColors.optimal, size: 14),
                          SizedBox(width: 5),
                          Text(
                            'INALTERABLE / APPEND-ONLY',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: AppColors.optimal,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Tarjetas de Métricas de Auditoría
                Row(
                  children: [
                    _buildMetricCard(
                      title: 'Movimientos Totales',
                      value: '${logs.length}',
                      icon: Icons.swap_vert,
                      color: Colors.blueAccent,
                      isDark: isDark,
                    ),
                    const SizedBox(width: 12),
                    _buildMetricCard(
                      title: 'Insumos Usados / Consumidos',
                      value: '\$${totalConsumedMXN.toStringAsFixed(0)} MXN',
                      icon: Icons.trending_down,
                      color: AppColors.outOfStock,
                      isDark: isDark,
                    ),
                    const SizedBox(width: 12),
                    _buildMetricCard(
                      title: 'Reabastecido / Comprado',
                      value: '\$${totalRestockedMXN.toStringAsFixed(0)} MXN',
                      icon: Icons.trending_up,
                      color: AppColors.optimal,
                      isDark: isDark,
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Buscador y Chips de Filtrado
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        decoration: InputDecoration(
                          hintText: 'Buscar por producto (ej. harina), usuario (ej. María), o método...',
                          hintStyle: TextStyle(
                            fontSize: 13,
                            color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary,
                          ),
                          prefixIcon: const Icon(Icons.search, size: 18),
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(vertical: 10),
                          filled: true,
                          fillColor: isDark ? AppTokens.darkSurface : AppTokens.lightSurface,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: isDark ? AppTokens.darkBorder : AppTokens.lightBorder,
                            ),
                          ),
                        ),
                        onChanged: (val) => setState(() => _searchQuery = val),
                      ),
                    ),
                    const SizedBox(width: 10),
                    _buildFilterChip('TODOS', 'Todos los Eventos'),
                    const SizedBox(width: 6),
                    _buildFilterChip('RECETAS', 'Recetas de Cocina'),
                    const SizedBox(width: 6),
                    _buildFilterChip('CONSUMOS', 'Salidas / Consumos'),
                    const SizedBox(width: 6),
                    _buildFilterChip('ENTRADAS', 'Entradas / Súper'),
                  ],
                ),
              ],
            ),
          ),

          // Lista de Registros Forenses
          Expanded(
            child: filteredLogs.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.rule_folder_outlined, size: 56, color: isDark ? Colors.white24 : Colors.black26),
                        const SizedBox(height: 12),
                        const Text('No se encontraron registros de auditoría', style: TextStyle(fontWeight: FontWeight.w600)),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 96),
                    itemCount: filteredLogs.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final log = filteredLogs[index];
                      final isNegative = log.quantityDelta < 0;
                      final isRecipe = log.action.contains('RECIPE');

                      return Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: isDark ? AppTokens.darkSurface : AppTokens.lightSurface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isDark ? AppTokens.darkBorder : AppTokens.lightBorder,
                          ),
                          boxShadow: isDark ? null : [AppTokens.shadowSm],
                        ),
                        child: Row(
                          children: [
                            // Badge de Cantidad y Signo
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: (isRecipe
                                        ? Colors.purple
                                        : (isNegative ? AppColors.outOfStock : AppColors.optimal))
                                    .withValues(alpha: 0.12),
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(
                                  isNegative ? '${log.quantityDelta}' : '+${log.quantityDelta}',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w900,
                                    color: isRecipe
                                        ? Colors.purpleAccent
                                        : (isNegative ? AppColors.outOfStock : AppColors.optimal),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),

                            // Detalles del Evento Forense
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        log.itemName,
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                      if (isRecipe) ...[
                                        const SizedBox(width: 8),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: Colors.purple.withValues(alpha: 0.15),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: const Text(
                                            'RECETA',
                                            style: TextStyle(
                                              fontSize: 9,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.purpleAccent,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                  const SizedBox(height: 3),
                                  Row(
                                    children: [
                                      Icon(Icons.person, size: 14, color: isDark ? Colors.white60 : Colors.black54),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Responsable: ${log.userEmail}',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: isDark ? AppTokens.emeraldLight : AppTokens.emeraldPrimary,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Método: ${log.scanMethod} • Stock: ${log.previousQuantity} ➔ ${log.newQuantity}',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // Columna de Fecha e Impacto Económico en MXN
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  dateFormat.format(log.timestamp),
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary,
                                  ),
                                ),
                                if (log.economicValueDelta != 0.0) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    '${isNegative ? '-' : '+'}\$${log.economicValueDelta.abs().toStringAsFixed(0)} ${log.currency}',
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w800,
                                      color: isNegative ? AppColors.outOfStock : AppColors.optimal,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String filterKey, String label) {
    final isSel = _selectedActionFilter == filterKey;
    return ChoiceChip(
      label: Text(label),
      selected: isSel,
      selectedColor: AppTokens.emeraldPrimary.withValues(alpha: 0.2),
      labelStyle: TextStyle(
        fontSize: 11,
        fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
        color: isSel ? AppTokens.emeraldLight : Colors.grey,
      ),
      onSelected: (val) {
        if (val) setState(() => _selectedActionFilter = filterKey);
      },
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required bool isDark,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isDark ? AppTokens.darkSurface : AppTokens.lightSurface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: isDark ? AppTokens.darkBorder : AppTokens.lightBorder),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
