import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:uuid/uuid.dart';
import '../models/inventory_item_model.dart';
import '../providers/inventory_provider.dart';
import '../../audit_trail/models/audit_log_model.dart';
import '../../audit_trail/providers/audit_trail_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/constants/app_colors.dart';

/// Modal de Edición y Corrección Manual (Exclusivo para Administrador)
/// Permite modificar nombre, stock físico, precio en MXN y lugar de compra,
/// registrando obligatoriamente un evento inmutable en el Audit Trail con acción MANUAL_ADJUST.
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
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.item.name);
    _stockController = TextEditingController(text: widget.item.currentQuantity.toString());
    _priceController = TextEditingController(text: widget.item.unitPrice.toStringAsFixed(2));
    _placeController = TextEditingController(text: widget.item.lastPurchasePlace ?? 'Costco / City Market');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _stockController.dispose();
    _priceController.dispose();
    _placeController.dispose();
    super.dispose();
  }

  void _saveChanges() async {
    final newName = _nameController.text.trim();
    final newQty = int.tryParse(_stockController.text.trim()) ?? widget.item.currentQuantity;
    final newPrice = double.tryParse(_priceController.text.trim()) ?? widget.item.unitPrice;
    final newPlace = _placeController.text.trim();

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

    // 2. Sellar el Audit Trail con Corrección Manual Inalterable
    final delta = newQty - widget.item.currentQuantity;
    final log = AuditLog(
      id: const Uuid().v4(),
      householdId: widget.item.householdId,
      itemId: widget.item.id,
      itemName: newName,
      userId: user?.uid ?? 'admin',
      userEmail: user?.email ?? 'admin@alacena.cobertores.com',
      userRole: 'admin',
      action: 'MANUAL_ADJUST',
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
          content: Text('✅ Corrección manual guardada: $newName (\$${newPrice.toStringAsFixed(2)} MXN)'),
          backgroundColor: AppColors.optimal,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      backgroundColor: isDark ? AppColors.darkSurface : AppColors.lightSurface,
      insetPadding: const EdgeInsets.all(20),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480),
        child: Padding(
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
                        'Edición de Ficha (Admin)',
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
                      decoration: InputDecoration(
                        labelText: 'Stock Actual (${widget.item.unit})',
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
                    label: Text(_isSaving ? 'Guardando...' : 'Aplicar Corrección'),
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
