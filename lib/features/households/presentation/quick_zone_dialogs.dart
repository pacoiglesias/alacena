import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/household_model.dart';
import '../providers/household_provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/tokens.dart';

/// Diálogo Rápido para Crear una Nueva Zona Física (Cuarto Frío, Cava, Alacena...)
class AddZoneDialog extends ConsumerStatefulWidget {
  final String householdId;

  const AddZoneDialog({super.key, required this.householdId});

  static Future<void> show(BuildContext context, String householdId) {
    return showDialog(
      context: context,
      builder: (ctx) => AddZoneDialog(householdId: householdId),
    );
  }

  @override
  ConsumerState<AddZoneDialog> createState() => _AddZoneDialogState();
}

class _AddZoneDialogState extends ConsumerState<AddZoneDialog> {
  final _nameCtrl = TextEditingController();
  final _tempCtrl = TextEditingController();
  String _selectedType = 'pantry';

  final List<Map<String, dynamic>> _zoneTypes = [
    {'type': 'pantry', 'label': '🥫 Alacena / Despensa Seca', 'icon': Icons.kitchen},
    {'type': 'fridge', 'label': '❄️ Refrigerador / Cuarto Frío', 'icon': Icons.ac_unit},
    {'type': 'cellar', 'label': '🍷 Cava / Bodega de Vinos', 'icon': Icons.wine_bar},
    {'type': 'freezer', 'label': '🧊 Congelador Deep-Freeze', 'icon': Icons.severe_cold},
    {'type': 'warehouse', 'label': '📦 Bodega General / Insumos', 'icon': Icons.inventory_2},
    {'type': 'bar', 'label': '🍸 Bar / Cantina / Cristalería', 'icon': Icons.liquor},
  ];

  @override
  void dispose() {
    _nameCtrl.dispose();
    _tempCtrl.dispose();
    super.dispose();
  }

  void _save() {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) return;

    ref.read(householdsListProvider.notifier).addZone(
          householdId: widget.householdId,
          name: name,
          type: _selectedType,
          temperatureNotes: _tempCtrl.text.trim().isNotEmpty ? _tempCtrl.text.trim() : null,
        );

    Navigator.pop(context);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✅ Zona "$name" creada exitosamente.'),
        backgroundColor: AppColors.optimal,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      backgroundColor: isDark ? AppTokens.darkSurface : AppTokens.lightSurface,
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppTokens.emeraldPrimary.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.add_location_alt, color: AppTokens.emeraldLight, size: 22),
          ),
          const SizedBox(width: 10),
          Text(
            'Nueva Zona Física',
            style: GoogleFonts.inter(fontSize: 17, fontWeight: FontWeight.bold),
          ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Agrega un nuevo espacio físico (ej. Cuarto Frío, Cava de Piedra, Alacena Exterior).',
            style: TextStyle(fontSize: 12, color: Colors.grey),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _nameCtrl,
            autofocus: true,
            decoration: InputDecoration(
              labelText: 'Nombre del Lugar / Zona *',
              hintText: 'Ej. Cuarto Frío de Carnes, Cava Subterránea',
              filled: true,
              fillColor: isDark ? AppTokens.darkBg : AppTokens.lightBg,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _selectedType,
            decoration: InputDecoration(
              labelText: 'Tipo de Espacio',
              filled: true,
              fillColor: isDark ? AppTokens.darkBg : AppTokens.lightBg,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
            items: _zoneTypes.map((item) {
              return DropdownMenuItem<String>(
                value: item['type'] as String,
                child: Text(item['label'] as String, style: const TextStyle(fontSize: 13)),
              );
            }).toList(),
            onChanged: (val) {
              if (val != null) setState(() => _selectedType = val);
            },
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _tempCtrl,
            decoration: InputDecoration(
              labelText: 'Notas de Temperatura (Opcional)',
              hintText: 'Ej. 4°C, 14°C • 70% HR, -18°C',
              filled: true,
              fillColor: isDark ? AppTokens.darkBg : AppTokens.lightBg,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTokens.emeraldPrimary,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          onPressed: _save,
          child: const Text('Crear Zona'),
        ),
      ],
    );
  }
}

/// Diálogo para Renombrar o Eliminar una Zona Física (ej. Alacena 1 -> Cuarto Frío)
class EditZoneDialog extends ConsumerStatefulWidget {
  final String householdId;
  final HouseholdZone zone;

  const EditZoneDialog({super.key, required this.householdId, required this.zone});

  static Future<void> show(BuildContext context, String householdId, HouseholdZone zone) {
    return showDialog(
      context: context,
      builder: (ctx) => EditZoneDialog(householdId: householdId, zone: zone),
    );
  }

  @override
  ConsumerState<EditZoneDialog> createState() => _EditZoneDialogState();
}

