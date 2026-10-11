import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../inventory/models/inventory_item_model.dart';
import '../services/label_printer_service.dart';
import '../../../core/constants/app_colors.dart';

class ThermalPrintModal extends StatefulWidget {
  final InventoryItem item;

  const ThermalPrintModal({super.key, required this.item});

  static Future<void> show(BuildContext context, InventoryItem item) {
    return showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => ThermalPrintModal(item: item),
    );
  }

  @override
  State<ThermalPrintModal> createState() => _ThermalPrintModalState();
}

class _ThermalPrintModalState extends State<ThermalPrintModal> {
  ThermalLabelPreset _selectedPreset = ThermalLabelPreset.standard50x30;
  bool _isPrinting = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final item = widget.item;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Tirador superior
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.print_outlined, color: AppColors.primaryLight, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Imprimir Etiqueta Térmica',
                        style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '${item.name} • Short ID: ${item.effectiveShortId}',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            const Text(
              'Selecciona el formato de tu impresora:',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 10),

            // Selector Preset 1: Niimbot 50x30mm
            _PresetOptionTile(
              title: 'Niimbot / Estándar Portátil',
              dimension: '50mm x 30mm',
              description: 'Etiquetas compactas para frascos, especias y despensa.',
              isSelected: _selectedPreset == ThermalLabelPreset.standard50x30,
              isDark: isDark,
              onTap: () {
                setState(() => _selectedPreset = ThermalLabelPreset.standard50x30);
              },
            ),
            const SizedBox(height: 8),

            // Selector Preset 2: Dymo 30252 89x28mm
            _PresetOptionTile(
              title: 'Dymo LabelWriter 30252',
              dimension: '89mm x 28mm (Large Address)',
              description: 'Etiqueta alargada de alta definición para estanterías y cajas de vino.',
              isSelected: _selectedPreset == ThermalLabelPreset.dymo30252,
              isDark: isDark,
              onTap: () {
                setState(() => _selectedPreset = ThermalLabelPreset.dymo30252);
              },
            ),
            const SizedBox(height: 20),

            // Botón de acción Imprimir
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                icon: _isPrinting
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.print, size: 20),
                label: Text(
                  _isPrinting ? 'Generando PDF térmico...' : 'Enviar a Imprimir',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                onPressed: _isPrinting
                    ? null
                    : () async {
                        final nav = Navigator.of(context);
                        final messenger = ScaffoldMessenger.of(context);
                        setState(() => _isPrinting = true);
                        try {
                          await LabelPrinterService.printLabel(
                            widget.item,
                            preset: _selectedPreset,
                          );
                          if (mounted) {
                            nav.pop();
                          }
                        } catch (e) {
                          if (mounted) {
                            messenger.showSnackBar(
                              SnackBar(
                                content: Text('Error al generar impresión: $e'),
                                backgroundColor: AppColors.outOfStock,
                              ),
                            );
                          }
                        } finally {
                          if (mounted) {
                            setState(() => _isPrinting = false);
                          }
                        }
                      },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PresetOptionTile extends StatelessWidget {
  final String title;
  final String dimension;
  final String description;
  final bool isSelected;
  final bool isDark;
  final VoidCallback onTap;

  const _PresetOptionTile({
    required this.title,
    required this.dimension,
    required this.description,
    required this.isSelected,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.1)
              : (isDark ? AppColors.darkSurface : AppColors.lightSurfaceVariant),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected
                ? AppColors.primaryLight
                : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          children: [
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: isSelected ? AppColors.primaryLight : Colors.grey,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primary.withValues(alpha: 0.2)
                              : Colors.grey.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          dimension,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: isSelected ? AppColors.primaryLight : Colors.grey,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    description,
                    style: TextStyle(
                      fontSize: 11,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
