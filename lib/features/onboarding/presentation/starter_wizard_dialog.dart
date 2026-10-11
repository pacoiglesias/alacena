import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../inventory/providers/inventory_provider.dart';
import '../../households/providers/household_provider.dart';
import '../../../core/constants/app_colors.dart';

class StarterWizardDialog extends ConsumerStatefulWidget {
  const StarterWizardDialog({super.key});

  static Future<void> show(BuildContext context) {
    return showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => const StarterWizardDialog(),
    );
  }

  @override
  ConsumerState<StarterWizardDialog> createState() => _StarterWizardDialogState();
}

class _StarterWizardDialogState extends ConsumerState<StarterWizardDialog> {
  bool _includePantry = true;
  bool _includeCellar = true;
  bool _includeFridge = true;
  bool _includeCleaning = true;
  bool _isSeeding = false;

  @override
  Widget build(BuildContext context) {
    final household = ref.watch(selectedHouseholdProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      backgroundColor: isDark ? AppColors.darkSurface : AppColors.lightSurface,
      insetPadding: const EdgeInsets.all(20),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.auto_awesome, color: AppColors.primaryLight, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Alacena Base Inteligente',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        'Poblar inventario inicial de ${household.name}',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              'Selecciona los módulos básicos que deseas precargar con artículos estándar, códigos de barra EAN y cantidades ideales:',
              style: TextStyle(fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 16),

            // Opciones de Módulos
            _buildOption(
              title: '🥫 Despensa Esencial (Arroz, Pastas, Aceites, Granos)',
              value: _includePantry,
              onChanged: (v) => setState(() => _includePantry = v),
              itemCount: '25 artículos',
            ),
            _buildOption(
              title: '🍷 Cava Sommelier (Vinos Tintos, Champagne, Destilados)',
              value: _includeCellar,
              onChanged: (v) => setState(() => _includeCellar = v),
              itemCount: '15 etiquetas',
            ),
            _buildOption(
              title: '🧀 Cuarto Frío / Lácteos (Quesos DOP, Jamón Ibérico, Mantequilla)',
              value: _includeFridge,
              onChanged: (v) => setState(() => _includeFridge = v),
              itemCount: '12 artículos',
            ),
            _buildOption(
              title: '🧼 Insumos & Limpieza (Toallas, Detergentes, Jabones)',
              value: _includeCleaning,
              onChanged: (v) => setState(() => _includeCleaning = v),
              itemCount: '8 artículos',
            ),
            const SizedBox(height: 20),

            // Botones de acción
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: _isSeeding ? null : () => Navigator.pop(context),
                  child: const Text('Omitir'),
                ),
                const SizedBox(width: 8),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  icon: _isSeeding
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.flash_on, size: 18),
                  label: Text(_isSeeding ? 'Cargando...' : 'Cargar 50+ Artículos'),
                  onPressed: _isSeeding
                      ? null
                      : () async {
                          setState(() => _isSeeding = true);
                          // Ejecutar seeding en el inventario activo
                          ref.read(inventoryListProvider.notifier).populateStarterPack(household.id);
                          await Future.delayed(const Duration(milliseconds: 600));
                          if (!context.mounted) return;
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('🎉 ¡Se cargaron 50+ artículos en ${household.name}!'),
                              backgroundColor: AppColors.optimal,
                              duration: const Duration(seconds: 3),
                            ),
                          );
                        },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOption({
    required String title,
    required bool value,
    required ValueChanged<bool> onChanged,
    required String itemCount,
  }) {
    return CheckboxListTile(
      value: value,
      activeColor: AppColors.optimal,
      contentPadding: EdgeInsets.zero,
      dense: true,
      title: Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
      subtitle: Text(itemCount, style: const TextStyle(fontSize: 11, color: Colors.grey)),
      onChanged: (v) => onChanged(v ?? false),
    );
  }
}
