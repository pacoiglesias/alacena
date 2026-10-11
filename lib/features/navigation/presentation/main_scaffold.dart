import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../auth/providers/auth_provider.dart';
import '../../inventory/presentation/inventory_screen.dart';
import '../../inventory/providers/inventory_provider.dart';
import '../../inventory/data/demo_data_seeder.dart';
import '../../sommelier/presentation/sommelier_cellar_view.dart';
import '../../shopping_list/presentation/shopping_list_screen.dart';
import '../../analytics/presentation/financial_dashboard_screen.dart';
import '../../scanner/presentation/quick_scan_bottom_sheet.dart';
import '../../hardware/presentation/camera_scanner_dialog.dart';
import '../../hardware/services/nfc_service.dart';
import '../../hardware/services/deep_link_qr_service.dart';
import 'package:uuid/uuid.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/widgets/household_selector_header.dart';
import '../../../core/services/ean_lookup_service.dart';
import '../../inventory/models/inventory_item_model.dart';
import '../../households/providers/household_provider.dart';

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

    // Pantallas base según rol RBAC:
    // Admin: 1) Dashboard/Gráficas, 2) Inventario, 3) Lista de Compras, 4) Cava & Zero-Waste
    // Servicio: 1) Inventario, 2) Lista de Compras, 3) Cava
    final screens = isAdmin
        ? [
            const FinancialDashboardScreen(),
            const InventoryScreen(),
            const ShoppingListScreen(),
            const SommelierCellarView(),
          ]
        : [
            const InventoryScreen(),
            const ShoppingListScreen(),
            const SommelierCellarView(),
          ];

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: const HouseholdSelectorHeader(),
        actions: [
          // BOTON MAGICO "CARGAR DATOS DEMO" (ADMIN)
          if (isAdmin)
            Container(
              margin: const EdgeInsets.only(right: 6),
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                icon: const Icon(Icons.bolt, size: 16, color: Color(0xFFF59E0B)),
                label: Text(
                  'Datos Demo',
                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold),
                ),
                onPressed: () async {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('⚡ Sembrando 10 productos reales en Firestore (Precios en MXN)...'),
                      duration: Duration(seconds: 2),
                    ),
                  );
                  await DemoDataSeeder.seedDemoData();
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('✅ ¡10 Productos Demo creados con éxito con precios en MXN!'),
                        backgroundColor: AppColors.optimal,
                        duration: Duration(seconds: 3),
                      ),
                    );
                  }
                },
              ),
            ),

          // SWITCHER DE ROL (ADMIN vs SERVICIO) PARA VALIDAR RBAC EN 1 TAP
          Container(
            margin: const EdgeInsets.only(right: 4),
            child: ActionChip(
              avatar: Icon(
                isAdmin ? Icons.admin_panel_settings : Icons.cleaning_services,
                size: 14,
                color: isAdmin ? AppColors.wineAccent : AppColors.primaryLight,
              ),
              label: Text(
                user?.role.label ?? 'Rol',
                style: GoogleFonts.inter(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  color: isAdmin ? AppColors.wineAccent : AppColors.primaryLight,
                ),
              ),
              backgroundColor: (isAdmin ? AppColors.wineAccent : AppColors.primaryLight)
                  .withValues(alpha: 0.12),
              side: BorderSide.none,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              onPressed: () {
                ref.read(authProvider.notifier).toggleRole();
                ref.read(currentTabProvider.notifier).setTab(0);
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

          // BOTON DE CIERRE DE SESION (RUTA SEGURA)
          IconButton(
            icon: const Icon(Icons.logout, size: 20),
            tooltip: 'Cerrar Sesión',
            onPressed: () {
              ref.read(authProvider.notifier).signOut();
            },
          ),
        ],
      ),
      body: screens[currentTab.clamp(0, screens.length - 1)],

      // FAB GIGANTE CENTRAL: ESCANER INMEDIATO DE 2 TAPS (ESTILO APPLE/STRIPE)
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: Container(
        width: 66,
        height: 66,
        margin: const EdgeInsets.only(top: 14),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: const LinearGradient(
            colors: [Color(0xFF10B981), Color(0xFF065F46)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.optimal.withValues(alpha: 0.4),
              blurRadius: 18,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: FloatingActionButton(
          elevation: 0,
          backgroundColor: Colors.transparent,
          child: const Icon(Icons.qr_code_scanner, size: 30, color: Colors.white),
          onPressed: () {
            _showScanOptionsModal(context, ref, allItems);
          },
        ),
      ),

      // BOTTOM NAVIGATION BAR (TABS ELEGANTES EN 2 TAPS)
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentTab.clamp(0, screens.length - 1),
        onDestinationSelected: (index) {
          ref.read(currentTabProvider.notifier).setTab(index);
        },
        destinations: isAdmin
            ? [
                const NavigationDestination(
                  icon: Icon(Icons.insights_outlined),
                  selectedIcon: Icon(Icons.insights, color: AppColors.primaryLight),
                  label: 'Dashboard',
                ),
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
                const NavigationDestination(
                  icon: Icon(Icons.wine_bar_outlined),
                  selectedIcon: Icon(Icons.wine_bar, color: AppColors.wineAccent),
                  label: 'Cava',
                ),
              ]
            : [
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
                const NavigationDestination(
                  icon: Icon(Icons.wine_bar_outlined),
                  selectedIcon: Icon(Icons.wine_bar, color: AppColors.wineAccent),
                  label: 'Cava',
                ),
              ],
      ),
    );
  }

  void _showScanOptionsModal(BuildContext context, WidgetRef ref, List<InventoryItem> allItems) {
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
                    final scanResult = await CameraScannerDialog.show(context);
                    if (context.mounted && scanResult != null) {
                      if (scanResult.isBatch) {
                        _handleBatchScannedCodes(context, ref, scanResult.batchCodes);
                      } else if (scanResult.singleCode != null) {
                        _handleScannedCode(context, ref, allItems, scanResult.singleCode!, 'ON_DEVICE_CAMERA');
                      }
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
                    _startNfcScan(context, ref, allItems);
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

  void _handleScannedCode(
    BuildContext context,
    WidgetRef ref,
    List<InventoryItem> allItems,
    String code,
    String method,
  ) async {
    final parsed = DeepLinkQrService.parse(code);
    final clean = code.trim();
    final cleanUpper = clean.toUpperCase();

    final matched = allItems.where((i) {
      if (i.id == clean || i.id == parsed.extractedValue) return true;
      if (i.qrCode == clean || i.previousQrCodes.contains(clean)) return true;
      if (i.barcode == clean || i.barcode == parsed.extractedValue) return true;
      if (i.effectiveShortId.toUpperCase() == cleanUpper ||
          (i.shortId.isNotEmpty && i.shortId.toUpperCase() == cleanUpper) ||
          (parsed.isShortId && i.effectiveShortId.toUpperCase() == parsed.extractedValue)) {
        return true;
      }
      if (clean.contains(i.id)) return true;
      return false;
    }).toList();

    if (matched.isNotEmpty) {
      final item = matched.first;
      if (item.previousQrCodes.contains(clean)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('⚠️ Etiqueta anterior detectada (Reemplazada). Redirigiendo al producto actual...'),
            backgroundColor: Color(0xFFF59E0B),
            duration: Duration(seconds: 2),
          ),
        );
      }
      QuickScanBottomSheet.show(context, item: item, scanMethod: method);
      return;
    }

    // Si no está registrado en la casa actual, consultar catálogo global EAN-13/UPC ($0 Costo)
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Código "$code" no encontrado localmente. Buscando en catálogo global EAN...'),
        backgroundColor: AppColors.primary,
        duration: const Duration(seconds: 2),
      ),
    );

    final eanResult = await EanLookupService.lookupBarcode(code);
    if (!context.mounted) return;

    if (eanResult != null) {
      final currentHousehold = ref.read(selectedHouseholdProvider);
      showDialog(
        context: context,
        builder: (dialogCtx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.inventory_2, color: AppColors.optimal),
              SizedBox(width: 8),
              Text('Producto Reconocido'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                eanResult.name,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 4),
              Text(
                'Marca: ${eanResult.brand} • Presentación: ${eanResult.packageQuantity}',
                style: const TextStyle(color: Colors.grey, fontSize: 13),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.optimal.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Categoría sugerida: ${eanResult.category} • EAN: ${eanResult.barcode}',
                  style: const TextStyle(fontSize: 11, color: AppColors.optimal, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                '¿Deseas dar de alta este producto en tu inventario?',
                style: TextStyle(fontSize: 13),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogCtx),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
              ),
              onPressed: () {
                Navigator.pop(dialogCtx);
                final isWine = eanResult.category.toLowerCase().contains('vino') ||
                    eanResult.name.toLowerCase().contains('vino');
                final newItem = InventoryItem(
                  id: const Uuid().v4(),
                  householdId: currentHousehold.id,
                  zoneId: isWine ? 'cava' : 'alacena-1',
                  zoneName: isWine ? 'Cava Subterránea' : 'Alacena Principal',
                  name: '${eanResult.name} (${eanResult.brand})',
                  category: eanResult.category,
                  barcode: eanResult.barcode,
                  qrCode: 'ALACENA:${currentHousehold.id}:${isWine ? "cava" : "alacena-1"}:${eanResult.barcode}',
                  currentQuantity: 1,
                  idealQuantity: 4,
                  minAlertQuantity: 1,
                  unit: eanResult.packageQuantity,
                  unitPrice: eanResult.estimatedPrice,
                  isHighValue: isWine || eanResult.estimatedPrice > 1000,
                  updatedAt: DateTime.now(),
                );
                ref.read(inventoryListProvider.notifier).addItem(newItem);
                QuickScanBottomSheet.show(context, item: newItem, scanMethod: method);
              },
              child: const Text('Dar de Alta'),
            ),
          ],
        ),
      );
    } else {
      // Flujo Express EAN: El usuario NO se bloquea al descargar compras
      final currentHousehold = ref.read(selectedHouseholdProvider);
      final cleanCode = code.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '');
      final shortSuffix = cleanCode.length > 4 ? cleanCode.substring(cleanCode.length - 4) : cleanCode;
      final expressItem = InventoryItem(
        id: const Uuid().v4(),
        shortId: 'EXP-$shortSuffix',
        householdId: currentHousehold.id,
        zoneId: 'alacena-1',
        zoneName: 'Alacena Principal',
        name: 'Producto EAN-$cleanCode (Pendiente)',
        category: 'Abarrotes',
        barcode: cleanCode,
        qrCode: 'ALACENA:${currentHousehold.id}:alacena-1:$cleanCode',
        currentQuantity: 1,
        idealQuantity: 2,
        minAlertQuantity: 1,
        unit: 'pza',
        unitPrice: 0.0,
        requiresMetadataUpdate: true,
        updatedAt: DateTime.now(),
      );

      ref.read(inventoryListProvider.notifier).addItem(expressItem);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('⚡ Flujo Express: Se dio de alta EAN $cleanCode sin detener el ingreso físico.'),
          backgroundColor: const Color(0xFFF59E0B),
          duration: const Duration(seconds: 3),
        ),
      );

      QuickScanBottomSheet.show(context, item: expressItem, scanMethod: method);
    }
  }

  void _handleBatchScannedCodes(BuildContext context, WidgetRef ref, List<String> batchCodes) {
    if (batchCodes.isEmpty) return;
    final processed = ref.read(inventoryListProvider.notifier).batchAdjustStock(
      batchCodes,
      delta: 1,
      scanMethod: 'BATCH_RAPID_SCAN',
    );
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('📦 Lote Procesado: $processed de ${batchCodes.length} artículos sumados al stock.'),
        backgroundColor: AppColors.optimal,
        duration: const Duration(seconds: 4),
      ),
    );
  }

  void _startNfcScan(BuildContext context, WidgetRef ref, List<InventoryItem> allItems) {
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
        _handleScannedCode(context, ref, allItems, payload ?? tagId, 'NFC');
      },
      onError: (err) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Aviso NFC: $err. Abriendo simulación de tag...'),
            backgroundColor: AppColors.low,
          ),
        );
        _handleScannedCode(context, ref, allItems, '04:5A:2F:B2:89:12:80', 'NFC');
      },
    );
  }
}
