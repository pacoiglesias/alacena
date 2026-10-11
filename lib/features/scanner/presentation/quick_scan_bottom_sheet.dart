import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../inventory/models/inventory_item_model.dart';
import '../../inventory/providers/inventory_provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/widgets/stock_status_badge.dart';

class QuickScanBottomSheet extends ConsumerStatefulWidget {
  final InventoryItem? initialItem;
  final String scanMethod;

  const QuickScanBottomSheet({
    super.key,
    this.initialItem,
    this.scanMethod = 'QR',
  });

  static Future<void> show(
    BuildContext context, {
    InventoryItem? item,
    String scanMethod = 'QR',
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => QuickScanBottomSheet(
        initialItem: item,
        scanMethod: scanMethod,
      ),
    );
  }

  @override
  ConsumerState<QuickScanBottomSheet> createState() => _QuickScanBottomSheetState();
}

class _QuickScanBottomSheetState extends ConsumerState<QuickScanBottomSheet> {
  InventoryItem? _selectedItem;

  @override
  void initState() {
    super.initState();
    _selectedItem = widget.initialItem;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final allItems = ref.watch(filteredInventoryProvider);
    final item = _selectedItem ?? (allItems.isNotEmpty ? allItems.first : null);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 20,
            spreadRadius: 2,
          ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Tirador visual
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),

          // Header de Escaneo
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          widget.scanMethod == 'NFC' ? Icons.nfc : Icons.qr_code_scanner,
                          size: 16,
                          color: AppColors.primaryLight,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'MODO ESCÁNER (${widget.scanMethod})',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primaryLight,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 12),

          if (item == null)
            const Padding(
              padding: EdgeInsets.all(24.0),
              child: Text('No hay productos disponibles para escanear en esta zona.'),
            )
          else ...[
            // Si no vino preseleccionado, permitir escoger rápido en demo
            if (widget.initialItem == null && allItems.length > 1)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: DropdownButtonFormField<String>(
                  value: item.id,
                  decoration: InputDecoration(
                    labelText: 'Producto detectado por escáner',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                  items: allItems.map((i) {
                    return DropdownMenuItem(
                      value: i.id,
                      child: Text(i.name, overflow: TextOverflow.ellipsis),
                    );
                  }).toList(),
                  onChanged: (id) {
                    if (id != null) {
                      setState(() {
                        _selectedItem = allItems.firstWhere((i) => i.id == id);
                      });
                    }
                  },
                ),
              ),

            // Card principal del producto
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkBg : AppColors.lightSurfaceVariant,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          item.name,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      StockStatusBadge(status: item.stockStatus),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '📍 ${item.zoneName} • ${item.category}',
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // CONTROL CENTRAL DE LOS 2 TAPS: SUMAR / RESTAR
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Boton Descontar Stock (-)
                      _ActionButton(
                        icon: Icons.remove,
                        label: 'Descontar (-1)',
                        color: AppColors.outOfStock,
                        onPressed: item.currentQuantity > 0
                            ? () {
                                ref.read(inventoryListProvider.notifier).adjustStock(
                                      item.id,
                                      -1,
                                      scanMethod: widget.scanMethod,
                                    );
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Se descontó 1 ${item.unit} de ${item.name}'),
                                    duration: const Duration(seconds: 1),
                                    backgroundColor: AppColors.outOfStock,
                                  ),
                                );
                              }
                            : null,
                      ),
                      const SizedBox(width: 24),

                      // Contador Glanceable
                      Column(
                        children: [
                          Text(
                            '${item.currentQuantity}',
                            style: TextStyle(
                              fontSize: 38,
                              fontWeight: FontWeight.w900,
                              color: AppColors.getStatusColor(item.stockStatus),
                            ),
                          ),
                          Text(
                            item.unit,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(width: 24),

                      // Boton Reabastecer Stock (+)
                      _ActionButton(
                        icon: Icons.add,
                        label: 'Agregar (+1)',
                        color: AppColors.optimal,
                        onPressed: () {
                          ref.read(inventoryListProvider.notifier).adjustStock(
                                item.id,
                                1,
                                scanMethod: widget.scanMethod,
                              );
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Se agregó 1 ${item.unit} a ${item.name}'),
                              duration: const Duration(seconds: 1),
                              backgroundColor: AppColors.optimal,
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onPressed;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.color,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Material(
          color: onPressed != null ? color : Colors.grey.withOpacity(0.3),
          shape: const CircleBorder(),
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: onPressed,
            child: SizedBox(
              width: 56,
              height: 56,
              child: Icon(icon, color: Colors.white, size: 28),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: onPressed != null ? color : Colors.grey,
          ),
        ),
      ],
    );
  }
}
