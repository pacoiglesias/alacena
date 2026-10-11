import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:uuid/uuid.dart';
import '../models/inventory_item_model.dart';
import '../models/inventory_adjustment_model.dart';
import '../providers/inventory_provider.dart';
import '../../audit_trail/models/audit_log_model.dart';
import '../../audit_trail/providers/audit_trail_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/constants/app_colors.dart';

/// Modal de Edición, Ajuste y Reconciliación Manual (Exclusivo para Administrador)
/// Permite modificar nombre, stock físico, precio en MXN y tipificar motivos de ajuste
/// (Merma, Pérdida, Rotura, Corrección de Conteo, etc.) registrando trazabilidad inmutable.
class EditProductDialog extends ConsumerStatefulWidget {
  final InventoryItem item;

  const EditProductDialog({super.key, required this.item});

  static Future<void> show(BuildContext context, InventoryItem item) {
    return showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => EditProductDialog(item: item),
    );
  }

  @override
  ConsumerState<EditProductDialog> createState() => _EditProductDialogState();
}

class _EditProductDialogState extends ConsumerState<EditProductDialog> {
  late TextEditingController _nameController;
  late TextEditingController _stockController;
  late TextEditingController _priceController;
  late TextEditingController _placeController;
  late TextEditingController _reasonNoteController;
  AdjustmentType _selectedAdjustmentType = AdjustmentType.correccionConteo;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.item.name);
    _stockController = TextEditingController(text: widget.item.currentQuantity.toString());
    _priceController = TextEditingController(text: widget.item.unitPrice.toStringAsFixed(2));
    _placeController = TextEditingController(text: widget.item.lastPurchasePlace ?? 'Costco / City Market');
    _reasonNoteController = TextEditingController();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _stockController.dispose();
    _priceController.dispose();
    _placeController.dispose();
    _reasonNoteController.dispose();
    super.dispose();
  }

  void _saveChanges() async {
    final newName = _nameController.text.trim();
    final newQty = int.tryParse(_stockController.text.trim()) ?? widget.item.currentQuantity;
    final newPrice = double.tryParse(_priceController.text.trim()) ?? widget.item.unitPrice;
    final newPlace = _placeController.text.trim();
    final note = _reasonNoteController.text.trim();

    if (newName.isEmpty || newQty < 0 || newPrice < 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Por favor ingresa valores válidos.'),
          backgroundColor: AppColors.outOfStock,
        ),
      );
      return;
    }

    setState(() => _isSaving = true);
    final user = ref.read(authProvider);

    // 1. Actualizar el producto en el inventario
    final updatedItem = widget.item.copyWith(
      name: newName,
      currentQuantity: newQty,
      unitPrice: newPrice,
      lastPurchasePlace: newPlace,
      updatedAt: DateTime.now(),
    );

    ref.read(inventoryListProvider.notifier).updateItem(updatedItem);

    // 2. Sellar el Audit Trail con Tipificación de Ajuste Inalterable
    final delta = newQty - widget.item.currentQuantity;
    final actionCode = delta != 0 ? _selectedAdjustmentType.code : 'MANUAL_ADJUST';

    final log = AuditLog(
      id: const Uuid().v4(),
      householdId: widget.item.householdId,
      itemId: widget.item.id,
      itemName: newName,
      userId: user?.uid ?? 'admin',
      userEmail: user?.email ?? 'admin@alacena.cobertores.com',
      userRole: 'admin',
      action: actionCode,
      previousQuantity: widget.item.currentQuantity,
      newQuantity: newQty,
      quantityDelta: delta,
      unitPriceAtMoment: newPrice,
      economicValueDelta: delta * newPrice,
      currency: 'MXN',
      scanMethod: 'MANUAL_ADMIN_FORM',
      timestamp: DateTime.now(),
    );

    ref.read(auditTrailProvider.notifier).addLog(log);

    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            delta != 0
                ? '✅ Ajuste guardado (${_selectedAdjustmentType.label}): $delta ${widget.item.unit} ($note)'
                : '✅ Ficha actualizada: $newName',
          ),
          backgroundColor: AppColors.optimal,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currentQtyInInput = int.tryParse(_stockController.text.trim()) ?? widget.item.currentQuantity;
    final hasStockChanged = currentQtyInInput != widget.item.currentQuantity;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      backgroundColor: isDark ? AppColors.darkSurface : AppColors.lightSurface,
      insetPadding: const EdgeInsets.all(20),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 500),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
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
                          color: AppColors.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.edit_note, color: AppColors.primaryLight, size: 22),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'Ajuste y Ficha (Admin)',
                        style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              TextField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Nombre del Producto',
                  prefixIcon: Icon(Icons.inventory_2_outlined, size: 20),
                ),
              ),
              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _stockController,
                      keyboardType: TextInputType.number,
                      onChanged: (_) => setState(() {}),
                      decoration: InputDecoration(
                        labelText: 'Stock Físico (${widget.item.unit})',
                        prefixIcon: const Icon(Icons.pin, size: 20),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _priceController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(
                        labelText: 'Precio Unitario (\$ MXN)',
                        prefixIcon: Icon(Icons.attach_money, size: 20),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Si hubo cambio de stock, exigir o permitir clasificar motivo de ajuste
              if (hasStockChanged) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.low.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.low.withValues(alpha: 0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.rule, color: AppColors.low, size: 16),
                          SizedBox(width: 6),
                          Text(
                            'Motivo del Ajuste de Inventario (Obligatorio)',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.low),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<AdjustmentType>(
                        initialValue: _selectedAdjustmentType,
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: isDark ? AppColors.darkBg : Colors.white,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        items: AdjustmentType.values.map((type) {
                          return DropdownMenuItem(
                            value: type,
                            child: Text(type.label, style: const TextStyle(fontSize: 13)),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedAdjustmentType = val);
                        },
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _reasonNoteController,
                        decoration: InputDecoration(
                          hintText: 'Justificación / Nota (ej. se rompió frasco, fecha vencida...)',
                          filled: true,
                          fillColor: isDark ? AppColors.darkBg : Colors.white,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],

              TextField(
                controller: _placeController,
                decoration: const InputDecoration(
                  labelText: 'Lugar de Compra Frecuente',
                  prefixIcon: Icon(Icons.storefront_outlined, size: 20),
                ),
              ),
              const SizedBox(height: 20),

              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: _isSaving ? null : () => Navigator.pop(context),
                    child: const Text('Cancelar'),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: _isSaving
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.check, size: 18),
                    label: Text(_isSaving ? 'Guardando...' : 'Aplicar Ajuste'),
                    onPressed: _isSaving ? null : _saveChanges,
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
