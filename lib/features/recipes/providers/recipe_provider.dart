import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../models/recipe_model.dart';
import '../../inventory/providers/inventory_provider.dart';
import '../../inventory/models/inventory_item_model.dart';
import '../../audit_trail/providers/audit_trail_provider.dart';
import '../../audit_trail/models/audit_log_model.dart';
import '../../shopping_list/providers/shopping_list_provider.dart';
import '../../shopping_list/models/shopping_item_model.dart';
import '../../households/providers/household_provider.dart';

class RecipesNotifier extends Notifier<List<Recipe>> {
  @override
  List<Recipe> build() {
    return [
      Recipe(
        id: 'rec_01',
        householdId: 'casa-principal',
        name: 'Pastel Gourmet de Vainilla & Frutos Rojos',
        description: 'Receta tradicional para eventos y postres de la casa. Requiere harina de alta fuerza y mantequilla pura.',
        category: 'Repostería & Postres',
        servings: 12,
        prepTimeMinutes: 50,
        authorName: 'Chef de la Casa',
        createdAt: DateTime.now().subtract(const Duration(days: 3)),
        ingredients: const [
          RecipeIngredient(
            id: 'ing_01',
            name: 'Harina de Trigo San Antonio Extra Fina',
            requiredQuantity: 5.0, // 5 kilos como en el requerimiento del usuario
            unit: 'kg',
            matchedItemId: 'pantry_harina_01',
            estimatedUnitPrice: 38.00,
          ),
          RecipeIngredient(
            id: 'ing_02',
            name: 'Azúcar Refinada Mascabado',
            requiredQuantity: 2.0,
            unit: 'kg',
            matchedItemId: 'pantry_azucar_02',
            estimatedUnitPrice: 42.00,
          ),
          RecipeIngredient(
            id: 'ing_03',
            name: 'Mantequilla Francesa Sin Sal President',
            requiredQuantity: 4.0,
            unit: 'barra 250g',
            matchedItemId: 'fridge_mantequilla_03',
            estimatedUnitPrice: 95.00,
          ),
          RecipeIngredient(
            id: 'ing_04',
            name: 'Huevos Orgánicos de Libre Pastoreo',
            requiredQuantity: 12.0,
            unit: 'piezas',
            matchedItemId: 'fridge_huevos_04',
            estimatedUnitPrice: 5.50,
          ),
        ],
        instructions: const [
          'Tamizar los 5 kg de harina con el polvo para hornear.',
          'Batir la mantequilla pomada con el azúcar mascabado hasta punto de nieve.',
          'Incorporar los huevos uno a uno y hornear a 180°C durante 45 minutos.',
        ],
      ),
      Recipe(
        id: 'rec_02',
        householdId: 'casa-principal',
        name: 'Risotto al Tartufo & Parmigiano Reggiano',
        description: 'Plato italiano de autor utilizando el queso Parmigiano 24 meses y aceite virgen extra de la despensa.',
        category: 'Plato Fuerte',
        servings: 6,
        prepTimeMinutes: 35,
        authorName: 'Chef Carlos',
        createdAt: DateTime.now().subtract(const Duration(days: 2)),
        ingredients: const [
          RecipeIngredient(
            id: 'ing_05',
            name: 'Arroz Carnaroli / Arborio',
            requiredQuantity: 1.0,
            unit: 'kg',
            estimatedUnitPrice: 140.00,
          ),
          RecipeIngredient(
            id: 'ing_06',
            name: 'Queso Parmigiano Reggiano 24 Meses DOP',
            requiredQuantity: 1.0,
            unit: 'cuña 1kg',
            matchedItemId: 'item_03',
            estimatedUnitPrice: 950.00,
          ),
          RecipeIngredient(
            id: 'ing_07',
            name: 'Aceite de Oliva Virgen Extra Oro Bailén 500ml',
            requiredQuantity: 1.0,
            unit: 'botella 500ml',
            matchedItemId: 'item_02',
            estimatedUnitPrice: 520.00,
          ),
        ],
        instructions: const [
          'Nacarar el arroz en el aceite de oliva a fuego medio.',
          'Añadir caldo hirviendo poco a poco mientras se remueve continuamente.',
          'Mantecar fuera del fuego con el queso Parmigiano rallado finamente.',
        ],
      ),
      Recipe(
        id: 'rec_03',
        householdId: 'casa-principal',
        name: 'Degustación Ibérica & Copa de Vega Sicilia',
        description: 'Servicio de coctelería y botana fina para recibir visitas distinguidas.',
        category: 'Cava & Aperitivos',
        servings: 4,
        prepTimeMinutes: 10,
        authorName: 'Mayordomo / Sommelier',
        createdAt: DateTime.now().subtract(const Duration(days: 1)),
        ingredients: const [
          RecipeIngredient(
            id: 'ing_08',
            name: 'Jamón Ibérico 100% Bellota 5 Jotas',
            requiredQuantity: 2.0,
            unit: 'sobre 80g',
            matchedItemId: 'fridge_jamon_02',
            estimatedUnitPrice: 580.00,
          ),
          RecipeIngredient(
            id: 'ing_09',
            name: 'Vino Vega Sicilia Único 2010',
            requiredQuantity: 1.0,
            unit: 'botella 750ml',
            matchedItemId: 'item_01',
            estimatedUnitPrice: 11800.00,
          ),
        ],
        instructions: const [
          'Decantar el Vega Sicilia a 17°C al menos 45 minutos antes.',
          'Templar los sobres de jamón ibérico bajo agua tibia antes de emplatar.',
        ],
      ),
    ];
  }

