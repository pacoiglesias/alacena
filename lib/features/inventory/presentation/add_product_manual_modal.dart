import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:uuid/uuid.dart';
import '../models/inventory_item_model.dart';
import '../providers/inventory_provider.dart';
import '../../households/providers/household_provider.dart';
import '../../auth/models/user_member_model.dart';
import '../../auth/providers/members_provider.dart';
import '../../audit_trail/models/audit_log_model.dart';
import '../../audit_trail/providers/audit_trail_provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/tokens.dart';

/// Modal Ultra-Intuitivo para Captura Manual de Productos
/// Permite dar de alta cualquier artículo en la despensa, cava o cuarto frío
/// sin necesidad de código de barras, con costeo en MXN y atribución de usuario.
class AddProductManualModal extends ConsumerStatefulWidget {
  const AddProductManualModal({super.key});

  static Future<void> show(BuildContext context) {
    return showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => const AddProductManualModal(),
    );
  }

  @override
  ConsumerState<AddProductManualModal> createState() => _AddProductManualModalState();
}

class _AddProductManualModalState extends ConsumerState<AddProductManualModal> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _quantityController;
  late TextEditingController _idealQtyController;
  late TextEditingController _minAlertQtyController;
  late TextEditingController _priceController;
  late TextEditingController _vendorController;

  String? _selectedZoneId;
  String _selectedCategory = 'Despensa Seca';
  String _selectedUnit = 'pza';
  String? _selectedMemberName;

  final List<String> _commonUnits = [
    'pza',
    'kg',
    'g',
    'litro',
    'ml',
    'lata',
    'botella 750ml',
    'bolsa',
    'paquete',
    'caja',
  ];

  final List<String> _categories = [
    'Despensa Seca',
    'Refrigerados & Lácteos',
    'Carnes & Cuarto Frío',
    'Cava & Vinos',
    'Destilados & Bar',
    'Frutas & Verduras',
    'Especias & Aceites',
    'Limpieza & Hogar',
  ];

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _quantityController = TextEditingController(text: '1');
    _idealQtyController = TextEditingController(text: '5');
    _minAlertQtyController = TextEditingController(text: '2');
    _priceController = TextEditingController(text: '0.00');
    _vendorController = TextEditingController(text: 'Costco / City Market');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _quantityController.dispose();
    _idealQtyController.dispose();
    _minAlertQtyController.dispose();
    _priceController.dispose();
    _vendorController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;

    final household = ref.read(selectedHouseholdProvider);
    final members = ref.read(membersProvider);

    // Resolver zona física
    final activeZones = household.zones.where((z) => z.id != 'all').toList();
    final zoneId = _selectedZoneId ?? (activeZones.isNotEmpty ? activeZones.first.id : 'alacena-1');
    final zoneObj = household.zones.firstWhere(
      (z) => z.id == zoneId,
      orElse: () => activeZones.isNotEmpty ? activeZones.first : household.zones.first,
    );

    // Resolver miembro responsable
    final member = members.firstWhere(
      (m) => m.displayName == _selectedMemberName,
      orElse: () => members.first,
    );

    final qty = int.tryParse(_quantityController.text.trim()) ?? 1;
    final idealQty = int.tryParse(_idealQtyController.text.trim()) ?? 5;
    final minAlert = int.tryParse(_minAlertQtyController.text.trim()) ?? 2;
    final unitPrice = double.tryParse(_priceController.text.trim()) ?? 0.0;
    final name = _nameController.text.trim();
    final vendor = _vendorController.text.trim();

    final now = DateTime.now();
    final shortCode = (1000 + (now.millisecondsSinceEpoch % 9000)).toString();
    final itemId = const Uuid().v4();

    final newItem = InventoryItem(
      id: itemId,
      householdId: household.id,
      zoneId: zoneId,
      zoneName: zoneObj.name,
      name: name,
      category: _selectedCategory,
      barcode: shortCode,
      qrCode: 'ALACENA:${household.id}:$zoneId:$itemId',
      currentQuantity: qty,
      idealQuantity: idealQty,
      minAlertQuantity: minAlert,
      unit: _selectedUnit,
      unitPrice: unitPrice,
      currency: 'MXN',
      lastPurchasePlace: vendor.isNotEmpty ? vendor : null,
      updatedAt: now,
    );

    // 1. Agregar a la lista de inventario
    ref.read(inventoryListProvider.notifier).addItem(newItem);

    // 2. Registrar en la bitácora forense de auditoría inalterable
    ref.read(auditTrailProvider.notifier).addLog(
      AuditLog(
        id: const Uuid().v4(),
        householdId: household.id,
        itemId: itemId,
        itemName: name,
        userId: member.email,
        userEmail: '${member.displayName} (${member.role.label})',
        userRole: member.role.name,
        action: 'MANUAL_CREATE',
        previousQuantity: 0,
        newQuantity: qty,
        quantityDelta: qty,
        unitPriceAtMoment: unitPrice,
        economicValueDelta: qty * unitPrice,
        currency: 'MXN',
        scanMethod: 'CAPTURA_MANUAL',
        timestamp: now,
      ),
    );

    Navigator.pop(context);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✅ "$name" capturado con éxito en ${zoneObj.name} por ${member.displayName}.'),
        backgroundColor: AppColors.optimal,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final household = ref.watch(selectedHouseholdProvider);
    final members = ref.watch(membersProvider);

    final availableZones = household.zones.where((z) => z.id != 'all').toList();
    if (_selectedZoneId == null && availableZones.isNotEmpty) {
      _selectedZoneId = availableZones.first.id;
    }
    if (_selectedMemberName == null && members.isNotEmpty) {
      _selectedMemberName = members.first.displayName;
    }

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      backgroundColor: isDark ? AppTokens.darkSurface : AppTokens.lightSurface,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 580, maxHeight: 720),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header del Modal
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTokens.emeraldPrimary.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.add_shopping_cart, color: AppTokens.emeraldLight, size: 24),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Captura Manual de Producto',
                            style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800),
                          ),
                          Text(
                            'Alta directa en ${household.name} (Sin código de barras)',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(height: 1),
                const SizedBox(height: 16),

                // Formulario Scrolleable
                Expanded(
                  child: ListView(
                    children: [
                      // 1. Nombre del Producto
                      TextFormField(
                        controller: _nameController,
                        decoration: InputDecoration(
                          labelText: 'Nombre del Artículo / Insumo *',
                          hintText: 'Ej. Harina de Trigo San Antonio 5kg, Rib Eye Prime, etc.',
                          prefixIcon: const Icon(Icons.inventory_2_outlined, size: 20),
                          filled: true,
                          fillColor: isDark ? AppTokens.darkBg : AppTokens.lightBg,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        validator: (val) {
                          if (val == null || val.trim().isEmpty) {
                            return 'Ingresa el nombre del producto';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),

                      // 2. Zona Física (Alacena, Cava, Cuarto Frío, etc.)
                      DropdownButtonFormField<String>(
                        value: _selectedZoneId,
                        decoration: InputDecoration(
                          labelText: 'Ubicación / Lugar Físico *',
                          prefixIcon: const Icon(Icons.room_preferences_outlined, size: 20),
                          filled: true,
                          fillColor: isDark ? AppTokens.darkBg : AppTokens.lightBg,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        items: availableZones.map((zone) {
                          return DropdownMenuItem(
                            value: zone.id,
                            child: Row(
                              children: [
                                Icon(_getZoneIcon(zone.type), size: 18, color: AppTokens.emeraldLight),
                                const SizedBox(width: 8),
                                Text(zone.name, style: const TextStyle(fontSize: 13)),
                              ],
                            ),
                          );
                        }).toList(),
                        onChanged: (val) => setState(() => _selectedZoneId = val),
                      ),
                      const SizedBox(height: 14),

                      // 3. Categoría
                      DropdownButtonFormField<String>(
                        value: _selectedCategory,
                        decoration: InputDecoration(
                          labelText: 'Categoría de Almacén',
                          prefixIcon: const Icon(Icons.category_outlined, size: 20),
                          filled: true,
                          fillColor: isDark ? AppTokens.darkBg : AppTokens.lightBg,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        items: _categories.map((cat) {
                          return DropdownMenuItem(
                            value: cat,
                            child: Text(cat, style: const TextStyle(fontSize: 13)),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedCategory = val);
                        },
                      ),
                      const SizedBox(height: 14),

                      // 4. Cantidad y Unidad
                      Row(
                        children: [
                          Expanded(
                            flex: 2,
                            child: TextFormField(
                              controller: _quantityController,
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(
                                labelText: 'Stock Actual *',
                                prefixIcon: const Icon(Icons.numbers, size: 20),
                                filled: true,
                                fillColor: isDark ? AppTokens.darkBg : AppTokens.lightBg,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              validator: (val) {
                                if (val == null || int.tryParse(val.trim()) == null) {
                                  return 'Número válido';
                                }
                                return null;
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            flex: 3,
                            child: DropdownButtonFormField<String>(
                              value: _selectedUnit,
                              decoration: InputDecoration(
                                labelText: 'Unidad de Medida',
                                filled: true,
                                fillColor: isDark ? AppTokens.darkBg : AppTokens.lightBg,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              items: _commonUnits.map((u) {
                                return DropdownMenuItem(value: u, child: Text(u, style: const TextStyle(fontSize: 13)));
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => _selectedUnit = val);
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // 5. Stock Ideal y Stock Mínimo de Alerta
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _idealQtyController,
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(
                                labelText: 'Stock Ideal (Meta)',
                                prefixIcon: const Icon(Icons.check_circle_outline, size: 18),
                                filled: true,
                                fillColor: isDark ? AppTokens.darkBg : AppTokens.lightBg,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              controller: _minAlertQtyController,
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(
                                labelText: 'Alerta Stock Bajo',
                                prefixIcon: const Icon(Icons.warning_amber_rounded, size: 18),
                                filled: true,
                                fillColor: isDark ? AppTokens.darkBg : AppTokens.lightBg,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // 6. Precio Unitario en MXN y Lugar de Compra
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _priceController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: InputDecoration(
                                labelText: 'Precio Unitario (\$ MXN)',
                                prefixIcon: const Icon(Icons.attach_money, size: 20),
                                filled: true,
                                fillColor: isDark ? AppTokens.darkBg : AppTokens.lightBg,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              controller: _vendorController,
                              decoration: InputDecoration(
                                labelText: 'Comercio / Proveedor',
                                prefixIcon: const Icon(Icons.storefront_outlined, size: 18),
                                filled: true,
                                fillColor: isDark ? AppTokens.darkBg : AppTokens.lightBg,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // 7. Quién realiza el registro (Atribución)
                      DropdownButtonFormField<String>(
                        value: _selectedMemberName,
                        decoration: InputDecoration(
                          labelText: 'Persona Responsable del Registro',
                          prefixIcon: const Icon(Icons.person_pin_outlined, size: 20),
                          filled: true,
                          fillColor: isDark ? AppTokens.darkBg : AppTokens.lightBg,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        items: members.map((m) {
                          return DropdownMenuItem(
                            value: m.displayName,
                            child: Row(
                              children: [
                                Icon(m.role.icon, size: 16, color: m.role.badgeColor),
                                const SizedBox(width: 8),
                                Text('${m.displayName} (${m.role.label})', style: const TextStyle(fontSize: 13)),
                              ],
                            ),
                          );
                        }).toList(),
                        onChanged: (val) => setState(() => _selectedMemberName = val),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),
                const Divider(height: 1),
                const SizedBox(height: 16),

                // Botones de Acción
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancelar'),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTokens.emeraldPrimary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: const Icon(Icons.save, size: 18),
                      label: const Text('Guardar en Alacena', style: TextStyle(fontWeight: FontWeight.bold)),
                      onPressed: _submit,
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
      default:
        return Icons.kitchen;
    }
  }
}