class _EditZoneDialogState extends ConsumerState<EditZoneDialog> {
  late TextEditingController _nameCtrl;
  late TextEditingController _tempCtrl;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.zone.name);
    _tempCtrl = TextEditingController(text: widget.zone.temperatureNotes ?? '');
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _tempCtrl.dispose();
    super.dispose();
  }

  void _save() {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) return;

    ref.read(householdsListProvider.notifier).updateZone(
          householdId: widget.householdId,
          zoneId: widget.zone.id,
          name: name,
          temperatureNotes: _tempCtrl.text.trim().isNotEmpty ? _tempCtrl.text.trim() : null,
        );

    Navigator.pop(context);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✅ Zona actualizada a: "$name".'),
        backgroundColor: AppColors.optimal,
      ),
    );
  }

  void _delete() {
    if (widget.zone.id == 'all') return;

    ref.read(householdsListProvider.notifier).deleteZone(
          householdId: widget.householdId,
          zoneId: widget.zone.id,
        );

    // Si la zona borrada era la activa, volver a 'all'
    if (ref.read(selectedZoneProvider) == widget.zone.id) {
      ref.read(selectedZoneProvider.notifier).setZone('all');
    }

    Navigator.pop(context);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('🗑️ Zona "${widget.zone.name}" eliminada.'),
        backgroundColor: Colors.redAccent,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      backgroundColor: isDark ? AppTokens.darkSurface : AppTokens.lightSurface,
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.edit_location_alt, color: AppColors.primaryLight, size: 22),
              ),
              const SizedBox(width: 10),
              Text(
                'Modificar Zona',
                style: GoogleFonts.inter(fontSize: 17, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          if (widget.zone.id != 'all')
            IconButton(
              icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
              tooltip: 'Eliminar esta Zona',
              onPressed: _delete,
            ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _nameCtrl,
            decoration: InputDecoration(
              labelText: 'Nombre del Lugar / Zona *',
              filled: true,
              fillColor: isDark ? AppTokens.darkBg : AppTokens.lightBg,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _tempCtrl,
            decoration: InputDecoration(
              labelText: 'Notas de Temperatura (Opcional)',
              hintText: 'Ej. 4°C, 14°C',
              filled: true,
              fillColor: isDark ? AppTokens.darkBg : AppTokens.lightBg,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTokens.emeraldPrimary,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          onPressed: _save,
          child: const Text('Guardar'),
        ),
      ],
    );
  }
}

/// Modal Completo de Gestión y Conmutación de Casas / Lugares
class ManageHouseholdsModal extends ConsumerWidget {
  const ManageHouseholdsModal({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => const ManageHouseholdsModal(),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final households = ref.watch(householdsListProvider);
    final activeHousehold = ref.watch(selectedHouseholdProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Residencias & Casas Activas',
                      style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Selecciona o administra tus casas y lugares de despensa.',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary,
                      ),
                    ),
                  ],
                ),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTokens.emeraldPrimary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('Nueva Casa', style: TextStyle(fontSize: 12)),
                  onPressed: () {
                    Navigator.pop(context);
                    _showCreateHouseholdDialog(context, ref);
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(height: 1),
            const SizedBox(height: 12),

            ...households.map((h) {
              final isSelected = h.id == activeHousehold.id;

              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppTokens.emeraldPrimary.withValues(alpha: 0.1)
                      : (isDark ? AppTokens.darkSurface : AppTokens.lightSurface),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSelected
                        ? AppTokens.emeraldLight
                        : (isDark ? AppTokens.darkBorder : AppTokens.lightBorder),
                    width: isSelected ? 1.5 : 1,
                  ),
                ),
                child: ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: (isSelected ? AppTokens.emeraldLight : Colors.grey).withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.home,
                      color: isSelected ? AppTokens.emeraldLight : Colors.grey,
                      size: 20,
                    ),
                  ),
                  title: Row(
                    children: [
                      Text(
                        h.name,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                        ),
                      ),
                      if (isSelected) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTokens.emeraldPrimary,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'ACTIVA',
                            style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ),
                      ],
                    ],
                  ),
                  subtitle: Text(
                    '${h.address} • ${h.zones.where((z) => z.id != "all").length} zonas físicas',
                    style: const TextStyle(fontSize: 11),
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.edit_outlined, size: 18),
                        tooltip: 'Renombrar Casa',
                        onPressed: () {
                          Navigator.pop(context);
                          _showEditHouseholdDialog(context, ref, h);
                        },
                      ),
                      if (!isSelected)
                        TextButton(
                          child: const Text('Conectar'),
                          onPressed: () {
                            ref.read(selectedHouseholdProvider.notifier).selectHousehold(h.id);
                            Navigator.pop(context);
                          },
                        ),
                    ],
                  ),
                  onTap: () {
                    ref.read(selectedHouseholdProvider.notifier).selectHousehold(h.id);
                    Navigator.pop(context);
                  },
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  void _showCreateHouseholdDialog(BuildContext context, WidgetRef ref) {
    final nameCtrl = TextEditingController();
    final addressCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Nueva Residencia o Casa', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                autofocus: true,
                decoration: const InputDecoration(labelText: 'Nombre de la Casa *', hintText: 'Ej. Casa Valle de Bravo'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: addressCtrl,
                decoration: const InputDecoration(labelText: 'Ubicación / Dirección', hintText: 'Ej. Avándaro'),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
            ElevatedButton(
              onPressed: () {
                final name = nameCtrl.text.trim();
                if (name.isEmpty) return;
                ref.read(householdsListProvider.notifier).addHousehold(
                      name: name,
                      address: addressCtrl.text.trim(),
                    );
                Navigator.pop(ctx);
              },
              child: const Text('Crear Casa'),
            ),
          ],
        );
      },
    );
  }

  void _showEditHouseholdDialog(BuildContext context, WidgetRef ref, Household household) {
    final nameCtrl = TextEditingController(text: household.name);
    final addressCtrl = TextEditingController(text: household.address);

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Renombrar Residencia', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'Nombre de la Casa *'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: addressCtrl,
                decoration: const InputDecoration(labelText: 'Dirección'),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
            ElevatedButton(
              onPressed: () {
                final name = nameCtrl.text.trim();
                if (name.isEmpty) return;
                ref.read(householdsListProvider.notifier).updateHousehold(
                      id: household.id,
                      name: name,
                      address: addressCtrl.text.trim(),
                    );
                Navigator.pop(ctx);
              },
              child: const Text('Guardar'),
            ),
          ],
        );
      },
    );
  }
}
