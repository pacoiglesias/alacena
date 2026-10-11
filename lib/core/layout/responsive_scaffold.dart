import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/tokens.dart';

class ResponsiveNavigationItem {
  final IconData icon;
  final IconData selectedIcon;
  final String label;

  const ResponsiveNavigationItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
  });
}

class ResponsiveScaffold extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onDestinationSelected;
  final List<ResponsiveNavigationItem> destinations;
  final Widget body;
  final Widget? floatingActionButton;
  final FloatingActionButtonLocation? floatingActionButtonLocation;
  final PreferredSizeWidget? appBar;
  final String title;
  final Widget? trailingHeader;

  const ResponsiveScaffold({
    super.key,
    required this.selectedIndex,
    required this.onDestinationSelected,
    required this.destinations,
    required this.body,
    this.floatingActionButton,
    this.floatingActionButtonLocation,
    this.appBar,
    this.title = 'ALACENA Enterprise',
    this.trailingHeader,
  });

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // 1. Layout Móvil (< 600px): Bottom Navigation Bar + FAB Flotante
    if (width < AppTokens.bpMobile) {
      final showMore = destinations.length > 5;
      final mobileDestinations = showMore
          ? [
              ...destinations.sublist(0, 4),
              const ResponsiveNavigationItem(
                icon: Icons.grid_view_outlined,
                selectedIcon: Icons.grid_view,
                label: 'Más',
              ),
            ]
          : destinations;

      final mobileIndex = showMore
          ? (selectedIndex >= 4 ? 4 : selectedIndex)
          : selectedIndex.clamp(0, destinations.length - 1);

      return Scaffold(
        appBar: appBar,
        body: body,
        floatingActionButtonLocation: floatingActionButtonLocation,
        floatingActionButton: floatingActionButton,
        bottomNavigationBar: NavigationBar(
          selectedIndex: mobileIndex,
          onDestinationSelected: (idx) {
            if (showMore && idx == 4) {
              _showMoreBottomSheet(context, isDark);
            } else {
              onDestinationSelected(idx);
            }
          },
          destinations: mobileDestinations.map((d) {
            return NavigationDestination(
              icon: Icon(d.icon),
              selectedIcon: Icon(d.selectedIcon, color: AppTokens.emeraldLight),
              label: d.label,
            );
          }).toList(),
        ),
      );
    }

    // 2. Layout Tablet (600px - 1024px): NavigationRail Lateral Compacto
    if (width < 1024) {
      return Scaffold(
        body: Row(
          children: [
            NavigationRail(
              selectedIndex: selectedIndex.clamp(0, destinations.length - 1),
              onDestinationSelected: onDestinationSelected,
              backgroundColor: isDark ? AppTokens.darkSurface : AppTokens.lightSurface,
              indicatorColor: AppTokens.emeraldLight.withValues(alpha: 0.15),
              labelType: NavigationRailLabelType.all,
              leading: Padding(
                padding: const EdgeInsets.symmetric(vertical: AppTokens.s12),
                child: floatingActionButton != null
                    ? SizedBox(width: 48, height: 48, child: floatingActionButton)
                    : Container(
                        padding: const EdgeInsets.all(AppTokens.s8),
                        decoration: BoxDecoration(
                          color: AppTokens.emeraldPrimary,
                          borderRadius: BorderRadius.circular(AppTokens.r12),
                        ),
                        child: const Icon(Icons.kitchen, color: Colors.white, size: 24),
                      ),
              ),
              destinations: destinations.map((d) {
                return NavigationRailDestination(
                  icon: Icon(d.icon),
                  selectedIcon: Icon(d.selectedIcon, color: AppTokens.emeraldLight),
                  label: Text(d.label, style: const TextStyle(fontSize: 11)),
                );
              }).toList(),
            ),
            const VerticalDivider(width: 1, thickness: 1),
            Expanded(
              child: Column(
                children: [
                  ?appBar,
                  Expanded(child: body),
                ],
              ),
            ),
          ],
        ),
      );
    }

    // 3. Layout Desktop First-Class (≥ 1024px): Sidebar Completo Estilo Linear / Arc
    return Scaffold(
      body: Row(
        children: [
          // Sidebar de Navegación Profesional
          Container(
            width: 240,
            decoration: BoxDecoration(
              color: isDark ? AppTokens.darkSurface : AppTokens.lightSurface,
              border: Border(
                right: BorderSide(
                  color: isDark ? AppTokens.darkBorder : AppTokens.lightBorder,
                  width: 1,
                ),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header del Sidebar
                Padding(
                  padding: const EdgeInsets.fromLTRB(AppTokens.s20, AppTokens.s20, AppTokens.s20, AppTokens.s16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(AppTokens.s8),
                        decoration: BoxDecoration(
                          color: AppTokens.emeraldPrimary,
                          borderRadius: BorderRadius.circular(AppTokens.r10),
                        ),
                        child: const Icon(Icons.kitchen, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: AppTokens.s10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'ALACENA',
                              style: GoogleFonts.inter(
                                fontSize: 15,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              'Enterprise Suite',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),
                const SizedBox(height: AppTokens.s12),

                // Lista de Destinos del Sidebar
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: AppTokens.s10),
                    itemCount: destinations.length,
                    separatorBuilder: (_, _) => const SizedBox(height: AppTokens.s4),
                    itemBuilder: (context, i) {
                      final item = destinations[i];
                      final isSelected = i == selectedIndex;

                      return InkWell(
                        onTap: () => onDestinationSelected(i),
                        borderRadius: BorderRadius.circular(AppTokens.r10),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppTokens.s12,
                            vertical: AppTokens.s10,
                          ),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppTokens.emeraldLight.withValues(alpha: isDark ? 0.15 : 0.1)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(AppTokens.r10),
                            border: isSelected
                                ? Border.all(
                                    color: AppTokens.emeraldLight.withValues(alpha: 0.3),
                                    width: 1,
                                  )
                                : null,
                          ),
                          child: Row(
                            children: [
                              Icon(
                                isSelected ? item.selectedIcon : item.icon,
                                size: 18,
                                color: isSelected
                                    ? AppTokens.emeraldLight
                                    : (isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary),
                              ),
                              const SizedBox(width: AppTokens.s12),
                              Text(
                                item.label,
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                  color: isSelected
                                      ? (isDark ? Colors.white : AppTokens.emeraldPrimary)
                                      : (isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),

                // Botón Rápido de Escáner en Desktop
                if (floatingActionButton != null)
                  Padding(
                    padding: const EdgeInsets.all(AppTokens.s16),
                    child: SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: floatingActionButton,
                    ),
                  ),

                // Footer de Versión & Conectividad
                Padding(
                  padding: const EdgeInsets.fromLTRB(AppTokens.s16, 0, AppTokens.s16, AppTokens.s16),
                  child: Text(
                    'v2.4.0 • Spark Cloud \$0',
                    style: TextStyle(
                      fontSize: 10,
                      color: isDark ? AppTokens.darkTextTertiary : AppTokens.lightTextTertiary,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Contenedor Principal de la Página
          Expanded(
            child: Column(
              children: [
                ?appBar,
                Expanded(child: body),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showMoreBottomSheet(BuildContext context, bool isDark) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Text(
                    'Módulos del Sistema',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
                ...destinations.asMap().entries.skip(4).map((entry) {
                  final idx = entry.key;
                  final item = entry.value;
                  final isSelected = idx == selectedIndex;

                  return ListTile(
                    leading: Icon(
                      isSelected ? item.selectedIcon : item.icon,
                      color: isSelected ? AppTokens.emeraldLight : null,
                    ),
                    title: Text(
                      item.label,
                      style: TextStyle(
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        color: isSelected ? AppTokens.emeraldLight : null,
                      ),
                    ),
                    trailing: isSelected
                        ? const Icon(Icons.check, color: AppTokens.emeraldLight, size: 18)
                        : null,
                    onTap: () {
                      Navigator.pop(ctx);
                      onDestinationSelected(idx);
                    },
                  );
                }),
              ],
            ),
          ),
        );
      },
    );
  }
}

