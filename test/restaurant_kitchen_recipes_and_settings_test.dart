import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:alacena/features/recipes/providers/recipe_provider.dart';
import 'package:alacena/features/inventory/providers/inventory_provider.dart';
import 'package:alacena/features/audit_trail/providers/audit_trail_provider.dart';
import 'package:alacena/features/shopping_list/providers/shopping_list_provider.dart';
import 'package:alacena/features/households/providers/household_provider.dart';
import 'package:alacena/features/auth/models/user_member_model.dart';
import 'package:alacena/features/auth/providers/members_provider.dart';

void main() {
  group('Control Profesional de Cocina, Recetas y Asignación de Insumos', () {
    test('Verificación de Harina (5 kg) para receta y deducción con firma forense de personal', () {
      final containerRef = ProviderContainer();

      // 1. Verificar inventario inicial
      final inventory = containerRef.read(inventoryListProvider);
      expect(inventory, isNotEmpty);

      // 2. Obtener recetas cargadas
      final recipes = containerRef.read(recipesProvider);
      expect(recipes, isNotEmpty);

      final pastelReceta = recipes.firstWhere((r) => r.name.contains('Pastel'));
      expect(pastelReceta.ingredients, isNotEmpty);

      // Ingrediente de 5 kg de Harina
      final harinaIngrediente = pastelReceta.ingredients.firstWhere(
        (i) => i.name.contains('Harina'),
      );
      expect(harinaIngrediente.requiredQuantity, 5.0);

      // 3. Evaluar factibilidad y costo financiero en MXN
      final report = pastelReceta.evaluateAvailability(inventory);
      expect(report.totalRecipeCost, greaterThan(0.0));
      expect(report.costPerServing, greaterThan(0.0));

      // 4. Cocinar receta con asignación explícita a "María González (Personal de Servicio)"
      final cookSuccess = containerRef.read(recipesProvider.notifier).cookRecipe(
            recipe: pastelReceta,
            executedByName: 'María González',
            executedByEmail: 'maria@servicio.com',
            executedByRole: 'service',
            householdId: 'casa-principal',
          );

      expect(cookSuccess, isTrue);

      // 5. Verificar que el log forense de auditoría registró el consumo de los 5 kg con el nombre de María
      final auditLogs = containerRef.read(auditTrailProvider);
      expect(auditLogs, isNotEmpty);

      final recipeAuditLog = auditLogs.firstWhere(
        (l) => l.action == 'RECIPE_CONSUME' || l.action == 'RECIPE_CONSUME_DIRECT',
      );

      expect(recipeAuditLog.userEmail, contains('María González'));
      expect(recipeAuditLog.quantityDelta, lessThan(0));
      expect(recipeAuditLog.currency, 'MXN');

      // 6. Probar envío de faltantes a lista de compras
      final countMissingSent = containerRef.read(recipesProvider.notifier).sendMissingToShoppingList(
            recipe: pastelReceta,
            householdId: 'casa-principal',
          );
      expect(countMissingSent, greaterThanOrEqualTo(0));

      final shoppingItems = containerRef.read(shoppingListProvider);
      expect(shoppingItems, isNotEmpty);
    });

    test('Configuración Dinámica de Casas / Lugares y Zonas Físicas', () {
      final container = ProviderContainer();

      final initialHouses = container.read(householdsListProvider);
      expect(initialHouses.length, greaterThanOrEqualTo(2));

      // Agregar nueva residencia
      container.read(householdsListProvider.notifier).addHousehold(
            name: 'Rancho Los Encinos',
            address: 'Carretera Valle de Bravo Km 12',
          );

      final updatedHouses = container.read(householdsListProvider);
      expect(updatedHouses.any((h) => h.name == 'Rancho Los Encinos'), isTrue);

      final newHouse = updatedHouses.firstWhere((h) => h.name == 'Rancho Los Encinos');

      // Agregar zona física a la residencia
      container.read(householdsListProvider.notifier).addZone(
            householdId: newHouse.id,
            name: 'Cuarto Frío Carnes',
            type: 'FRIDGE',
            temperatureNotes: '0°C - 2°C',
          );

      final finalHouses = container.read(householdsListProvider);
      final finalHouse = finalHouses.firstWhere((h) => h.id == newHouse.id);
      expect(finalHouse.zones.any((z) => z.name == 'Cuarto Frío Carnes'), isTrue);
    });

    test('Gestión de Usuarios, Roles (RBAC) y Miembros del Hogar', () {
      final container = ProviderContainer();

      final initialMembers = container.read(membersProvider);
      expect(initialMembers, isNotEmpty);

      // Agregar a María (Personal de Servicio)
      container.read(membersProvider.notifier).addMember(
            displayName: 'María González',
            email: 'maria.servicio@alacena.mx',
            role: MemberRole.service,
            assignedHouseholdId: 'casa-principal',
          );

      final membersAfterAdd = container.read(membersProvider);
      expect(membersAfterAdd.any((m) => m.displayName == 'María González'), isTrue);

      final maria = membersAfterAdd.firstWhere((m) => m.displayName == 'María González');
      expect(maria.role, MemberRole.service);

      // Ascender o actualizar rol a Chef
      container.read(membersProvider.notifier).updateRole(maria.id, MemberRole.chef);

      final membersAfterUpdate = container.read(membersProvider);
      final mariaChef = membersAfterUpdate.firstWhere((m) => m.id == maria.id);
      expect(mariaChef.role, MemberRole.chef);
    });
  });
}
