import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/inventory_item_model.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/stock_status_badge.dart';

class InventoryTableDesktop extends StatelessWidget {
  final List<InventoryItem> items;
  final bool isAdmin;
  final Function(InventoryItem) onItemTap;
  final Function(InventoryItem) onAdjustTap;
  final Function(InventoryItem) onPrintLabelTap;
  final Function(InventoryItem, int) onQuickQuantityChange;

  const InventoryTableDesktop({
    super.key,
    required this.items,
    required this.isAdmin,
    required this.onItemTap,
    required this.onAdjustTap,
    required this.onPrintLabelTap,
    required this.onQuickQuantityChange,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppTokens.darkSurface : AppTokens.lightSurface,
        borderRadius: BorderRadius.circular(AppTokens.r16),
        border: Border.all(
          color: isDark ? AppTokens.darkBorder : AppTokens.lightBorder,
          width: 1,
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppTokens.r16),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minWidth: 980),
            child: DataTable(
              headingRowColor: WidgetStateProperty.all(
                isDark ? AppTokens.darkSurfaceVariant : AppTokens.lightSurfaceVariant,
              ),
              dataRowMinHeight: 52,
              dataRowMaxHeight: 58,
              horizontalMargin: AppTokens.s16,
              columnSpacing: AppTokens.s20,
              columns: [
                const DataColumn(label: Text('ARTÍCULO', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11))),
                const DataColumn(label: Text('UBICACIÓN', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11))),
                const DataColumn(label: Text('SHORT ID', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11))),
                const DataColumn(label: Text('STOCK / IDEAL', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11))),
                if (isAdmin)
                  const DataColumn(label: Text('PRECIO MXN', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11))),
                if (isAdmin)
                  const DataColumn(label: Text('VALOR TOTAL', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11))),
                const DataColumn(label: Text('ESTATUS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11))),
                const DataColumn(label: Text('ACCIONES', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11))),
              ],
              rows: items.map((item) {
                final statusColor = item.stockStatus == 'OPTIMAL'
                    ? AppTokens.statusOptimal
                    : (item.stockStatus == 'LOW' ? AppTokens.statusLow : AppTokens.statusOutOfStock);

                return DataRow(
                  onSelectChanged: (_) => onItemTap(item),
                  cells: [
                    // Columna 1: Nombre + Alto Valor Badge
                    DataCell(
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 6,
                            height: 32,
                            decoration: BoxDecoration(
                              color: statusColor,
                              borderRadius: BorderRadius.circular(3),
                            ),
                          ),
                          const SizedBox(width: AppTokens.s10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                item.name,
                                style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
                              ),
                              Text(
                                item.category,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary,
                                ),
                              ),
                            ],
                          ),
                          if (item.isHighValue) ...[
                            const SizedBox(width: AppTokens.s8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppTokens.wineAccent.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                'ALTO VALOR',
                                style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTokens.wineAccent),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),

                    // Columna 2: Ubicación
                    DataCell(
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.place_outlined, size: 14, color: Colors.grey),
                          const SizedBox(width: 4),
                          Text(item.zoneName, style: const TextStyle(fontSize: 12)),
                        ],
                      ),
                    ),

                    // Columna 3: Short ID
                    DataCell(
                      Text(
                        item.effectiveShortId,
                        style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold, fontSize: 11),
                      ),
                    ),

                    // Columna 4: Control Rápido de Stock [-] X / Ideal [+]
                    DataCell(
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.remove, size: 16),
                            color: item.currentQuantity > 0 ? AppTokens.statusOutOfStock : Colors.grey,
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            onPressed: item.currentQuantity > 0 ? () => onQuickQuantityChange(item, -1) : null,
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            child: Text(
                              '${item.currentQuantity} / ${item.idealQuantity} ${item.unit}',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: statusColor),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.add, size: 16),
                            color: AppTokens.statusOptimal,
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            onPressed: () => onQuickQuantityChange(item, 1),
                          ),
                        ],
                      ),
                    ),

                    // Columna 5: Precio Unitario (Solo Admin)
                    if (isAdmin)
                      DataCell(
                        Text(
                          '\$${item.unitPrice.toStringAsFixed(2)} MXN',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                        ),
                      ),

                    // Columna 6: Valor Total (Solo Admin)
                    if (isAdmin)
                      DataCell(
                        Text(
                          '\$${item.totalInventoryValue.toStringAsFixed(2)} MXN',
                          style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700),
                        ),
                      ),

                    // Columna 7: Estatus
                    DataCell(StockStatusBadge(status: item.stockStatus)),

                    // Columna 8: Acciones
                    DataCell(
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.print_outlined, size: 18),
                            tooltip: 'Imprimir etiqueta térmica QR',
                            onPressed: () => onPrintLabelTap(item),
                          ),
                          if (isAdmin)
                            IconButton(
                              icon: const Icon(Icons.edit_note, size: 20, color: AppTokens.emeraldLight),
                              tooltip: 'Ajuste manual (Admin)',
                              onPressed: () => onAdjustTap(item),
                            ),
                        ],
                      ),
                    ),
                  ],
                );
              }).toList(),
            ),
          ),
        ),
      ),
    );
  }
}
