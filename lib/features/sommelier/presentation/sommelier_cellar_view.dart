import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../inventory/models/inventory_item_model.dart';
import '../../inventory/providers/inventory_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../labels/services/label_printer_service.dart';
import '../../scanner/presentation/quick_scan_bottom_sheet.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/widgets/stock_status_badge.dart';

class SommelierCellarView extends ConsumerWidget {
  const SommelierCellarView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final allItems = ref.watch(filteredInventoryProvider);
    final wineItems = allItems.where((i) => i.zoneId == 'cava' || i.category.contains('Vino') || i.category.contains('Destilados') || i.category.contains('Espumosos')).toList();
    final isAdmin = ref.watch(isUserAdminProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Calcular valuación total de la cava en tiempo real en el cliente ($0 costo)
    final totalCellarValue = wineItems.fold<double>(0, (sum, item) => sum + item.totalInventoryValue);
    final totalBottles = wineItems.fold<int>(0, (sum, item) => sum + item.currentQuantity);

    return Column(
      children: [
        // Banner Sommelier Ejecutivo
        Container(
          margin: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [
                Color(0xFF4A0E17), // Borgoña profundo
                Color(0xFF881337), // Vino intenso
                Color(0xFF1E293B),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: AppColors.wineAccent.withValues(alpha: 0.3),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
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
                          color: Colors.white.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.wine_bar, color: Colors.white, size: 22),
                      ),
                      const SizedBox(width: 10),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Cava Inteligente Sommelier',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'Enriquecido con Vivino & Notas de Cata',
                            style: TextStyle(color: Colors.white70, fontSize: 11),
                          ),
                        ],
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.goldAccent.withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.goldAccent),
                    ),
                    child: const Text(
                      '14°C • 70% HR',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  _SummaryMetric(
                    label: 'Botellas en Cava',
                    value: '$totalBottles',
                    textColor: Colors.white,
                  ),
                  const SizedBox(width: 24),
                  if (isAdmin)
                    _SummaryMetric(
                      label: 'Valuación Cava',
                      value: '\$${totalCellarValue.toStringAsFixed(0)} MXN',
                      textColor: AppColors.goldAccent,
                    ),
                ],
              ),
            ],
          ),
        ),

        // Lista de Vinos y Etiquetas
        Expanded(
          child: wineItems.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.wine_bar, size: 64, color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                      const SizedBox(height: 12),
                      const Text(
                        'No hay etiquetas registradas en la Cava',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 6, 16, 96),
                  itemCount: wineItems.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final wine = wineItems[index];
                    return _WineCard(
                      wine: wine,
                      isAdmin: isAdmin,
                      isDark: isDark,
                      onTap: () {
                        QuickScanBottomSheet.show(context, item: wine, scanMethod: 'SOMMELIER_VIEW');
                      },
                      onQuickDecrease: () {
                        if (wine.currentQuantity > 0) {
                          ref.read(inventoryListProvider.notifier).adjustStock(
                                wine.id,
                                -1,
                                scanMethod: 'SOMMELIER_UNCORK',
                              );
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('🍷 Descorche registrado: -1 ${wine.name}'),
                              backgroundColor: AppColors.wineAccent,
                              duration: const Duration(seconds: 2),
                            ),
                          );
                        }
                      },
                      onQuickIncrease: () {
                        ref.read(inventoryListProvider.notifier).adjustStock(
                              wine.id,
                              1,
                              scanMethod: 'SOMMELIER_RESTOCK',
                            );
                      },
                      onPrintLabel: () async {
                        await LabelPrinterService.printLabel(wine);
                      },
                    );
                  },
                ),
        ),
      ],
    );
  }
}

class _SummaryMetric extends StatelessWidget {
  final String label;
  final String value;
  final Color textColor;

  const _SummaryMetric({
    required this.label,
    required this.value,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: Colors.white70)),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: textColor),
        ),
      ],
    );
  }
}

class _WineCard extends StatelessWidget {
  final InventoryItem wine;
  final bool isAdmin;
  final bool isDark;
  final VoidCallback onTap;
  final VoidCallback onQuickDecrease;
  final VoidCallback onQuickIncrease;
  final VoidCallback onPrintLabel;

  const _WineCard({
    required this.wine,
    required this.isAdmin,
    required this.isDark,
    required this.onTap,
    required this.onQuickDecrease,
    required this.onQuickIncrease,
    required this.onPrintLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Nombre y Rating Vivino
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.wineAccent.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.wine_bar, color: AppColors.wineAccent, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          wine.name,
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                          maxLines: 2,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '📍 ${wine.zoneName} • ${wine.category}',
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.amber.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.amber.withValues(alpha: 0.4)),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.star, size: 14, color: Colors.amber),
                        SizedBox(width: 4),
                        Text(
                          '4.8 Vivino',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.amber),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Chips de Maridaje & Notas de Cata
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: [
                  _WineChip(label: '🍖 Cortes de carne', color: AppColors.primaryLight),
                  _WineChip(label: '🧀 Quesos curados', color: AppColors.goldAccent),
                  _WineChip(label: '🍇 Tempranillo / Tinto Fino', color: AppColors.wineAccent),
                  _WineChip(label: '⏳ Ventana: 2024-2042', color: AppColors.optimal),
                ],
              ),
              const SizedBox(height: 14),

              // Barra inferior: Stock, Precio e Impresión
              Row(
                children: [
                  StockStatusBadge(status: wine.stockStatus),
                  const SizedBox(width: 10),
                  if (isAdmin)
                    Text(
                      '\$${wine.unitPrice.toStringAsFixed(0)} ${wine.currency}',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                      ),
                    ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.print_outlined, size: 20),
                    tooltip: 'Imprimir etiqueta térmica para botella',
                    onPressed: onPrintLabel,
                  ),
                  const SizedBox(width: 6),

                  // Botón de 1 Tap para Descorchar (-) y Guardar (+)
                  Container(
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.darkBg : AppColors.lightSurfaceVariant,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.remove, size: 18),
                          color: wine.currentQuantity > 0 ? AppColors.outOfStock : Colors.grey,
                          onPressed: wine.currentQuantity > 0 ? onQuickDecrease : null,
                          tooltip: 'Descorchar (-1)',
                        ),
                        Text(
                          '${wine.currentQuantity}',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: AppColors.getStatusColor(wine.stockStatus),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.add, size: 18),
                          color: AppColors.optimal,
                          onPressed: onQuickIncrease,
                          tooltip: 'Añadir a cava (+1)',
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _WineChip extends StatelessWidget {
  final String label;
  final Color color;

  const _WineChip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color),
      ),
    );
  }
}