  void addRecipe(Recipe recipe) {
    state = [recipe, ...state];
  }

  void updateRecipe(Recipe updated) {
    state = [
      for (final r in state)
        if (r.id == updated.id) updated else r,
    ];
  }

  void deleteRecipe(String recipeId) {
    state = state.where((r) => r.id != recipeId).toList();
  }

  /// Ejecutar preparación de la receta:
  /// 1. Descuenta automáticamente cada ingrediente de la alacena.
  /// 2. Deja asentado con huella forense INALTERABLE quién lo usó (ej. "María (Muchacha / Servicio)", "Chef Carlos").
  /// 3. Asienta cantidades exactas y costo total en MXN ($).
  bool cookRecipe({
    required Recipe recipe,
    required String executedByName,
    required String executedByEmail,
    required String executedByRole,
    required String householdId,
  }) {
    final inventory = ref.read(inventoryListProvider);
    final auditTrail = ref.read(auditTrailProvider.notifier);
    final now = DateTime.now();

    for (final ing in recipe.ingredients) {
      // Buscar el producto en la alacena
      InventoryItem? matched;
      if (ing.matchedItemId != null) {
        matched = inventory.cast<InventoryItem?>().firstWhere(
              (item) => item?.id == ing.matchedItemId,
              orElse: () => null,
            );
      }

      if (matched == null) {
        final query = ing.name.toLowerCase().trim();
        matched = inventory.cast<InventoryItem?>().firstWhere(
              (item) => item != null && item.name.toLowerCase().contains(query),
              orElse: () => null,
            );
      }

      final qtyToDeduct = ing.requiredQuantity.ceil();

      if (matched != null) {
        // Descontar del inventario
        ref.read(inventoryListProvider.notifier).adjustStock(
              matched.id,
              -qtyToDeduct,
              scanMethod: 'RECETA_COCINA',
            );

        // Registrar explícitamente en el log forense con el nombre del responsable
        auditTrail.addLog(
          AuditLog(
            id: const Uuid().v4(),
            householdId: householdId,
            itemId: matched.id,
            itemName: '${matched.name} [Receta: ${recipe.name}]',
            userId: executedByEmail,
            userEmail: '$executedByName ($executedByRole)',
            userRole: executedByRole,
            action: 'RECIPE_CONSUME',
            previousQuantity: matched.currentQuantity,
            newQuantity: (matched.currentQuantity - qtyToDeduct).clamp(0, 99999),
            quantityDelta: -qtyToDeduct,
            unitPriceAtMoment: matched.unitPrice,
            economicValueDelta: -(qtyToDeduct * matched.unitPrice),
            currency: 'MXN',
            scanMethod: 'RECETA: ${recipe.name}',
            timestamp: now,
          ),
        );
      } else {
        // Si no está registrado en inventario, dejar constancia en el log forense
        auditTrail.addLog(
          AuditLog(
            id: const Uuid().v4(),
            householdId: householdId,
            itemId: ing.id,
            itemName: '${ing.name} (${ing.requiredQuantity} ${ing.unit}) [Receta: ${recipe.name}]',
            userId: executedByEmail,
            userEmail: '$executedByName ($executedByRole)',
            userRole: executedByRole,
            action: 'RECIPE_CONSUME_DIRECT',
            previousQuantity: 0,
            newQuantity: 0,
            quantityDelta: -qtyToDeduct,
            unitPriceAtMoment: ing.estimatedUnitPrice,
            economicValueDelta: -(qtyToDeduct * ing.estimatedUnitPrice),
            currency: 'MXN',
            scanMethod: 'RECETA_COCINA',
            timestamp: now,
          ),
        );
      }
    }

    return true;
  }

  /// Envía los ingredientes faltantes directo a la Lista de Compras en 1 Tap
  int sendMissingToShoppingList({
    required Recipe recipe,
    required String householdId,
  }) {
    final inventory = ref.read(inventoryListProvider);
    final report = recipe.evaluateAvailability(inventory);
    final shoppingNotifier = ref.read(shoppingListProvider.notifier);

    int countAdded = 0;
    for (final missing in report.missingIngredients) {
      final shoppingItem = ShoppingItem(
        id: const Uuid().v4(),
        householdId: householdId,
        itemId: missing.matchedItem?.id,
        name: missing.ingredient.name,
        category: missing.matchedItem?.category ?? 'Ingredientes de Cocina',
        neededQuantity: missing.missingQuantity.ceil(),
        unit: missing.ingredient.unit,
        estimatedPrice: missing.estimatedMissingCost,
        isPurchased: false,
        source: 'RECETA_FALTANTE: ${recipe.name}',
        createdAt: DateTime.now(),
      );

      shoppingNotifier.addItem(shoppingItem);
      countAdded++;
    }

    return countAdded;
  }
}

final recipesProvider = NotifierProvider<RecipesNotifier, List<Recipe>>(() {
  return RecipesNotifier();
});

final filteredRecipesProvider = Provider<List<Recipe>>((ref) {
  final recipes = ref.watch(recipesProvider);
  final household = ref.watch(selectedHouseholdProvider);
  return recipes.where((r) => r.householdId == household.id).toList();
});
