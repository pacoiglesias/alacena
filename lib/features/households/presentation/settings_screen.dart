import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/household_model.dart';
import '../providers/household_provider.dart';
import '../../auth/models/user_member_model.dart';
import '../../auth/providers/members_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/theme/tokens.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final households = ref.watch(householdsListProvider);
    final selectedHousehold = ref.watch(selectedHouseholdProvider);
    final members = ref.watch(membersProvider);
    final isAdmin = ref.watch(isUserAdminProvider);

    return Scaffold(
      backgroundColor: isDark ? AppTokens.darkBg : AppTokens.lightBg,
      body: Column(
        children: [
          // Header Superior de Configuración Estilo Linear
          Container(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            decoration: BoxDecoration(
              color: isDark ? AppTokens.darkSurface : AppTokens.lightSurface,
              border: Border(
                bottom: BorderSide(
                  color: isDark ? AppTokens.darkBorder : AppTokens.lightBorder,
                  width: 1,
                ),
              ),
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
                          padding: const EdgeInsets.all(AppTokens.s8),
                          decoration: BoxDecoration(
                            color: AppTokens.emeraldLight.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(AppTokens.r10),
                          ),
                          child: const Icon(Icons.settings_outlined, color: AppTokens.emeraldLight, size: 22),
                        ),
                        const SizedBox(width: AppTokens.s12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Configuración del Sistema',
                              style: GoogleFonts.inter(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.3,
                              ),
                            ),
                            Text(
                              'Residencias, Zonas Físicas y Miembros de la Casa',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTokens.emeraldLight.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTokens.emeraldLight.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.home_outlined, size: 14, color: AppTokens.emeraldLight),
                          const SizedBox(width: 4),
                          Text(
                            selectedHousehold.name,
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: AppTokens.emeraldLight,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Pestañas de Navegación
                TabBar(
                  controller: _tabController,
                  isScrollable: true,
                  tabAlignment: TabAlignment.start,
                  indicatorColor: AppTokens.emeraldLight,
                  indicatorWeight: 3,
                  labelColor: isDark ? Colors.white : AppTokens.emeraldPrimary,
                  unselectedLabelColor: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary,
                  labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700),
                  unselectedLabelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
                  tabs: [
                    Tab(
                      child: Row(
                        children: [
                          const Icon(Icons.domain_outlined, size: 16),
                          const SizedBox(width: 6),
                          Text('Residencias (${households.length})'),
                        ],
                      ),
                    ),
                    Tab(
                      child: Row(
                        children: [
                          const Icon(Icons.kitchen_outlined, size: 16),
                          const SizedBox(width: 6),
                          Text('Zonas Físicas (${selectedHousehold.zones.where((z) => z.id != "all").length})'),
                        ],
                      ),
                    ),
                    Tab(
                      child: Row(
                        children: [
                          const Icon(Icons.group_outlined, size: 16),
                          const SizedBox(width: 6),
                          Text('Usuarios & Roles (${members.length})'),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Contenido de las Pestañas
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // TAB 1: RESIDENCIAS / CASAS
                _HouseholdsTab(
                  households: households,
                  selectedHousehold: selectedHousehold,
                  isAdmin: isAdmin,
                  isDark: isDark,
                  onSelect: (h) {
                    ref.read(selectedHouseholdProvider.notifier).selectHousehold(h.id);
                  },
                  onAdd: () => _showAddHouseholdDialog(context, ref),
                  onEdit: (h) => _showEditHouseholdDialog(context, ref, h),
                  onDelete: (h) {
                    ref.read(householdsListProvider.notifier).deleteHousehold(h.id);
                  },
                ),

                // TAB 2: ZONAS FÍSICAS DE LA CASA SELECCIONADA
                _ZonesTab(
                  household: selectedHousehold,
                  isAdmin: isAdmin,
                  isDark: isDark,
                  onAddZone: () => _showAddZoneDialog(context, ref, selectedHousehold.id),
                  onEditZone: (z) => _showEditZoneDialog(context, ref, selectedHousehold.id, z),
                  onDeleteZone: (z) {
                    ref.read(householdsListProvider.notifier).deleteZone(
                          householdId: selectedHousehold.id,
                          zoneId: z.id,
                        );
                  },
                ),

                // TAB 3: USUARIOS Y ROLES (RBAC)
                _MembersTab(
                  members: members,
                  isAdmin: isAdmin,
                  isDark: isDark,
                  onAddMember: () => _showAddMemberDialog(context, ref, selectedHousehold.id),
                  onRoleChange: (m, newRole) {
                    ref.read(membersProvider.notifier).updateRole(m.id, newRole);
                  },
                  onRemoveMember: (m) {
                    ref.read(membersProvider.notifier).removeMember(m.id);
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // DIÁLOGOS DE GESTIÓN DE CASAS
  void _showAddHouseholdDialog(BuildContext context, WidgetRef ref) {
    final nameCtrl = TextEditingController();
    final addressCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.add_home_work, color: AppTokens.emeraldLight),
            SizedBox(width: 8),
            Text('Nueva Residencia'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              autofocus: true,
              decoration: const InputDecoration(
                labelText: 'Nombre de la Casa o Residencia',
                hintText: 'Ej. Casa Valle, Depa Santa Fe, Casa Playa...',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: addressCtrl,
              decoration: const InputDecoration(
                labelText: 'Dirección o Ubicación',
                hintText: 'Ej. Av. Lomas #120, CDMX...',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTokens.emeraldPrimary,
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              final name = nameCtrl.text.trim();
              if (name.isNotEmpty) {
                ref.read(householdsListProvider.notifier).addHousehold(
                      name: name,
                      address: addressCtrl.text.trim(),
                    );
                Navigator.pop(ctx);
              }
            },
            child: const Text('Guardar Residencia'),
          ),
        ],
      ),
    );
  }

  void _showEditHouseholdDialog(BuildContext context, WidgetRef ref, Household h) {
    final nameCtrl = TextEditingController(text: h.name);
    final addressCtrl = TextEditingController(text: h.address);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Editar Residencia'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Nombre')),
            const SizedBox(height: 12),
            TextField(controller: addressCtrl, decoration: const InputDecoration(labelText: 'Dirección')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTokens.emeraldPrimary,
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              final name = nameCtrl.text.trim();
              if (name.isNotEmpty) {
                ref.read(householdsListProvider.notifier).updateHousehold(
                      id: h.id,
                      name: name,
                      address: addressCtrl.text.trim(),
                    );
                Navigator.pop(ctx);
              }
            },
            child: const Text('Actualizar'),
          ),
        ],
      ),
    );
  }

  // DIÁLOGOS DE GESTIÓN DE ZONAS FÍSICAS
  void _showAddZoneDialog(BuildContext context, WidgetRef ref, String householdId) {
    final nameCtrl = TextEditingController();
    final tempCtrl = TextEditingController();
    String selectedType = 'pantry';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.add_location_alt, color: AppTokens.emeraldLight),
              SizedBox(width: 8),
              Text('Nueva Zona o Ubicación'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                autofocus: true,
                decoration: const InputDecoration(
                  labelText: 'Nombre del Lugar Físico',
                  hintText: 'Ej. Alacena 2, Congelador de Carnes, Cava...',
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: selectedType,
                decoration: const InputDecoration(labelText: 'Tipo de Espacio'),
                items: const [
                  DropdownMenuItem(value: 'pantry', child: Text('Alacena / Despensa Seca')),
                  DropdownMenuItem(value: 'fridge', child: Text('Refrigerador / Cuarto Frío')),
                  DropdownMenuItem(value: 'freezer', child: Text('Congelador Deep-Freeze')),
                  DropdownMenuItem(value: 'cellar', child: Text('Cava Climatizada de Vinos')),
                  DropdownMenuItem(value: 'warehouse', child: Text('Bodega de Insumos')),
                  DropdownMenuItem(value: 'bar', child: Text('Bar / Terraza')),
                ],
                onChanged: (val) {
                  if (val != null) setModalState(() => selectedType = val);
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: tempCtrl,
                decoration: const InputDecoration(
                  labelText: 'Temperatura o Nota (Opcional)',
                  hintText: 'Ej. 4°C, 14°C - 70% HR, -18°C...',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTokens.emeraldPrimary,
                foregroundColor: Colors.white,
              ),
              onPressed: () {
                final name = nameCtrl.text.trim();
                if (name.isNotEmpty) {
                  ref.read(householdsListProvider.notifier).addZone(
                        householdId: householdId,
                        name: name,
                        type: selectedType,
                        temperatureNotes: tempCtrl.text.trim().isNotEmpty ? tempCtrl.text.trim() : null,
                      );
                  Navigator.pop(ctx);
                }
              },
              child: const Text('Crear Zona'),
            ),
          ],
        ),
      ),
    );
  }

  void _showEditZoneDialog(BuildContext context, WidgetRef ref, String householdId, HouseholdZone zone) {
    final nameCtrl = TextEditingController(text: zone.name);
    final tempCtrl = TextEditingController(text: zone.temperatureNotes ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Editar Zona Física'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Nombre')),
            const SizedBox(height: 12),
            TextField(controller: tempCtrl, decoration: const InputDecoration(labelText: 'Temperatura / Nota')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTokens.emeraldPrimary,
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              final name = nameCtrl.text.trim();
              if (name.isNotEmpty) {
                ref.read(householdsListProvider.notifier).updateZone(
                      householdId: householdId,
                      zoneId: zone.id,
                      name: name,
                      temperatureNotes: tempCtrl.text.trim().isNotEmpty ? tempCtrl.text.trim() : null,
                    );
                Navigator.pop(ctx);
              }
            },
            child: const Text('Actualizar'),
          ),
        ],
      ),
    );
  }

  // DIÁLOGO PARA AGREGAR MIEMBRO / USUARIO
  void _showAddMemberDialog(BuildContext context, WidgetRef ref, String householdId) {
    final nameCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    MemberRole selectedRole = MemberRole.service;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.person_add_alt_1, color: AppTokens.emeraldLight),
              SizedBox(width: 8),
              Text('Alta de Usuario / Miembro'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                autofocus: true,
                decoration: const InputDecoration(labelText: 'Nombre Completo', hintText: 'Ej. Juan Pérez...'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: emailCtrl,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Correo Electrónico', hintText: 'juan@alacena...'),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<MemberRole>(
                value: selectedRole,
                decoration: const InputDecoration(labelText: 'Rol & Privilegios (RBAC)'),
                items: MemberRole.values.map((role) {
                  return DropdownMenuItem(
                    value: role,
                    child: Text(role.label, style: const TextStyle(fontSize: 12)),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) setModalState(() => selectedRole = val);
                },
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTokens.emeraldPrimary,
                foregroundColor: Colors.white,
              ),
              onPressed: () {
                final name = nameCtrl.text.trim();
                final email = emailCtrl.text.trim();
                if (name.isNotEmpty && email.isNotEmpty) {
                  ref.read(membersProvider.notifier).addMember(
                        displayName: name,
                        email: email,
                        role: selectedRole,
                        assignedHouseholdId: householdId,
                      );
                  Navigator.pop(ctx);
                }
              },
              child: const Text('Dar de Alta'),
            ),
          ],
        ),
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// PESTAÑA 1: RESIDENCIAS
// -----------------------------------------------------------------------------
class _HouseholdsTab extends StatelessWidget {
  final List<Household> households;
  final Household selectedHousehold;
  final bool isAdmin;
  final bool isDark;
  final Function(Household) onSelect;
  final VoidCallback onAdd;
  final Function(Household) onEdit;
  final Function(Household) onDelete;

