import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/inventory_item_model.dart';
import '../providers/inventory_provider.dart';
import 'edit_product_dialog.dart';
import 'inventory_table_desktop.dart';
import 'add_product_manual_modal.dart';
import '../../households/providers/household_provider.dart';
import '../../households/presentation/quick_zone_dialogs.dart';
import '../../auth/providers/auth_provider.dart';
import '../../scanner/presentation/quick_scan_bottom_sheet.dart';
import '../../labels/presentation/thermal_print_modal.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/tokens.dart';

class InventoryScreen extends ConsumerWidget {
  const InventoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(filteredInventoryProvider);
    final allHouseholdItems = ref.watch(inventoryListProvider);
    final household = ref.watch(selectedHouseholdProvider);
    final selectedZone = ref.watch(selectedZoneProvider);
    final isAdmin = ref.watch(isUserAdminProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Resumen de inventario en tiempo real
    final optimalCount = items.where((i) => i.stockStatus == 'OPTIMAL').length;
    final lowCount = items.where((i) => i.stockStatus == 'LOW').length;
    final outCount = items.where((i) => i.stockStatus == 'OUT_OF_STOCK').length;

    // Valor Total en Pesos Mexicanos de los artículos visibles
    final double totalValueMXN = items.fold(
      0.0,
      (sum, item) => sum + (item.currentQuantity * item.unitPrice),
    );

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. BARRA SUPERIOR DE ACCIÓN: BUSCADOR + CAPTURA MANUAL + AUTORELLENO
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: 'Buscar en ${household.name} (nombre, categoría, código)...',
                      hintStyle: TextStyle(
                        fontSize: 13,
                        color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary,
                      ),
                      prefixIcon: const Icon(Icons.search, size: 20),
                      filled: true,
                      fillColor: isDark ? AppTokens.darkSurface : AppTokens.lightSurface,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide(
                          color: isDark ? AppTokens.darkBorder : AppTokens.lightBorder,
                        ),
                      ),
                    ),
                    onChanged: (val) {
                      ref.read(searchQueryProvider.notifier).setQuery(val);
                    },
                  ),
                ),
                const SizedBox(width: 10),

                // BOTON PROMINENTE: + CAPTURAR ARTÍCULO MANUAL
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTokens.emeraldPrimary,
                    foregroundColor: Colors.white,
                    elevation: 1,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  icon: const Icon(Icons.add, size: 20),
                  label: Text(
                    '+ Capturar Producto',
                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                  onPressed: () => AddProductManualModal.show(context),
                ),
                const SizedBox(width: 8),

                // BOTÓN DE AUTORELLENADO INTELIGENTE
                Tooltip(
                  message: 'Cargar 10 productos típicos de alacena y cava en esta casa',
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: isDark ? AppTokens.emeraldLight : AppTokens.emeraldPrimary,
                      side: BorderSide(
                        color: (isDark ? AppTokens.emeraldLight : AppTokens.emeraldPrimary).withValues(alpha: 0.4),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    icon: const Icon(Icons.auto_fix_high, size: 18),
                    label: const Text('Autorellenar', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    onPressed: () {
                      ref.read(inventoryListProvider.notifier).populateStarterPack(household.id);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('📦 Alacena y Cava de "${household.name}" autorellenadas con éxito.'),
                          backgroundColor: AppColors.optimal,
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),

          // 2. BARRA DE ZONAS FÍSICAS (ALACENA, CAVA, CUARTO FRÍO, REFRIGERADOR...)
          // Permite cambiar entre zonas, renombrar (✏️) o agregar (+ Nueva Zona) en 1 toque.
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 40,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: household.zones.length + 1,
                      separatorBuilder: (_, _) => const SizedBox(width: 8),
                      itemBuilder: (context, index) {
                        // Botón final: + Nueva Zona
                        if (index == household.zones.length) {
                          return ActionChip(
                            avatar: const Icon(Icons.add_circle_outline, size: 16, color: AppTokens.emeraldLight),
                            label: const Text(
                              '+ Nueva Zona / Cuarto Frío',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTokens.emeraldLight),
                            ),
                            backgroundColor: AppTokens.emeraldPrimary.withValues(alpha: 0.12),
                            side: BorderSide(color: AppTokens.emeraldLight.withValues(alpha: 0.3)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            onPressed: () => AddZoneDialog.show(context, household.id),
                          );
                        }

                        final zone = household.zones[index];
                        final isSelected = selectedZone == zone.id;

                        // Contar productos en esta zona
                        final zoneCount = zone.id == 'all'
                            ? allHouseholdItems.where((i) => i.householdId == household.id).length
                            : allHouseholdItems
                                .where((i) => i.householdId == household.id && i.zoneId == zone.id)
                                .length;

                        return FilterChip(
                          avatar: Icon(
                            _getZoneIcon(zone.type),
                            size: 15,
                            color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                          ),
                          label: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                '${zone.name} ($zoneCount)',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                  color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                                ),
                              ),
                              if (zone.id != 'all') ...[
                                const SizedBox(width: 6),
                                InkWell(
                                  onTap: () => EditZoneDialog.show(context, household.id, zone),
                                  borderRadius: BorderRadius.circular(10),
                                  child: Padding(
                                    padding: const EdgeInsets.all(2.0),
                                    child: Icon(
                                      Icons.edit,
                                      size: 13,
                                      color: isSelected ? Colors.white70 : Colors.grey,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          selected: isSelected,
                          selectedColor: AppTokens.emeraldPrimary,
                          backgroundColor: isDark ? AppTokens.darkSurface : AppTokens.lightSurface,
                          side: BorderSide(
                            color: isSelected
                                ? AppTokens.emeraldPrimary
                                : (isDark ? AppTokens.darkBorder : AppTokens.lightBorder),
                          ),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          onSelected: (_) {
                            ref.read(selectedZoneProvider.notifier).setZone(zone.id);
                          },
                        );
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 3. BARRA DE MÉTRICAS GLANCEABLES (Semáforo + Valor Total en MXN)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
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
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isDark ? AppTokens.darkSurface : AppTokens.lightSurface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: isDark ? AppTokens.darkBorder : AppTokens.lightBorder),
                  ),
                  child: Row(
                    children: [
                      Text(
                        '${items.length} artículos  •  ',
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600,
                          color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary,
                        ),
                      ),
                      Text(
                        'Valor: \$${totalValueMXN.toStringAsFixed(0)} MXN',
                        style: GoogleFonts.inter(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w800,
                          color: isDark ? AppTokens.emeraldLight : AppTokens.emeraldPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // 4. LISTA O TABLA DESKTOP DE PRODUCTOS
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
                          'No hay artículos en esta zona',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Captura un producto de forma manual o presiona "Autorellenar".',
                          style: TextStyle(fontSize: 13, color: Colors.grey),
                        ),
                        const SizedBox(height: 18),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            ElevatedButton.icon(
                              icon: const Icon(Icons.add),
                              label: const Text('Capturar Producto Manual'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTokens.emeraldPrimary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                              ),
                              onPressed: () => AddProductManualModal.show(context),
                            ),
                            const SizedBox(width: 10),
                            OutlinedButton.icon(
                              icon: const Icon(Icons.auto_fix_high),
                              label: const Text('Autorellenar Demo'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppTokens.emeraldLight,
                                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                              ),
                              onPressed: () {
                                ref.read(inventoryListProvider.notifier).populateStarterPack(household.id);
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  )
                : (MediaQuery.of(context).size.width >= 1024
                    ? InventoryTableDesktop(
                        items: items,
                        isAdmin: isAdmin,
                        onItemTap: (item) =>
                            QuickScanBottomSheet.show(context, item: item, scanMethod: 'MANUAL'),
                        onAdjustTap: (item) => EditProductDialog.show(context, item),
                        onPrintLabelTap: (item) => ThermalPrintModal.show(context, item),
                        onQuickQuantityChange: (item, delta) {
                          if (delta > 0 || item.currentQuantity > 0) {
                            ref.read(inventoryListProvider.notifier).adjustStock(
                                  item.id,
                                  delta,
                                  scanMethod: 'QUICK_1_TAP',
                                );
                          }
                        },
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
                              QuickScanBottomSheet.show(context, item: item, scanMethod: 'MANUAL');
                            },
                            onQuickDecrease: () {
                              if (item.currentQuantity > 0) {
                                ref.read(inventoryListProvider.notifier).adjustStock(
                                      item.id,
                                      -1,
                                      scanMethod: 'QUICK_1_TAP',
                                    );
                              }
                            },
                            onQuickIncrease: () {
                              ref.read(inventoryListProvider.notifier).adjustStock(
                                    item.id,
                                    1,
                                    scanMethod: 'QUICK_1_TAP',
                                  );
                            },
                            onPrintLabel: () async {
                              await ThermalPrintModal.show(context, item);
                            },
                            onEdit: isAdmin ? () => EditProductDialog.show(context, item) : null,
                          );
                        },
                      )),
          ),
        ],
      ),
    );
  }

  IconData _getZoneIcon(String type) {
    switch (type) {
      case 'cellar':
        return Icons.wine_bar;
      case 'fridge':
        return Icons.ac_unit;
      case 'freezer':
        return Icons.severe_cold;
      case 'warehouse':
        return Icons.inventory_2;
      case 'bar':
        return Icons.liquor;
      case 'all':
        return Icons.grid_view;
      default:
        return Icons.kitchen;
    }
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
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(shape: BoxShape.circle, color: color),
          ),
          const SizedBox(width: 6),
          Text(
            '$label: $count',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white : Colors.black87,
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
  final VoidCallback? onEdit;

  const _InventoryItemCard({
    required this.item,
    required this.isAdmin,
    required this.isDark,
    required this.onTap,
    required this.onQuickDecrease,
    required this.onQuickIncrease,
    required this.onPrintLabel,
    this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = item.stockStatus == 'OPTIMAL'
        ? AppColors.optimal
        : (item.stockStatus == 'LOW' ? AppColors.low : AppColors.outOfStock);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppTokens.darkSurface : AppTokens.lightSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppTokens.darkBorder : AppTokens.lightBorder,
          width: 1,
        ),
        boxShadow: isDark ? null : [AppTokens.shadowSm],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                // Indicador visual de stock
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      '${item.currentQuantity}',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: statusColor,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),

                // Info del Producto
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              item.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700),
                            ),
                          ),
                          if (isAdmin) ...[
                            Text(
                              '\$${item.unitPrice.toStringAsFixed(0)} MXN',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: isDark ? AppTokens.emeraldLight : AppTokens.emeraldPrimary,
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              item.zoneName,
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            '${item.unit} • Meta: ${item.idealQuantity}',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),

                // Botones rápidos (- / +) y opciones
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.remove_circle_outline, size: 22),
                      color: item.currentQuantity > 0 ? AppColors.outOfStock : Colors.grey,
                      onPressed: item.currentQuantity > 0 ? onQuickDecrease : null,
                    ),
                    IconButton(
                      icon: const Icon(Icons.add_circle_outline, size: 22),
                      color: AppColors.optimal,
                      onPressed: onQuickIncrease,
                    ),
                    if (isAdmin && onEdit != null)
                      IconButton(
                        icon: const Icon(Icons.tune, size: 18),
                        onPressed: onEdit,
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
