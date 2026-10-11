import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../inventory/providers/inventory_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/constants/app_colors.dart';

class FinancialDashboardScreen extends ConsumerWidget {
  const FinancialDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(filteredInventoryProvider);
    final isAdmin = ref.watch(isUserAdminProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (!isAdmin) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.outOfStock.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.lock, size: 48, color: AppColors.outOfStock),
              ),
              const SizedBox(height: 16),
              const Text(
                'Acceso Financiero Protegido',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Solo los Administradores y la Familia pueden ver la valuación de inventario y gastos.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: Colors.grey),
              ),
            ],
          ),
        ),
      );
    }

    // Cálculos financieros locales ($0 costo de servidor)
    final totalInventoryValuation = items.fold<double>(0, (sum, i) => sum + i.totalInventoryValue);
    final cellarValuation = items
        .where((i) => i.zoneId == 'cava' || i.category.contains('Vino') || i.category.contains('Destilados'))
        .fold<double>(0, (sum, i) => sum + i.totalInventoryValue);
    final pantryValuation = totalInventoryValuation - cellarValuation;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
      children: [
        // Tarjeta Principal: Valuación Patrimonial
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [
                Color(0xFF0F172A),
                Color(0xFF1E3A8A),
                Color(0xFF3B82F6),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.35),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'VALUACIÓN TOTAL DE INVENTARIO',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.1,
                    ),
                  ),
                  Icon(Icons.account_balance_wallet, color: Colors.white, size: 20),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '\$${totalInventoryValuation.toStringAsFixed(0)} MXN',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _ValuationPill(
                      label: 'Cava de Vinos',
                      amount: cellarValuation,
                      icon: Icons.wine_bar,
                      color: AppColors.goldAccent,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _ValuationPill(
                      label: 'Alacena & Despensa',
                      amount: pantryValuation,
                      icon: Icons.kitchen,
                      color: AppColors.optimal,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Fila de Métricas Clave (Ahorro Zero-Waste & Inflación)
        Row(
          children: [
            Expanded(
              child: _MetricCard(
                title: 'Salvado con Zero-Waste',
                value: '\$1,850 MXN',
                subtitle: 'Alimentos rescatados este mes',
                icon: Icons.eco,
                color: AppColors.optimal,
                isDark: isDark,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _MetricCard(
                title: 'Inflación Canasta Hogar',
                value: '+4.2%',
                subtitle: 'Frente al trimestre previo',
                icon: Icons.trending_up,
                color: AppColors.low,
                isDark: isDark,
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),

        // Desglose de Gastos por Categoría
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Distribución de Valor por Categoría',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                  Icon(Icons.pie_chart_outline, size: 18, color: Colors.grey),
                ],
              ),
              const SizedBox(height: 16),
              _CategoryProgressBar(
                label: 'Vinos Tintos & Cava',
                amount: cellarValuation,
                total: totalInventoryValuation,
                color: AppColors.wineAccent,
                isDark: isDark,
              ),
              const SizedBox(height: 10),
              _CategoryProgressBar(
                label: 'Despensa Gourmet & Granos',
                amount: pantryValuation * 0.55,
                total: totalInventoryValuation,
                color: AppColors.primaryLight,
                isDark: isDark,
              ),
              const SizedBox(height: 10),
              _CategoryProgressBar(
                label: 'Lácteos & Cuarto Frío',
                amount: pantryValuation * 0.30,
                total: totalInventoryValuation,
                color: AppColors.goldAccent,
                isDark: isDark,
              ),
              const SizedBox(height: 10),
              _CategoryProgressBar(
                label: 'Insumos & Limpieza',
                amount: pantryValuation * 0.15,
                total: totalInventoryValuation,
                color: AppColors.optimal,
                isDark: isDark,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ValuationPill extends StatelessWidget {
  final String label;
  final double amount;
  final IconData icon;
  final Color color;

  const _ValuationPill({
    required this.label,
    required this.amount,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 10, color: Colors.white70)),
              Text(
                '\$${amount.toStringAsFixed(0)}',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color color;
  final bool isDark;

  const _MetricCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 8),
          Text(title, style: TextStyle(fontSize: 11, color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 2),
          Text(subtitle, style: const TextStyle(fontSize: 9, color: Colors.grey)),
        ],
      ),
    );
  }
}

class _CategoryProgressBar extends StatelessWidget {
  final String label;
  final double amount;
  final double total;
  final Color color;
  final bool isDark;

  const _CategoryProgressBar({
    required this.label,
    required this.amount,
    required this.total,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final pct = total > 0 ? (amount / total).clamp(0.0, 1.0) : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            Text(
              '\$${amount.toStringAsFixed(0)} MXN (${(pct * 100).toStringAsFixed(1)}%)',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: pct,
            backgroundColor: isDark ? AppColors.darkBorder : AppColors.lightBorder,
            valueColor: AlwaysStoppedAnimation(color),
            minHeight: 7,
          ),
        ),
      ],
    );
  }
}
