import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../inventory/providers/inventory_provider.dart';
import '../../../core/constants/app_colors.dart';

class ZeroWasteChefScreen extends ConsumerWidget {
  const ZeroWasteChefScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final allItems = ref.watch(filteredInventoryProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Productos que expiran pronto o con stock bajo para aprovechar
    final expiringItems = allItems.where((i) => i.isExpiringSoon || i.stockStatus == 'LOW').toList();

    return Column(
      children: [
        // Banner Zero-Waste Chef
        Container(
          margin: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [
                Color(0xFF065F46), // Verde esmeralda profundo
                Color(0xFF047857),
                Color(0xFF0F172A),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: AppColors.optimal.withValues(alpha: 0.3),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.restaurant_menu, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Chef IA Zero-Waste',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Recetas para salvar ${expiringItems.length} productos (\$0 desperdicio)',
                      style: const TextStyle(color: Colors.white70, fontSize: 11),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Column(
                  children: [
                    Text(
                      '\$1,850',
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                        color: Color(0xFF065F46),
                      ),
                    ),
                    Text(
                      'Salvado este mes',
                      style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        // Lista de Recetas Sugeridas
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 6, 16, 96),
            children: [
              _RecipeCard(
                title: 'Risotto con Parmigiano Reggiano y Aceite Extra Virgen',
                prepTime: '25 min',
                difficulty: 'Fácil',
                moneySaved: 420.00,
                winePairing: 'Vino Matarromera Crianza de la Cava',
                ingredientsUsed: const [
                  'Queso Parmigiano Reggiano 24 Meses (Caduca en 3 días)',
                  'Arroz Grano Largo Verde Valle',
                  'Aceite de Oliva Extra Virgen Oro Bailén',
                ],
                instructions: const [
                  'Nacarar el arroz con un toque de aceite de oliva en cacerola caliente.',
                  'Agregar caldo caliente poco a poco hasta lograr textura cremosa.',
                  'Mantecar con el queso Parmigiano antes de que termine su ventana óptima.',
                ],
                isDark: isDark,
              ),
              const SizedBox(height: 12),
              _RecipeCard(
                title: 'Tostas Gourmet de Jamón Ibérico y Aceite de Oliva',
                prepTime: '10 min',
                difficulty: 'Muy Fácil',
                moneySaved: 580.00,
                winePairing: 'Vino Vega Sicilia Único 2010',
                ingredientsUsed: const [
                  'Jamón Ibérico 5 Jotas (Aprovechamiento inmediato)',
                  'Aceite de Oliva Extra Virgen Reserva',
                  'Pasta o pan rústico tostado',
                ],
                instructions: const [
                  'Tostar ligeramente el pan o bases rústicas.',
                  'Frotar con ajo y bañar con aceite de oliva extra virgen.',
                  'Montar las lonchas de jamón ibérico a temperatura ambiente.',
                ],
                isDark: isDark,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _RecipeCard extends StatelessWidget {
  final String title;
  final String prepTime;
  final String difficulty;
  final double moneySaved;
  final String winePairing;
  final List<String> ingredientsUsed;
  final List<String> instructions;
  final bool isDark;

  const _RecipeCard({
    required this.title,
    required this.prepTime,
    required this.difficulty,
    required this.moneySaved,
    required this.winePairing,
    required this.ingredientsUsed,
    required this.instructions,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.optimal.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Salvas: \$${moneySaved.toStringAsFixed(0)} MXN',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: AppColors.optimal,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.timer_outlined, size: 14, color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
              const SizedBox(width: 4),
              Text(prepTime, style: TextStyle(fontSize: 11, color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary)),
              const SizedBox(width: 12),
              Icon(Icons.bolt, size: 14, color: AppColors.goldAccent),
              const SizedBox(width: 4),
              Text(difficulty, style: const TextStyle(fontSize: 11, color: AppColors.goldAccent)),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'Ingredientes en Riesgo de Desperdicio Rescatados:',
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          ...ingredientsUsed.map((ing) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 1.5),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, size: 12, color: AppColors.optimal),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(ing, style: const TextStyle(fontSize: 11)),
                    ),
                  ],
                ),
              )),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.wineAccent.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                const Icon(Icons.wine_bar, size: 16, color: AppColors.wineAccent),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'Maridaje sugerido: $winePairing',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.wineAccent),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