  const _HouseholdsTab({
    required this.households,
    required this.selectedHousehold,
    required this.isAdmin,
    required this.isDark,
    required this.onSelect,
    required this.onAdd,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Tus Residencias & Propiedades',
                  style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Text(
                  'Selecciona qué propiedad administrar o agrega una nueva residencia',
                  style: TextStyle(fontSize: 12, color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary),
                ),
              ],
            ),
            if (isAdmin)
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTokens.emeraldPrimary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Nueva Residencia'),
                onPressed: onAdd,
              ),
          ],
        ),
        const SizedBox(height: 16),

        ...households.map((h) {
          final isSelected = h.id == selectedHousehold.id;

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppTokens.emeraldLight.withValues(alpha: isDark ? 0.12 : 0.08)
                  : (isDark ? AppTokens.darkSurface : AppTokens.lightSurface),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isSelected ? AppTokens.emeraldLight : (isDark ? AppTokens.darkBorder : AppTokens.lightBorder),
                width: isSelected ? 2.0 : 1.0,
              ),
            ),
            child: ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: isSelected ? AppTokens.emeraldPrimary : Colors.grey.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.home_work,
                  color: isSelected ? Colors.white : Colors.grey,
                  size: 22,
                ),
              ),
              title: Row(
                children: [
                  Text(h.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  if (isSelected) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTokens.emeraldLight,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text('ACTIVA', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900)),
                    ),
                  ],
                ],
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(h.address, style: const TextStyle(fontSize: 12)),
                  const SizedBox(height: 4),
                  Text(
                    '${h.zones.where((z) => z.id != "all").length} ubicaciones físicas registradas',
                    style: TextStyle(fontSize: 11, color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary),
                  ),
                ],
              ),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (!isSelected)
                    OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () => onSelect(h),
                      child: const Text('Activar'),
                    ),
                  if (isAdmin) ...[
                    IconButton(icon: const Icon(Icons.edit_outlined, size: 20), onPressed: () => onEdit(h)),
                    if (households.length > 1)
                      IconButton(
                        icon: const Icon(Icons.delete_outline, size: 20, color: AppTokens.statusOutOfStock),
                        onPressed: () => onDelete(h),
                      ),
                  ],
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}

