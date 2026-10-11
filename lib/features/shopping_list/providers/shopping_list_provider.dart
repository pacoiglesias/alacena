import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/shopping_item_model.dart';
import '../../inventory/providers/inventory_provider.dart';
import '../../households/providers/household_provider.dart';
import '../../auth/providers/auth_provider.dart';

class ShoppingListNotifier extends Notifier<List<ShoppingItem>> {
  @override
  List<ShoppingItem> build() {
    return [
      ShoppingItem(
        id: 'shop_01',
        householdId: 'casa-principal',
        itemId: 'pantry_cafe_06',
        name: 'Café de Grano Geisha Chiapas Especialidad',
        category: 'Café & Té',
        neededQuantity: 3,
        unit: 'bolsa 500g',
        estimatedPrice: 650.00,
        isPurchased: false,
        source: 'AI_PREDICTIVE',
        cheapestVendor: 'Amazon México',
        cheapestPrice: 580.00,
        potentialSavings: 210.00,
        webOffers: const [
          WebPriceOffer(vendor: 'Amazon México', price: 580.00, url: 'https://amazon.com.mx'),
          WebPriceOffer(vendor: 'City Market', price: 650.00),
          WebPriceOffer(vendor: 'Mercado Libre', price: 620.00),
        ],
        createdAt: DateTime.now().subtract(const Duration(days: 1)),
      ),
      ShoppingItem(
        id: 'shop_02',
        householdId: 'casa-principal',
        itemId: 'fridge_queso_01',
        name: 'Queso Parmigiano Reggiano 24 Meses DOP',
        category: 'Lácteos & Quesos',
        neededQuantity: 2,
        unit: 'cuña 1kg',
        estimatedPrice: 950.00,
        isPurchased: false,
        source: 'LOW_STOCK_RULE',
        cheapestVendor: 'Costco Wholesale',
        cheapestPrice: 820.00,
        potentialSavings: 260.00,
        webOffers: const [
          WebPriceOffer(vendor: 'Costco Wholesale', price: 820.00),
          WebPriceOffer(vendor: 'City Market', price: 950.00),
        ],
        createdAt: DateTime.now().subtract(const Duration(hours: 5)),
      ),
      ShoppingItem(
        id: 'shop_03',
        householdId: 'casa-principal',
        itemId: 'fridge_jamon_02',
        name: 'Jamón Ibérico 100% Bellota 5 Jotas',
        category: 'Charcutería Fina',
        neededQuantity: 3,
        unit: 'sobre 80g',
        estimatedPrice: 580.00,
        isPurchased: false,
        source: 'AI_VISION_DETECT',
        cheapestVendor: 'La Europea',
        cheapestPrice: 540.00,
        potentialSavings: 120.00,
        createdAt: DateTime.now().subtract(const Duration(hours: 2)),
      ),
    ];
  }

  /// Colaboración en Vivo: Bloquear/Desbloquear "En el Carrito" físico en tienda
  void toggleInCart(String id) {
    final user = ref.read(authProvider);
    final index = state.indexWhere((i) => i.id == id);
    if (index == -1) return;

    final item = state[index];
    final willBeInCart = item.cheapestVendor == null ? true : (item.cheapestVendor != 'IN_CART');

    state = [
      for (int i = 0; i < state.length; i++)
        if (i == index)
          item.copyWith(
            cheapestVendor: willBeInCart ? 'IN_CART:${user?.displayName ?? "Familiar"}' : null,
          )
        else
          state[i],
    ];
  }

  /// Al marcar (✓) comprado, se mueve automáticamente al inventario correspondiente
  void togglePurchased(String id) {
    final index = state.indexWhere((i) => i.id == id);
    if (index == -1) return;

    final item = state[index];
    final willBePurchased = !item.isPurchased;

    state = [
      for (int i = 0; i < state.length; i++)
        if (i == index) item.copyWith(isPurchased: willBePurchased) else state[i],
    ];

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
