import 'package:uuid/uuid.dart';
import '../../inventory/models/inventory_item_model.dart';

/// Ingrediente individual de una receta con vinculación a la alacena
class RecipeIngredient {
  final String id;
  final String name;
  final double requiredQuantity;
  final String unit; // 'kg', 'g', 'l', 'ml', 'pza', 'lata', etc.
  final String? matchedItemId; // Enlace al item de inventario en Firestore
  final double estimatedUnitPrice; // En MXN

  const RecipeIngredient({
    required this.id,
    required this.name,
    required this.requiredQuantity,
    required this.unit,
    this.matchedItemId,
    this.estimatedUnitPrice = 0.0,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'requiredQuantity': requiredQuantity,
      'unit': unit,
      'matchedItemId': matchedItemId,
      'estimatedUnitPrice': estimatedUnitPrice,
    };
  }

  factory RecipeIngredient.fromMap(Map<String, dynamic> map) {
    return RecipeIngredient(
      id: map['id'] ?? const Uuid().v4(),
      name: map['name'] ?? '',
      requiredQuantity: (map['requiredQuantity'] as num?)?.toDouble() ?? 1.0,
      unit: map['unit'] ?? 'pza',
      matchedItemId: map['matchedItemId'],
      estimatedUnitPrice: (map['estimatedUnitPrice'] as num?)?.toDouble() ?? 0.0,
    );
  }

  RecipeIngredient copyWith({
    String? id,
    String? name,
    double? requiredQuantity,
    String? unit,
    String? matchedItemId,
    double? estimatedUnitPrice,
  }) {
    return RecipeIngredient(
      id: id ?? this.id,
      name: name ?? this.name,
      requiredQuantity: requiredQuantity ?? this.requiredQuantity,
      unit: unit ?? this.unit,
      matchedItemId: matchedItemId ?? this.matchedItemId,
      estimatedUnitPrice: estimatedUnitPrice ?? this.estimatedUnitPrice,
    );
  }
}

/// Modelo de Receta para Control de Cocina Comercial y Doméstica de Alto Nivel
class Recipe {
  final String id;
  final String householdId;
  final String name;
  final String description;
  final String category; // 'Repostería', 'Plato Fuerte', 'Desayuno', 'Cava / Coctelería'
  final int servings; // Porciones
  final int prepTimeMinutes;
  final String authorName; // 'Chef Carlos', 'María (Servicio)', 'Familia'
  final List<RecipeIngredient> ingredients;
  final List<String> instructions;
  final DateTime createdAt;

  const Recipe({
    required this.id,
    required this.householdId,
    required this.name,
    required this.description,
    required this.category,
    this.servings = 4,
    this.prepTimeMinutes = 30,
    this.authorName = 'Chef / Alacena',
    required this.ingredients,
    this.instructions = const [],
    required this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'householdId': householdId,
      'name': name,
      'description': description,
      'category': category,
      'servings': servings,
      'prepTimeMinutes': prepTimeMinutes,
      'authorName': authorName,
      'ingredients': ingredients.map((i) => i.toMap()).toList(),
      'instructions': instructions,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory Recipe.fromMap(Map<String, dynamic> map) {
    return Recipe(
      id: map['id'] ?? const Uuid().v4(),
      householdId: map['householdId'] ?? 'casa-principal',
      name: map['name'] ?? 'Receta Sin Nombre',
      description: map['description'] ?? '',
      category: map['category'] ?? 'Plato Fuerte',
      servings: (map['servings'] as num?)?.toInt() ?? 4,
      prepTimeMinutes: (map['prepTimeMinutes'] as num?)?.toInt() ?? 30,
      authorName: map['authorName'] ?? 'Chef / Alacena',
      ingredients: (map['ingredients'] as List<dynamic>?)
              ?.map((i) => RecipeIngredient.fromMap(i as Map<String, dynamic>))
              .toList() ??
          [],
      instructions: (map['instructions'] as List<dynamic>?)
              ?.map((i) => i.toString())
              .toList() ??
          [],
      createdAt: map['createdAt'] != null
          ? DateTime.parse(map['createdAt'])
          : DateTime.now(),
    );
  }

  Recipe copyWith({
    String? id,
    String? householdId,
    String? name,
    String? description,
    String? category,
    int? servings,
    int? prepTimeMinutes,
    String? authorName,
    List<RecipeIngredient>? ingredients,
    List<String>? instructions,
    DateTime? createdAt,
  }) {
    return Recipe(
      id: id ?? this.id,
      householdId: householdId ?? this.householdId,
      name: name ?? this.name,
      description: description ?? this.description,
      category: category ?? this.category,
      servings: servings ?? this.servings,
      prepTimeMinutes: prepTimeMinutes ?? this.prepTimeMinutes,
      authorName: authorName ?? this.authorName,
      ingredients: ingredients ?? this.ingredients,
      instructions: instructions ?? this.instructions,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  /// Evalúa la disponibilidad en tiempo real contra el inventario actual de la alacena
  RecipeStatusReport evaluateAvailability(List<InventoryItem> inventory) {
    final missing = <MissingIngredient>[];
    double totalCost = 0.0;
    int satisfiedCount = 0;

    for (final ing in ingredients) {
      // Buscar en el inventario por matchedItemId o por coincidencia de nombre
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

      final available = matched != null ? matched.currentQuantity.toDouble() : 0.0;
      final unitPrice = matched != null && matched.unitPrice > 0
          ? matched.unitPrice
          : (ing.estimatedUnitPrice > 0 ? ing.estimatedUnitPrice : 45.0);

      totalCost += ing.requiredQuantity * unitPrice;

      if (available >= ing.requiredQuantity) {
        satisfiedCount++;
      } else {
        final missingQty = ing.requiredQuantity - available;
        missing.add(
          MissingIngredient(
            ingredient: ing,
            availableQuantity: available,
            missingQuantity: missingQty,
            estimatedMissingCost: missingQty * unitPrice,
            matchedItem: matched,
          ),
        );
      }
    }

    final isFullyAvailable = missing.isEmpty && ingredients.isNotEmpty;
    final double percentage = ingredients.isEmpty
        ? 0.0
        : (satisfiedCount / ingredients.length) * 100.0;

    return RecipeStatusReport(
      recipe: this,
      isFullyAvailable: isFullyAvailable,
      availablePercentage: percentage,
      totalRecipeCost: totalCost,
      costPerServing: servings > 0 ? totalCost / servings : totalCost,
      missingIngredients: missing,
    );
  }
}

/// Ingrediente que falta en la alacena para preparar la receta
class MissingIngredient {
  final RecipeIngredient ingredient;
  final double availableQuantity;
  final double missingQuantity;
  final double estimatedMissingCost; // En MXN
  final InventoryItem? matchedItem;

  const MissingIngredient({
    required this.ingredient,
    required this.availableQuantity,
    required this.missingQuantity,
    required this.estimatedMissingCost,
    this.matchedItem,
  });
}

/// Reporte en tiempo real de factibilidad de preparación de la receta
class RecipeStatusReport {
  final Recipe recipe;
  final bool isFullyAvailable;
  final double availablePercentage;
  final double totalRecipeCost; // En MXN ($)
  final double costPerServing; // En MXN ($)
  final List<MissingIngredient> missingIngredients;

  const RecipeStatusReport({
    required this.recipe,
    required this.isFullyAvailable,
    required this.availablePercentage,
    required this.totalRecipeCost,
    required this.costPerServing,
    required this.missingIngredients,
  });
}
