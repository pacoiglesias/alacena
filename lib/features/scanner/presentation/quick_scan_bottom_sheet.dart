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
                  initialValue: item.id,
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
                  const SizedBox(height: 16),

                  // Fallback Alfanumérico y Reemplazo de Etiqueta Dañada
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.black38 : Colors.grey.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Short ID: ${item.effectiveShortId}',
                              style: const TextStyle(
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                            Text(
                              'QR actual: ${item.qrCode.split(':').last}',
                              style: const TextStyle(fontSize: 10, color: Colors.grey),
                            ),
                          ],
                        ),
                        TextButton.icon(
                          style: TextButton.styleFrom(
                            foregroundColor: AppColors.primaryLight,
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          ),
                          icon: const Icon(Icons.published_with_changes, size: 16),
                          label: const Text('Reemplazar QR', style: TextStyle(fontSize: 11)),
                          onPressed: () => _showReplaceTagDialog(context, ref, item),
                        ),
                      ],
                    ),
                  ),

                  if (item.requiresMetadataUpdate)
                    Container(
                      margin: const EdgeInsets.only(top: 10),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF59E0B).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFF59E0B), width: 0.8),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.info_outline, color: Color(0xFFF59E0B), size: 16),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Ingreso Express: Este producto requiere completar foto y marca más tarde.',
                              style: TextStyle(fontSize: 11, color: Color(0xFFF59E0B)),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _showReplaceTagDialog(BuildContext context, WidgetRef ref, InventoryItem item) {
    final textController = TextEditingController();
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.qr_code_2, color: AppColors.primaryLight),
            SizedBox(width: 8),
            Text('Reemplazar Etiqueta'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Asigna un QR nuevo ("Blank Tag") a ${item.name}.',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            ),
            const SizedBox(height: 6),
            const Text(
              'El QR anterior quedará invalidado inmediatamente, pero el historial de auditoría y precios se conservará intacto.',
              style: TextStyle(fontSize: 11, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: textController,
              decoration: InputDecoration(
                hintText: 'Escanea o ingresa nuevo QR tag...',
                prefixIcon: const Icon(Icons.qr_code_scanner),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              final newQr = textController.text.trim();
              if (newQr.isNotEmpty) {
                Navigator.pop(dialogCtx);
                final success = ref.read(inventoryListProvider.notifier).replaceTag(item.id, newQr);
                if (success) {
                  Navigator.pop(context); // cerrar bottom sheet
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('✅ Etiqueta física actualizada. QR anterior invalidado y auditoría preservada.'),
                      backgroundColor: AppColors.optimal,
                      duration: Duration(seconds: 3),
                    ),
                  );
                }
              }
            },
            child: const Text('Confirmar Reemplazo'),
          ),
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