// -----------------------------------------------------------------------------
// PESTAÑA 2: ZONAS FÍSICAS DE LA RESIDENCIA
// -----------------------------------------------------------------------------
class _ZonesTab extends StatelessWidget {
  final Household household;
  final bool isAdmin;
  final bool isDark;
  final VoidCallback onAddZone;
  final Function(HouseholdZone) onEditZone;
  final Function(HouseholdZone) onDeleteZone;

  const _ZonesTab({
    required this.household,
    required this.isAdmin,
    required this.isDark,
    required this.onAddZone,
    required this.onEditZone,
    required this.onDeleteZone,
  });

  @override
  Widget build(BuildContext context) {
    final zones = household.zones.where((z) => z.id != 'all').toList();

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Ubicaciones de ${household.name}',
                  style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Text(
                  'Alacenas, refrigeradores, cavas y cuartos fríos específicos de este hogar',
                  style: TextStyle(fontSize: 12, color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary),
                ),
              ],
            ),
            if (isAdmin)
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTokens.emeraldPrimary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.add_location_alt, size: 18),
                label: const Text('Nueva Ubicación'),
                onPressed: onAddZone,
              ),
          ],
        ),
        const SizedBox(height: 16),

        if (zones.isEmpty)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(40.0),
              child: Text('No hay zonas físicas configuradas para esta casa.'),
            ),
          )
        else
          ...zones.map((zone) {
            IconData iconData = Icons.kitchen;
            Color zoneColor = AppTokens.emeraldLight;

            if (zone.type == 'cellar') {
              iconData = Icons.wine_bar;
              zoneColor = AppTokens.wineAccent;
            } else if (zone.type == 'fridge') {
              iconData = Icons.ac_unit;
              zoneColor = const Color(0xFF3B82F6);
            } else if (zone.type == 'freezer') {
              iconData = Icons.severe_cold;
              zoneColor = const Color(0xFF0284C7);
            } else if (zone.type == 'warehouse') {
              iconData = Icons.inventory_2;
              zoneColor = AppTokens.goldAccent;
            } else if (zone.type == 'bar') {
              iconData = Icons.liquor;
              zoneColor = Colors.purple;
            }

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              decoration: BoxDecoration(
                color: isDark ? AppTokens.darkSurface : AppTokens.lightSurface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? AppTokens.darkBorder : AppTokens.lightBorder),
              ),
              child: ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: zoneColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(iconData, color: zoneColor, size: 22),
                ),
                title: Row(
                  children: [
                    Text(zone.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    if (zone.temperatureNotes != null) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.blue.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          zone.temperatureNotes!,
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.blue),
                        ),
                      ),
                    ],
                  ],
                ),
                subtitle: Text('Tipo: ${zone.type.toUpperCase()} • ID: ${zone.id}', style: const TextStyle(fontSize: 11)),
                trailing: isAdmin
                    ? Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(icon: const Icon(Icons.edit_outlined, size: 18), onPressed: () => onEditZone(zone)),
                          IconButton(
                            icon: const Icon(Icons.delete_outline, size: 18, color: AppTokens.statusOutOfStock),
                            onPressed: () => onDeleteZone(zone),
                          ),
                        ],
                      )
                    : null,
              ),
            );
          }),
      ],
    );
  }
}

