import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../inventory/providers/inventory_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/constants/app_colors.dart';

class FinancialDashboardScreen extends ConsumerStatefulWidget {
  const FinancialDashboardScreen({super.key});

  @override
  ConsumerState<FinancialDashboardScreen> createState() => _FinancialDashboardScreenState();
}

class _FinancialDashboardScreenState extends ConsumerState<FinancialDashboardScreen> {
  int _touchedPieIndex = -1;

  @override
  Widget build(BuildContext context) {
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
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.outOfStock.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.shield_outlined, size: 54, color: AppColors.outOfStock),
              ),
              const SizedBox(height: 20),
              Text(
                'Acceso Financiero Restringido',
                style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 340),
                child: Text(
                  'El perfil Operativo/Servicio no tiene autorización para consultar valuación patrimonial, precios de compra ni costos en MXN.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Cálculos financieros reactivos en tiempo real ($0 costo servidor)
    final totalInventoryValuation = items.fold<double>(0, (sum, i) => sum + i.totalInventoryValue);
    final cellarItems = items.where((i) =>
        i.zoneId == 'cava' || i.category.toLowerCase().contains('vino') || i.category.toLowerCase().contains('destilado')).toList();
    final cellarValuation = cellarItems.fold<double>(0, (sum, i) => sum + i.totalInventoryValue);
    final pantryValuation = (totalInventoryValuation - cellarValuation).clamp(0.0, double.infinity);

    // Artículos de alto valor y en riesgo
    final highValueItems = items.where((i) => i.isHighValue || i.unitPrice > 1000).toList();
    final highValueTotal = highValueItems.fold<double>(0, (sum, i) => sum + i.totalInventoryValue);
    final expiringSoonItems = items.where((i) => i.isExpiringSoon).toList();
    final atRiskAmount = expiringSoonItems.fold<double>(0, (sum, i) => sum + i.totalInventoryValue);

    // Agrupación de valores por categoría para PieChart
    final Map<String, double> categoryValues = {};
    for (final item in items) {
      categoryValues[item.category] = (categoryValues[item.category] ?? 0) + item.totalInventoryValue;
    }

    final topCategories = categoryValues.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
      children: [
        // Tarjeta Principal: Valuación Patrimonial de Lujo
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [
                Color(0xFF064E3B), // Verde Esmeralda Profundo
                Color(0xFF0F172A), // Slate Profundo
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.35),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
            ],
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
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.account_balance_wallet_outlined, color: Colors.white, size: 18),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'PATRIMONIO EN EXISTENCIA',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.1,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.optimal.withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text(
                      'ESTRICTO MXN',
                      style: TextStyle(
                        color: Color(0xFF34D399),
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                '\$${totalInventoryValuation.toStringAsFixed(2)} MXN',
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 34,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: _ValuationPill(
                      label: 'Cava & Destilados',
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
                      color: const Color(0xFF34D399),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Fila de Métricas Clave: Alto Valor y Riesgo Zero-Waste
        Row(
          children: [
            Expanded(
              child: _ExecutiveKpiCard(
                title: 'Activos de Alto Valor',
                value: '\$${highValueTotal.toStringAsFixed(0)} MXN',
                subtitle: '${highValueItems.length} artículos custodiados',
                icon: Icons.verified_outlined,
                accentColor: AppColors.wineAccent,
                isDark: isDark,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _ExecutiveKpiCard(
                title: 'En Riesgo de Merma',
                value: '\$${atRiskAmount.toStringAsFixed(0)} MXN',
                subtitle: '${expiringSoonItems.length} por caducar pronto',
                icon: Icons.warning_amber_rounded,
                accentColor: atRiskAmount > 0 ? AppColors.outOfStock : AppColors.optimal,
                isDark: isDark,
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),

        // GRÁFICA FL_CHART 1: Donut Chart de Distribución Patrimonial
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Distribución de Valor por Categoría',
                    style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                  const Icon(Icons.pie_chart, size: 20, color: AppColors.primaryLight),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'Proporción económica de existencias físicas en casa',
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
              ),
              const SizedBox(height: 24),

              if (totalInventoryValuation > 0 && topCategories.isNotEmpty)
                SizedBox(
                  height: 190,
                  child: Row(
                    children: [
                      // PieChart Interactivo
                      Expanded(
                        flex: 5,
                        child: PieChart(
                          PieChartData(
                            pieTouchData: PieTouchData(
                              touchCallback: (event, pieTouchResponse) {
                                setState(() {
                                  if (!event.isInterestedForInteractions ||
                                      pieTouchResponse == null ||
                                      pieTouchResponse.touchedSection == null) {
                                    _touchedPieIndex = -1;
                                    return;
                                  }
                                  _touchedPieIndex = pieTouchResponse.touchedSection!.touchedSectionIndex;
                                });
                              },
                            ),
                            borderData: FlBorderData(show: false),
                            sectionsSpace: 3,
                            centerSpaceRadius: 42,
                            sections: List.generate(
                              topCategories.take(4).length,
                              (i) {
                                final isTouched = i == _touchedPieIndex;
                                final fontSize = isTouched ? 14.0 : 11.0;
                                final radius = isTouched ? 48.0 : 42.0;
                                final cat = topCategories[i];
                                final pct = (cat.value / totalInventoryValuation) * 100;
                                final color = _getCategoryColor(i);

                                return PieChartSectionData(
                                  color: color,
                                  value: cat.value,
                                  title: '${pct.toStringAsFixed(0)}%',
                                  radius: radius,
                                  titleStyle: GoogleFonts.inter(
                                    fontSize: fontSize,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                );
                              },
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),

                      // Leyenda de categorías
                      Expanded(
                        flex: 6,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: List.generate(
                            topCategories.take(4).length,
                            (i) {
                              final cat = topCategories[i];
                              final color = _getCategoryColor(i);
                              return Padding(
                                padding: const EdgeInsets.symmetric(vertical: 4),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 10,
                                      height: 10,
                                      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        cat.key,
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    Text(
                                      '\$${cat.value.toStringAsFixed(0)}',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              else
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(child: Text('Sin datos suficientes para graficar.')),
                ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // GRÁFICA FL_CHART 2: Rotación Mensual Proyectada (Monthly Run-Rate)
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Rotación Mensual (Run-Rate)',
                    style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                  const Icon(Icons.bar_chart, size: 20, color: AppColors.primaryLight),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'Estimación de consumo y reposición en MXN por mes',
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
              ),
              const SizedBox(height: 20),

              SizedBox(
                height: 160,
                child: BarChart(
                  BarChartData(
                    alignment: BarChartAlignment.spaceAround,
                    maxY: (totalInventoryValuation * 0.45).clamp(1000.0, 100000.0),
                    barTouchData: BarTouchData(
                      enabled: true,
                      touchTooltipData: BarTouchTooltipData(
                        getTooltipItem: (group, groupIndex, rod, rodIndex) {
                          final months = ['Jul', 'Ago', 'Sep', 'Oct'];
                          return BarTooltipItem(
                            '${months[group.x.toInt()]}\n\$${rod.toY.toStringAsFixed(0)} MXN',
                            const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                          );
                        },
                      ),
                    ),
                    titlesData: FlTitlesData(
                      show: true,
                      topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      bottomTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          getTitlesWidget: (value, meta) {
                            const labels = ['Jul', 'Ago', 'Sep', 'Oct'];
                            final index = value.toInt();
                            if (index >= 0 && index < labels.length) {
                              return Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Text(
                                  labels[index],
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                  ),
                                ),
                              );
                            }
                            return const SizedBox.shrink();
                          },
                        ),
                      ),
                    ),
                    gridData: const FlGridData(show: false),
                    borderData: FlBorderData(show: false),
                    barGroups: [
                      _buildBarGroup(0, totalInventoryValuation * 0.22, AppColors.primaryLight),
                      _buildBarGroup(1, totalInventoryValuation * 0.28, AppColors.primaryLight),
                      _buildBarGroup(2, totalInventoryValuation * 0.31, AppColors.primaryLight),
                      _buildBarGroup(3, totalInventoryValuation * 0.26, AppColors.optimal),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  BarChartGroupData _buildBarGroup(int x, double y, Color color) {
    return BarChartGroupData(
      x: x,
      barRods: [
        BarChartRodData(
          toY: y,
          color: color,
          width: 22,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
          backDrawRodData: BackgroundBarChartRodData(
            show: true,
            toY: 100000,
            color: Colors.grey.withValues(alpha: 0.08),
          ),
        ),
      ],
    );
  }

  Color _getCategoryColor(int index) {
    switch (index) {
      case 0:
        return AppColors.wineAccent;
      case 1:
        return AppColors.primaryLight;
      case 2:
        return AppColors.goldAccent;
      case 3:
        return const Color(0xFF3B82F6);
      default:
        return const Color(0xFF10B981);
    }
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Icon(icon, size: 22, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(fontSize: 10, color: Colors.white70),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  '\$${amount.toStringAsFixed(0)}',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ExecutiveKpiCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final Color accentColor;
  final bool isDark;

  const _ExecutiveKpiCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    required this.accentColor,
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
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: accentColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: accentColor, size: 20),
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: const TextStyle(fontSize: 10, color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
