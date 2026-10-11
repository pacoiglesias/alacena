import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/shopping_item_model.dart';
import '../../inventory/providers/inventory_provider.dart';
import '../../households/providers/household_provider.dart';

class ShoppingListNotifier extends Notifier<List<ShoppingItem>> {
  @override
  List<ShoppingItem> build() {
    return [
      ShoppingItem(
        id: 'shop_01',
        householdId: 'casa-principal',
        itemId: 'item_04',
        name: 'Café de Grano Geisha Especialidad',
        category: 'Café & Té',
        neededQuantity: 3,
        unit: 'bolsa 500g',
        estimatedPrice: 650.00,
        isPurchased: false,
        source: 'LOW_STOCK_RULE',
        createdAt: DateTime.now().subtract(const Duration(days: 1)),
      ),
      ShoppingItem(
        id: 'shop_02',
        householdId: 'casa-principal',
        itemId: 'item_03',
        name: 'Queso Parmigiano Reggiano 24 Meses',
        category: 'Lácteos & Quesos',
        neededQuantity: 2,
        unit: 'pieza 1kg',
        estimatedPrice: 950.00,
        isPurchased: false,
        source: 'AI_AUTO_DETECT',
        createdAt: DateTime.now().subtract(const Duration(hours: 5)),
      ),
    ];
  }

  /// Al marcar (✓) un producto comprado, se mueve automaticamente al inventario
  void togglePurchased(String id) {
    final index = state.indexWhere((i) => i.id == id);
    if (index == -1) return;

    final item = state[index];
    final willBePurchased = !item.isPurchased;

    state = [
      for (int i = 0; i < state.length; i++)
        if (i == index) item.copyWith(isPurchased: willBePurchased) else state[i],
    ];

    // Si se marco como comprado y esta vinculado a un item de inventario, reabastecer
    if (willBePurchased && item.itemId != null) {
      ref.read(inventoryListProvider.notifier).adjustStock(
        item.itemId!,
        item.neededQuantity,
        scanMethod: 'SHOPPING_LIST_CHECK',
      );
    }
  }

  void addItem(ShoppingItem newItem) {
    state = [...state, newItem];
  }
}

final shoppingListProvider = NotifierProvider<ShoppingListNotifier, List<ShoppingItem>>(() {
  return ShoppingListNotifier();
});

final filteredShoppingListProvider = Provider<List<ShoppingItem>>((ref) {
  final list = ref.watch(shoppingListProvider);
  final household = ref.watch(selectedHouseholdProvider);
  return list.where((item) => item.householdId == household.id).toList();
});