// -----------------------------------------------------------------------------
// PESTAÑA 3: USUARIOS Y ROLES (RBAC)
// -----------------------------------------------------------------------------
class _MembersTab extends StatelessWidget {
  final List<UserMember> members;
  final bool isAdmin;
  final bool isDark;
  final VoidCallback onAddMember;
  final Function(UserMember, MemberRole) onRoleChange;
  final Function(UserMember) onRemoveMember;

  const _MembersTab({
    required this.members,
    required this.isAdmin,
    required this.isDark,
    required this.onAddMember,
    required this.onRoleChange,
    required this.onRemoveMember,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Equipo y Residentes del Hogar',
                  style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Text(
                  'Control de acceso estricto: Administradores, Servicio, Chef y Familia',
                  style: TextStyle(fontSize: 12, color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary),
                ),
              ],
            ),
            if (isAdmin)
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTokens.emeraldPrimary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.person_add, size: 18),
                label: const Text('Invitar Usuario'),
                onPressed: onAddMember,
              ),
          ],
        ),
        const SizedBox(height: 16),

        ...members.map((member) {
          final role = member.role;

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: isDark ? AppTokens.darkSurface : AppTokens.lightSurface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? AppTokens.darkBorder : AppTokens.lightBorder),
            ),
            child: ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              leading: CircleAvatar(
                backgroundColor: role.color.withValues(alpha: 0.2),
                foregroundColor: role.color,
                child: Icon(role.icon, size: 20),
              ),
              title: Row(
                children: [
                  Text(member.displayName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: role.color.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      role.shortLabel.toUpperCase(),
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: role.color),
                    ),
                  ),
                ],
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(member.email, style: const TextStyle(fontSize: 12)),
                  Text(role.label, style: TextStyle(fontSize: 11, color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary)),
                ],
              ),
              trailing: isAdmin
                  ? Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        DropdownButton<MemberRole>(
                          value: member.role,
                          underline: const SizedBox.shrink(),
                          items: MemberRole.values.map((r) {
                            return DropdownMenuItem(
                              value: r,
                              child: Text(r.shortLabel, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: r.color)),
                            );
                          }).toList(),
                          onChanged: (newRole) {
                            if (newRole != null) onRoleChange(member, newRole);
                          },
                        ),
                        if (members.length > 1)
                          IconButton(
                            icon: const Icon(Icons.person_remove_outlined, size: 18, color: AppTokens.statusOutOfStock),
                            onPressed: () => onRemoveMember(member),
                          ),
                      ],
                    )
                  : null,
            ),
          );
        }),
      ],
    );
  }
}
