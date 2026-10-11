import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/households/providers/household_provider.dart';
import '../../features/navigation/presentation/main_scaffold.dart';
import '../constants/app_colors.dart';

class HouseholdSelectorHeader extends ConsumerWidget {
  const HouseholdSelectorHeader({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final households = ref.watch(householdsListProvider);
    final selectedHousehold = ref.watch(selectedHouseholdProvider);
    final selectedZone = ref.watch(selectedZoneProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Selector de Hogar
        InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () {
            _showHouseholdPicker(context, ref, households, selectedHousehold.id);
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.location_on,
                    size: 18,
                    color: AppColors.primaryLight,
                  ),
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'RESIDENCIA ACTIVA',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.1,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        ),
                      ),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Flexible(
                            child: Text(
                              selectedHousehold.name,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                              ),
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(
                            Icons.keyboard_arrow_down,
                            size: 20,
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),

        // Chips horizontales de Zonas (Alacena 1, Cava, Refrigerador, etc.)
        SizedBox(
          height: 44,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            scrollDirection: Axis.horizontal,
            itemCount: selectedHousehold.zones.length,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final zone = selectedHousehold.zones[index];
              final isSelected = selectedZone == zone.id;

              return ChoiceChip(
                label: Text(zone.name),
                selected: isSelected,
                onSelected: (selected) {
                  if (selected) {
                    ref.read(selectedZoneProvider.notifier).setZone(zone.id);
                  }
                },
                selectedColor: AppColors.primary.withOpacity(0.2),
                labelStyle: TextStyle(
                  fontSize: 13,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected
                      ? (isDark ? AppColors.primaryLight : AppColors.primary)
                      : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                ),
                side: BorderSide(
                  color: isSelected
                      ? (isDark ? AppColors.primaryLight : AppColors.primary)
                      : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  void _showHouseholdPicker(
    BuildContext context,
    WidgetRef ref,
    List households,
    String currentId,
  ) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Seleccionar Residencia',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                ...households.map((h) {
                  final isSelected = h.id == currentId;
                  return ListTile(
                    leading: Icon(
                      Icons.home_outlined,
                      color: isSelected ? AppColors.primaryLight : null,
                    ),
                    title: Text(
                      h.name,
                      style: TextStyle(
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                    subtitle: Text(h.address),
                    trailing: isSelected
                        ? const Icon(Icons.check_circle, color: AppColors.primaryLight)
                        : null,
                    onTap: () {
                      ref.read(selectedHouseholdProvider.notifier).selectHousehold(h.id);
                      Navigator.pop(context);
                    },
                  );
                }),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.settings_suggest_outlined, color: AppColors.primaryLight),
                  title: const Text(
                    'Administrar Casas, Zonas y Usuarios',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  subtitle: const Text('Crear residencias, añadir zonas o gestionar permisos', style: TextStyle(fontSize: 11)),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                  onTap: () {
                    Navigator.pop(context);
                    ref.read(currentTabProvider.notifier).setTab(6);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
