import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/inventory_item_model.dart';
import '../providers/inventory_provider.dart';
import '../../households/providers/household_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../scanner/presentation/quick_scan_bottom_sheet.dart';
import '../../labels/services/label_printer_service.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/widgets/stock_status_badge.dart';

class InventoryScreen extends ConsumerWidget {
  const InventoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(filteredInventoryProvider);
    final household = ref.watch(selectedHouseholdProvider);
    final isAdmin = ref.watch(isUserAdminProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Resumen de inventario en tiempo real
    final optimalCount = items.where((i) => i.stockStatus == 'OPTIMAL').length;
    final lowCount = items.where((i) => i.stockStatus == 'LOW').length;
    final outCount = items.where((i) => i.stockStatus == 'OUT_OF_STOCK').length;

    return Column(
      children: [
        // Fila de Búsqueda y Botón de Autorelleno Rápido
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Buscar en alacena, cava o repisas...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    filled: true,
                    fillColor: isDark ? AppColors.darkSurface : AppColors.lightSurfaceVariant,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  onChanged: (val) {
                    ref.read(searchQueryProvider.notifier).setQuery(val);
                  },
                ),
              ),
              const SizedBox(width: 8),

              // BOTON DE AUTORELLENADO INTELIGENTE
              Tooltip(
                message: 'Autorellenar con productos típicos de alacena y cava',
                child: FilledButton.tonalIcon(
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primaryLight.withValues(alpha: 0.15),
                    foregroundColor: AppColors.primaryLight,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  ),
                  icon: const Icon(Icons.auto_fix_high, size: 18),
                  label: const Text(
                    'Autorellenar',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  onPressed: () {
                    ref.read(inventoryListProvider.notifier).populateStarterPack(household.id);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          '📦 ¡Alacena y Cava de ${household.name} autorellenadas con éxito!',
                        ),
                        backgroundColor: AppColors.optimal,
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),

        // Barra de métricas glanceables (Semáforo general)
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          child: Row(
            children: [
              _MetricPill(
                label: 'Óptimos',
                count: optimalCount,
                color: AppColors.optimal,
                isDark: isDark,
              ),
              const SizedBox(width: 8),
              _MetricPill(
                label: 'Bajos',
                count: lowCount,
                color: AppColors.low,
                isDark: isDark,
              ),
              const SizedBox(width: 8),
              _MetricPill(
                label: 'Agotados',
                count: outCount,
                color: AppColors.outOfStock,
                isDark: isDark,
              ),
              const Spacer(),
              Text(
                '${items.length} artículos',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
              ),
            ],
          ),
        ),

        // Lista glanceable de productos con acciones ultra-fáciles a 1 tap
        Expanded(
          child: items.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.kitchen_outlined,
                        size: 64,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Esta zona está vacía',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Presiona "Autorellenar" para cargar la despensa básica.',
                        style: TextStyle(fontSize: 13, color: Colors.grey),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.auto_fix_high),
                        label: const Text('Autorellenar Alacena Ahora'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        ),
                        onPressed: () {
                          ref.read(inventoryListProvider.notifier).populateStarterPack(household.id);
                        },
                      ),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 6, 16, 96),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final item = items[index];
                    return _InventoryItemCard(
                      item: item,
                      isAdmin: isAdmin,
                      isDark: isDark,
                      onTap: () {
                        // Tocar el cuerpo abre el BottomSheet de 2 taps
                        QuickScanBottomSheet.show(context, item: item, scanMethod: 'MANUAL');
                      },
                      onQuickDecrease: () {
                        // ACCIÓN A 1 TAP: Descontar directo sin abrir modales
                        if (item.currentQuantity > 0) {
                          ref.read(inventoryListProvider.notifier).adjustStock(
                                item.id,
                                -1,
                                scanMethod: 'QUICK_1_TAP',
                              );
                        }
                      },
                      onQuickIncrease: () {
                        // ACCIÓN A 1 TAP: Reabastecer directo sin abrir modales
                        ref.read(inventoryListProvider.notifier).adjustStock(
                              item.id,
                              1,
                              scanMethod: 'QUICK_1_TAP',
                            );
                      },
                      onPrintLabel: () async {
                        // Imprimir etiqueta térmica formateada
                        await LabelPrinterService.printLabel(item);
                      },
                    );
                  },
                ),
        ),
      ],
    );
  }
}

class _MetricPill extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  final bool isDark;

  const _MetricPill({
    required this.label,
    required this.count,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 5),
          Text(
            '$count $label',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _InventoryItemCard extends StatelessWidget {
  final InventoryItem item;
  final bool isAdmin;
  final bool isDark;
  final VoidCallback onTap;
  final VoidCallback onQuickDecrease;
  final VoidCallback onQuickIncrease;
  final VoidCallback onPrintLabel;

  const _InventoryItemCard({
    required this.item,
    required this.isAdmin,
    required this.isDark,
    required this.onTap,
    required this.onQuickDecrease,
    required this.onQuickIncrease,
    required this.onPrintLabel,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = AppColors.getStatusColor(item.stockStatus);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Barra vertical semafórica indicadora
              Container(
                width: 5,
                height: 58,
                decoration: BoxDecoration(
                  color: statusColor,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(width: 12),

              // Información del producto
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            item.name,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (item.isHighValue)
                          Container(
                            margin: const EdgeInsets.only(left: 4),
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.wineAccent.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'ALTO VALOR',
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: AppColors.wineAccent,
                              ),
                            ),
                          ),
                        if (item.requiresMetadataUpdate)
                          Container(
                            margin: const EdgeInsets.only(left: 4),
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              '⚠️ PENDIENTE',
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFFF59E0B),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '📍 ${item.zoneName} • ID: ${item.effectiveShortId}',
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        StockStatusBadge(status: item.stockStatus),
                        const SizedBox(width: 8),
                        if (isAdmin)
                          Text(
                            '\$${item.unitPrice.toStringAsFixed(0)} ${item.currency}',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            ),
                          ),
                        const Spacer(),

                        // Boton para imprimir etiqueta termica (Dymo/Brother)
                        IconButton(
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                          icon: Icon(
                            Icons.print_outlined,
                            size: 18,
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          ),
                          tooltip: 'Imprimir etiqueta térmica QR',
                          onPressed: onPrintLabel,
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 10),

              // ACCIONES ULTRA-RÁPIDAS A 1 TAP: [-] CANTIDAD [+]
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkBg : AppColors.lightSurfaceVariant,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Boton Descontar Stock a 1 Tap (-)
                    IconButton(
                      icon: const Icon(Icons.remove, size: 18),
                      color: item.currentQuantity > 0 ? AppColors.outOfStock : Colors.grey,
                      padding: const EdgeInsets.all(4),
                      constraints: const BoxConstraints(),
                      onPressed: item.currentQuantity > 0 ? onQuickDecrease : null,
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '${item.currentQuantity}',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: statusColor,
                            ),
                          ),
                          Text(
                            item.unit.split(' ').first,
                            style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                    ),
                    // Boton Agregar Stock a 1 Tap (+)
                    IconButton(
                      icon: const Icon(Icons.add, size: 18),
                      color: AppColors.optimal,
                      padding: const EdgeInsets.all(4),
                      constraints: const BoxConstraints(),
                      onPressed: onQuickIncrease,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
