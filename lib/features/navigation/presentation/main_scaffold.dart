import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../../inventory/presentation/inventory_screen.dart';
import '../../shopping_list/presentation/shopping_list_screen.dart';
import '../../audit_trail/presentation/audit_trail_screen.dart';
import '../../scanner/presentation/quick_scan_bottom_sheet.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/widgets/household_selector_header.dart';

class CurrentTabNotifier extends Notifier<int> {
  @override
  int build() => 0;

  void setTab(int tab) => state = tab;
}

final currentTabProvider = NotifierProvider<CurrentTabNotifier, int>(() {
  return CurrentTabNotifier();
});

class MainScaffold extends ConsumerWidget {
  const MainScaffold({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentTab = ref.watch(currentTabProvider);
    final user = ref.watch(authProvider);
    final isAdmin = ref.watch(isUserAdminProvider);

    final screens = [
      const InventoryScreen(),
      const ShoppingListScreen(),
      if (isAdmin) const AuditTrailScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: const HouseholdSelectorHeader(),
        actions: [
          // SWITCHER DE ROL (ADMIN vs SERVICIO) PARA PRUEBAS INMEDIATAS
          Container(
            margin: const EdgeInsets.only(right: 12),
            child: ActionChip(
              avatar: Icon(
                isAdmin ? Icons.admin_panel_settings : Icons.cleaning_services,
                size: 16,
                color: isAdmin ? AppColors.wineAccent : AppColors.primaryLight,
              ),
              label: Text(
                user?.role.label ?? 'Rol',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: isAdmin ? AppColors.wineAccent : AppColors.primaryLight,
                ),
              ),
              backgroundColor: (isAdmin ? AppColors.wineAccent : AppColors.primaryLight)
                  .withOpacity(0.12),
              side: BorderSide.none,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              onPressed: () {
                ref.read(authProvider.notifier).toggleRole();
                // Si cambiamos a Servicio y estamos en el tab de Audit Trail, volver a inventario
                if (currentTab >= 2) {
                  ref.read(currentTabProvider.notifier).setTab(0);
                }
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'Modo cambiado a: ${ref.read(authProvider)?.role.label}',
                    ),
                    duration: const Duration(seconds: 1),
                  ),
                );
              },
            ),
          ),
        ],
      ),
      body: screens[currentTab.clamp(0, screens.length - 1)],

      // BOTON FLOTANTE (FAB) CENTRAL: ESCANER UNIVERSAL EN 2 TAPS
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: Container(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: AppColors.primaryLight.withOpacity(0.4),
              blurRadius: 16,
              spreadRadius: 2,
            ),
          ],
        ),
        child: FloatingActionButton(
          elevation: 6,
          backgroundColor: AppColors.primary,
          child: const Icon(Icons.qr_code_scanner, size: 28, color: Colors.white),
          onPressed: () {
            // REGLA DE LOS 2 TAPS: El FAB abre el bottom sheet directo
            QuickScanBottomSheet.show(context, scanMethod: 'QR');
          },
        ),
      ),

      // BOTTOM NAVIGATION BAR EMPRESARIAL
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentTab.clamp(0, screens.length - 1),
        onDestinationSelected: (index) {
          ref.read(currentTabProvider.notifier).setTab(index);
        },
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            selectedIcon: Icon(Icons.inventory_2, color: AppColors.primaryLight),
            label: 'Inventario',
          ),
          const NavigationDestination(
            icon: Icon(Icons.shopping_cart_outlined),
            selectedIcon: Icon(Icons.shopping_cart, color: AppColors.primaryLight),
            label: 'Compras',
          ),
          if (isAdmin)
            const NavigationDestination(
              icon: Icon(Icons.security_outlined),
              selectedIcon: Icon(Icons.security, color: AppColors.primaryLight),
              label: 'Auditoría',
            ),
        ],
      ),
    );
  }
}
