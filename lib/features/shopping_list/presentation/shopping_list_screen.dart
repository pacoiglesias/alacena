import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/shopping_item_model.dart';
import '../providers/shopping_list_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/constants/app_colors.dart';

class ShoppingListScreen extends ConsumerWidget {
  const ShoppingListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(filteredShoppingListProvider);
    final isAdmin = ref.watch(isUserAdminProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Calcular ahorro potencial acumulado por comparar precios web
    final totalSavings = items.fold<double>(0, (sum, i) => sum + (i.potentialSavings ?? 0));

    return Column(
      children: [
        // Banner AI Auto-Shopping & Comparador Web
        Container(
          margin: const EdgeInsets.fromLTRB(16, 12, 16, 6),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AppColors.primary,
                AppColors.wineAccent.withValues(alpha: 0.85),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.3),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.auto_awesome, color: Colors.white, size: 24),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Agente IA de Compras & Web',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        Text(
                          'Gemini 1.5 Flash (Tier \$0) • Google Shopping',
                          style: TextStyle(color: Colors.white70, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.camera_alt, size: 16),
                    label: const Text('Analizar'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.primary,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                    ),
                    onPressed: () {
                      _showGeminiAnalysisDialog(context, ref);
                    },
                  ),
                ],
              ),
              if (totalSavings > 0 && isAdmin) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.black26,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.trending_down, color: AppColors.optimal, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        'Ahorro estimado comparando en web: \$${totalSavings.toStringAsFixed(0)} MXN',
                        style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),

        // Barra colaborativa en vivo (Live Stream Indicator)
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
          child: Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppColors.optimal,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 6),
              Text(
                'Sincronización en vivo activa entre familiares',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
              ),
              const Spacer(),
              // Botón para simular comando de voz (Siri / Google Assistant)
              InkWell(
                onTap: () => _simulateVoiceAssistant(context, ref),
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  child: Row(
                    children: [
                      Icon(Icons.mic, size: 16, color: AppColors.primaryLight),
                      const SizedBox(width: 4),
                      Text(
                        'Siri / Voz',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryLight),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        // Lista de compras interactiva
        Expanded(
          child: items.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.check_circle_outline,
                        size: 64,
                        color: AppColors.optimal.withValues(alpha: 0.8),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        '¡Alacena y cava al 100%!',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'No hay compras pendientes para este hogar.',
                        style: TextStyle(
                          fontSize: 13,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final item = items[index];
                    return _ShoppingListItemCard(
                      item: item,
                      isAdmin: isAdmin,
                      isDark: isDark,
                      onTogglePurchased: () {
                        ref.read(shoppingListProvider.notifier).togglePurchased(item.id);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              item.isPurchased
                                  ? 'Revertido: ${item.name}'
                                  : '✓ Comprado: Se sumaron +${item.neededQuantity} al inventario.',
                            ),
                            backgroundColor:
                                item.isPurchased ? AppColors.low : AppColors.optimal,
                            duration: const Duration(seconds: 2),
                          ),
                        );
                      },
                    );
                  },
                ),
        ),
      ],
    );
  }

  void _showGeminiAnalysisDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.auto_awesome, color: AppColors.primaryLight),
            SizedBox(width: 8),
            Text('Analizar Alacena'),
          ],
        ),
        content: const Text(
          'Gemini 1.5 Flash (Tier \$0) procesará la foto de la alacena para detectar repisas vacías y agregarlas automáticamente a tu lista con comparativa de precios.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('✨ Gemini Vision analizó la alacena: 2 artículos detectados agregados a la lista.'),
                  backgroundColor: AppColors.primary,
                  duration: Duration(seconds: 3),
                ),
              );
            },
            child: const Text('Tomar Foto & Analizar'),
          ),
        ],
      ),
    );
  }

  void _simulateVoiceAssistant(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.mic, color: AppColors.primaryLight, size: 28),
                SizedBox(width: 10),
                Text('Comando de Voz (Siri / Assistant)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 12),
            const Text(
              'Prueba cómo los App Intents y App Actions agregan productos diciendo:',
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.black12, borderRadius: BorderRadius.circular(12)),
              child: const Text('"Oye Siri, agrega 2 botellas de leche a la Alacena"', style: TextStyle(fontStyle: FontStyle.italic)),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 44),
              ),
              onPressed: () {
                ref.read(shoppingListProvider.notifier).addItem(
                      ShoppingItem(
                        id: 'voice_${DateTime.now().millisecondsSinceEpoch}',
                        householdId: 'casa-principal',
                        name: 'Leche Deslactosada Orgánica',
                        category: 'Lácteos & Huevos',
                        neededQuantity: 2,
                        unit: 'litro',
                        estimatedPrice: 38.00,
                        source: 'VOICE_ASSISTANT',
                        createdAt: DateTime.now(),
                      ),
                    );
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('🎙️ Agregado por Voz: "2 litros de Leche Deslactosada"'),
                    backgroundColor: AppColors.optimal,
                  ),
                );
              },
              child: const Text('Simular Disparo de Voz'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ShoppingListItemCard extends StatelessWidget {
  final ShoppingItem item;
  final bool isAdmin;
  final bool isDark;
  final VoidCallback onTogglePurchased;

  const _ShoppingListItemCard({
    required this.item,
    required this.isAdmin,
    required this.isDark,
    required this.onTogglePurchased,
  });

  @override
  Widget build(BuildContext context) {
    final hasCheapestWeb = item.cheapestVendor != null && item.potentialSavings != null;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: item.isPurchased
              ? AppColors.optimal.withValues(alpha: 0.5)
              : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
        ),
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Checkbox(
                value: item.isPurchased,
                activeColor: AppColors.optimal,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                onChanged: (_) => onTogglePurchased(),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.name,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        decoration: item.isPurchased ? TextDecoration.lineThrough : null,
                        color: item.isPurchased
                            ? (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary)
                            : null,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        _buildSourceBadge(item.source),
                        const SizedBox(width: 8),
                        Text(
                          '${item.neededQuantity} ${item.unit}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (isAdmin && item.estimatedPrice != null)
                Text(
                  '~\$${(item.estimatedPrice! * item.neededQuantity).toStringAsFixed(0)}',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                ),
            ],
          ),

          // FILA DE COMPARACIÓN WEB (AGENTE DE PRECIOS GOOGLE SHOPPING)
          if (hasCheapestWeb && !item.isPurchased) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.optimal.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.optimal.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.shopping_bag_outlined, size: 14, color: AppColors.optimal),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Más barato en ${item.cheapestVendor}: \$${item.cheapestPrice?.toStringAsFixed(0)} MXN (Ahorras \$${item.potentialSavings?.toStringAsFixed(0)})',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppColors.optimal,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSourceBadge(String source) {
    String label;
    Color color;

    switch (source) {
      case 'AI_PREDICTIVE':
        label = 'ML Predictivo';
        color = AppColors.primaryLight;
        break;
      case 'VOICE_ASSISTANT':
        label = 'Comando de Voz';
        color = AppColors.goldAccent;
        break;
      case 'AI_VISION_DETECT':
        label = 'Gemini Vision';
        color = AppColors.wineAccent;
        break;
      default:
        label = 'Stock Bajo';
        color = AppColors.low;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }
}
