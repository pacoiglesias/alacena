import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../../inventory/presentation/inventory_screen.dart';
import '../../inventory/providers/inventory_provider.dart';
import '../../sommelier/presentation/sommelier_cellar_view.dart';
import '../../shopping_list/presentation/shopping_list_screen.dart';
import '../../zero_waste/presentation/zero_waste_chef_screen.dart';
import '../../analytics/presentation/financial_dashboard_screen.dart';
import '../../onboarding/presentation/starter_wizard_dialog.dart';
import '../../scanner/presentation/quick_scan_bottom_sheet.dart';
import '../../hardware/presentation/camera_scanner_dialog.dart';
import '../../hardware/services/nfc_service.dart';
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
    final allItems = ref.watch(inventoryListProvider);

    final screens = [
      const InventoryScreen(),
      const SommelierCellarView(),
      const ShoppingListScreen(),
      const ZeroWasteChefScreen(),
      if (isAdmin) const FinancialDashboardScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: const HouseholdSelectorHeader(),
        actions: [
          // BOTON DE WIZARD DE ONBOARDING (ALACENA BASE 50+ ARTICULOS)
          IconButton(
            icon: const Icon(Icons.auto_awesome, color: AppColors.primaryLight, size: 22),
            tooltip: 'Alacena Base 50+ Artículos (Onboarding)',
            onPressed: () {
              StarterWizardDialog.show(context);
            },
          ),

          // SWITCHER DE ROL (ADMIN vs SERVICIO) PARA VALIDAR RBAC EN 1 TAP
          Container(
            margin: const EdgeInsets.only(right: 8),
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
                  .withValues(alpha: 0.12),
              side: BorderSide.none,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              onPressed: () {
                ref.read(authProvider.notifier).toggleRole();
                if (currentTab >= 4) {
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

      // BOTON FLOTANTE (FAB) CENTRAL: ESCANER UNIVERSAL EN 2 TAPS CON HARDWARE
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: Container(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: AppColors.primaryLight.withValues(alpha: 0.4),
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
            _showScanOptionsModal(context, ref, allItems);
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
            icon: Icon(Icons.kitchen_outlined),
            selectedIcon: Icon(Icons.kitchen, color: AppColors.primaryLight),
            label: 'Alacena',
          ),
          const NavigationDestination(
            icon: Icon(Icons.wine_bar_outlined),
            selectedIcon: Icon(Icons.wine_bar, color: AppColors.wineAccent),
            label: 'Cava',
          ),
          const NavigationDestination(
            icon: Icon(Icons.shopping_cart_outlined),
            selectedIcon: Icon(Icons.shopping_cart, color: AppColors.primaryLight),
            label: 'Compras',
          ),
          const NavigationDestination(
            icon: Icon(Icons.restaurant_menu_outlined),
            selectedIcon: Icon(Icons.restaurant_menu, color: AppColors.optimal),
            label: 'Zero-Waste',
          ),
          if (isAdmin)
            const NavigationDestination(
              icon: Icon(Icons.analytics_outlined),
              selectedIcon: Icon(Icons.analytics, color: AppColors.primaryLight),
              label: 'Finanzas',
            ),
        ],
      ),
    );
  }

  void _showScanOptionsModal(BuildContext context, WidgetRef ref, List allItems) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Escaneo Universal de 2 Taps',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Selecciona el método de hardware (Costo \$0 On-Device):',
                  style: TextStyle(fontSize: 13, color: Colors.grey),
                ),
                const SizedBox(height: 16),

                // Opcion 1: Camara en Vivo
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.camera_alt, color: AppColors.primaryLight),
                  ),
                  title: const Text('Cámara EAN / QR / Barras', style: TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: const Text('Visor láser on-device para etiquetas comerciales y empaques'),
                  onTap: () async {
                    Navigator.pop(ctx);
                    final scannedCode = await CameraScannerDialog.show(context);
                    if (context.mounted && scannedCode != null) {
                      _handleScannedCode(context, allItems, scannedCode, 'ON_DEVICE_CAMERA');
                    }
                  },
                ),

                // Opcion 2: NFC
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.wineAccent.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.nfc, color: AppColors.wineAccent),
                  ),
                  title: const Text('Sensor NFC (Cava & Repisas)', style: TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: const Text('Acerca el teléfono al tag de la botella o estante'),
                  onTap: () {
                    Navigator.pop(ctx);
                    _startNfcScan(context, allItems);
                  },
                ),

                // Opcion 3: Modal Rápido Manual
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.optimal.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.touch_app, color: AppColors.optimal),
                  ),
                  title: const Text('Ajuste de Stock Rápido (Lista)', style: TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: const Text('Modificación táctil inmediata sin usar cámara'),
                  onTap: () {
                    Navigator.pop(ctx);
                    QuickScanBottomSheet.show(context, scanMethod: 'MANUAL');
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _handleScannedCode(BuildContext context, List allItems, String code, String method) {
    final matched = allItems.where((i) =>
        i.qrCode == code || i.barcode == code || i.id == code || code.contains(i.id)).toList();

    if (matched.isNotEmpty) {
      QuickScanBottomSheet.show(context, item: matched.first, scanMethod: method);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Código escaneado: "$code" (Consultando catálogo global EAN...)'),
          backgroundColor: AppColors.primary,
        ),
      );
    }
  }

  void _startNfcScan(BuildContext context, List allItems) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            Icon(Icons.nfc, color: Colors.white),
            SizedBox(width: 10),
            Text('Acerca el teléfono al Tag NFC de la botella o repisa...'),
          ],
        ),
        duration: Duration(seconds: 4),
        backgroundColor: AppColors.wineAccent,
      ),
    );

    NfcService.startNfcReading(
      onTagScanned: (tagId, payload) {
        _handleScannedCode(context, allItems, payload ?? tagId, 'NFC');
      },
      onError: (err) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Aviso NFC: $err. Abriendo simulación de tag...'),
            backgroundColor: AppColors.low,
          ),
        );
        _handleScannedCode(context, allItems, '04:5A:2F:B2:89:12:80', 'NFC');
      },
    );
  }
}
