import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:uuid/uuid.dart';
import '../models/recipe_model.dart';
import '../providers/recipe_provider.dart';
import '../../inventory/providers/inventory_provider.dart';
import '../../households/providers/household_provider.dart';
import '../../auth/models/user_member_model.dart';
import '../../auth/providers/members_provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/tokens.dart';

class RecipesScreen extends ConsumerStatefulWidget {
  const RecipesScreen({super.key});

  @override
  ConsumerState<RecipesScreen> createState() => _RecipesScreenState();
}

class _RecipesScreenState extends ConsumerState<RecipesScreen> {
  String _selectedCategory = 'Todas';

  @override
  Widget build(BuildContext context) {
    final recipes = ref.watch(filteredRecipesProvider);
    final inventory = ref.watch(inventoryListProvider);
    final household = ref.watch(selectedHouseholdProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final width = MediaQuery.of(context).size.width;

    final categories = ['Todas', 'Repostería & Postres', 'Plato Fuerte', 'Cava & Aperitivos'];
    final displayedRecipes = _selectedCategory == 'Todas'
        ? recipes
        : recipes.where((r) => r.category == _selectedCategory).toList();

    // Métricas rápidas
    int readyCount = 0;
    int deficitCount = 0;
    for (final r in recipes) {
      final rep = r.evaluateAvailability(inventory);
      if (rep.isFullyAvailable) {
        readyCount++;
      } else {
        deficitCount++;
      }
    }

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: CustomScrollView(
        slivers: [
          // Header Profesional con KPIs y Botón Nueva Receta
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(AppTokens.s20, AppTokens.s16, AppTokens.s20, AppTokens.s12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: AppTokens.emeraldPrimary.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(Icons.restaurant_menu, color: AppTokens.emeraldLight, size: 22),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                'Recetas & Control de Cocina',
                                style: GoogleFonts.inter(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.5,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Control a nivel restaurante: costeo en MXN, verificación de alacena y consumo asignado a personal.',
                            style: TextStyle(
                              fontSize: 13,
                              color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary,
                            ),
                          ),
                        ],
                      ),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Nueva Receta'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTokens.emeraldPrimary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () => _showRecipeDialog(context, household.id),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Tarjetas de Métricas de Cocina
                  Row(
                    children: [
                      _buildMetricCard(
                        title: 'Total Recetas',
                        value: '${recipes.length}',
                        icon: Icons.menu_book,
                        color: Colors.blueAccent,
                        isDark: isDark,
                      ),
                      const SizedBox(width: 12),
                      _buildMetricCard(
                        title: 'Listas para Cocinar',
                        value: '$readyCount',
                        icon: Icons.check_circle_outline,
                        color: AppColors.optimal,
                        isDark: isDark,
                      ),
                      const SizedBox(width: 12),
                      _buildMetricCard(
                        title: 'Con Insumos Faltantes',
                        value: '$deficitCount',
                        icon: Icons.warning_amber_rounded,
                        color: AppColors.low,
                        isDark: isDark,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Barra de Filtro de Categorías
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: categories.map((cat) {
                        final isSel = _selectedCategory == cat;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: ChoiceChip(
                            label: Text(cat),
                            selected: isSel,
                            selectedColor: AppTokens.emeraldPrimary.withValues(alpha: 0.2),
                            labelStyle: TextStyle(
                              color: isSel ? AppTokens.emeraldLight : (isDark ? Colors.white70 : Colors.black87),
                              fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                              fontSize: 12,
                            ),
                            onSelected: (val) {
                              if (val) setState(() => _selectedCategory = cat);
                            },
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Contenedor de Recetas (Responsive Grid en Desktop o Lista en Móvil)
          if (displayedRecipes.isEmpty)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.restaurant_outlined, size: 64, color: isDark ? Colors.white24 : Colors.black26),
                    const SizedBox(height: 12),
                    const Text('No hay recetas en esta categoría', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    const Text('Presiona "+ Nueva Receta" para crear la primera.', style: TextStyle(fontSize: 13, color: Colors.grey)),
                  ],
                ),
              ),
            )
          else if (width >= 1024)
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 1.55,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final recipe = displayedRecipes[index];
                    return _RecipeCard(
                      recipe: recipe,
                      inventory: inventory,
                      householdId: household.id,
                      isDark: isDark,
                      onEdit: () => _showRecipeDialog(context, household.id, recipe: recipe),
                    );
                  },
                  childCount: displayedRecipes.length,
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final recipe = displayedRecipes[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16.0),
                      child: _RecipeCard(
                        recipe: recipe,
                        inventory: inventory,
                        householdId: household.id,
                        isDark: isDark,
                        onEdit: () => _showRecipeDialog(context, household.id, recipe: recipe),
                      ),
                    );
                  },
                  childCount: displayedRecipes.length,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required bool isDark,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? AppTokens.darkSurface : AppTokens.lightSurface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: isDark ? AppTokens.darkBorder : AppTokens.lightBorder),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showRecipeDialog(BuildContext context, String householdId, {Recipe? recipe}) {
    showDialog(
      context: context,
      builder: (ctx) => _RecipeEditorModal(householdId: householdId, existingRecipe: recipe),
    );
  }
}

/// Tarjeta de Receta con Costeo, Ingredientes y Botón "Cocinar / Descontar"
class _RecipeCard extends ConsumerWidget {
  final Recipe recipe;
  final List<dynamic> inventory;
  final String householdId;
  final bool isDark;
  final VoidCallback onEdit;

  const _RecipeCard({
    required this.recipe,
    required this.inventory,
    required this.householdId,
    required this.isDark,
    required this.onEdit,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final inventoryItems = ref.watch(inventoryListProvider);
    final report = recipe.evaluateAvailability(inventoryItems);

    final statusColor = report.isFullyAvailable
        ? AppColors.optimal
        : (report.availablePercentage > 40 ? AppColors.low : AppColors.outOfStock);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppTokens.darkSurface : AppTokens.lightSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppTokens.darkBorder : AppTokens.lightBorder,
          width: 1,
        ),
        boxShadow: isDark ? null : [AppTokens.shadowSm],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header de la Tarjeta: Título, Categoría y Opciones
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTokens.emeraldPrimary.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            recipe.category,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: AppTokens.emeraldLight,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '${recipe.servings} porciones • ${recipe.prepTimeMinutes} min',
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      recipe.name,
                      style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert, size: 20),
                onSelected: (val) {
                  if (val == 'edit') {
                    onEdit();
                  } else if (val == 'delete') {
                    ref.read(recipesProvider.notifier).deleteRecipe(recipe.id);
                  }
                },
                itemBuilder: (ctx) => [
                  const PopupMenuItem(value: 'edit', child: Text('Editar Receta')),
                  const PopupMenuItem(
                    value: 'delete',
                    child: Text('Eliminar', style: TextStyle(color: Colors.redAccent)),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 6),
          Text(
            recipe.description,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 12,
              color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary,
            ),
          ),
          const SizedBox(height: 12),

          // Indicador de Factibilidad & Costeo en MXN
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: statusColor.withValues(alpha: 0.2)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                      report.isFullyAvailable ? Icons.check_circle : Icons.error_outline,
                      color: statusColor,
                      size: 16,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      report.isFullyAvailable
                          ? '100% Disponible en Alacena'
                          : 'Faltan ${report.missingIngredients.length} ingredientes',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: statusColor,
                      ),
                    ),
                  ],
                ),
                Text(
                  'Costo: \$${report.totalRecipeCost.toStringAsFixed(0)} MXN (\$${report.costPerServing.toStringAsFixed(0)}/porc)',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Preview de Ingredientes
          Text(
            'Ingredientes requeridos:',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary,
            ),
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            runSpacing: 4,
            children: recipe.ingredients.map((ing) {
              final isMissing = report.missingIngredients.any((m) => m.ingredient.id == ing.id);
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isMissing
                      ? AppColors.outOfStock.withValues(alpha: 0.1)
                      : (isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05)),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isMissing ? AppColors.outOfStock.withValues(alpha: 0.3) : Colors.transparent,
                  ),
                ),
                child: Text(
                  '${ing.requiredQuantity % 1 == 0 ? ing.requiredQuantity.toInt() : ing.requiredQuantity} ${ing.unit} ${ing.name}',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: isMissing ? FontWeight.w600 : FontWeight.w400,
                    color: isMissing ? AppColors.outOfStock : (isDark ? Colors.white70 : Colors.black87),
                  ),
                ),
              );
            }).toList(),
          ),

          const Spacer(),

          // Botones de Acción: Enviar al Súper y Cocinar (Consumir Asignado)
          Row(
            children: [
              if (!report.isFullyAvailable) ...[
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTokens.emeraldLight,
                      side: const BorderSide(color: AppTokens.emeraldLight),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.shopping_cart_checkout, size: 16),
                    label: const Text('Comprar Faltantes', style: TextStyle(fontSize: 12)),
                    onPressed: () {
                      final added = ref.read(recipesProvider.notifier).sendMissingToShoppingList(
                            recipe: recipe,
                            householdId: householdId,
                          );
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('🛒 $added ingredientes faltantes enviados a Lista de Compras.'),
                          backgroundColor: AppColors.optimal,
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 8),
              ],
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: report.isFullyAvailable ? AppTokens.emeraldPrimary : const Color(0xFF334155),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: const Icon(Icons.soup_kitchen, size: 16),
                  label: Text(
                    report.isFullyAvailable ? 'Cocinar & Descontar' : 'Cocinar (Parcial)',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  onPressed: () => _showCookDialog(context, ref, recipe, householdId),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Diálogo Forense de Cocina: Permite seleccionar quién usó los insumos (la muchacha, el chef, etc.)
  void _showCookDialog(BuildContext context, WidgetRef ref, Recipe recipe, String householdId) {
    final members = ref.read(membersProvider);

    String selectedMemberName = members.first.displayName;
    String selectedMemberEmail = members.first.email;
    String selectedMemberRole = members.first.role.name;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (dialogContext, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
              title: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTokens.emeraldPrimary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.soup_kitchen, color: AppTokens.emeraldLight, size: 24),
                  ),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      'Asignar Consumo de Receta',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '¿Quién preparó "${recipe.name}"?',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Los insumos (ej. 5 kg de harina) se descontarán del inventario y quedará asentado en la bitácora forense de auditoría.',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  const SizedBox(height: 14),

                  // Selector de Personal
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.grey.withValues(alpha: 0.4)),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        isExpanded: true,
                        value: selectedMemberName,
                        items: members.map((m) {
                          return DropdownMenuItem<String>(
                            value: m.displayName,
                            child: Row(
                              children: [
                                Icon(m.role.icon, size: 16, color: m.role.badgeColor),
                                const SizedBox(width: 8),
                                Text('${m.displayName} (${m.role.label})', style: const TextStyle(fontSize: 13)),
                              ],
                            ),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            final found = members.firstWhere((m) => m.displayName == val);
                            setDialogState(() {
                              selectedMemberName = found.displayName;
                              selectedMemberEmail = found.email;
                              selectedMemberRole = found.role.name;
                            });
                          }
                        },
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.amber.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Insumos que se descontarán inmediatamente:',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.amber),
                        ),
                        const SizedBox(height: 4),
                        ...recipe.ingredients.map(
                          (i) => Text(
                            '• ${i.requiredQuantity} ${i.unit} de ${i.name}',
                            style: const TextStyle(fontSize: 11),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancelar'),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTokens.emeraldPrimary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: () {
                    ref.read(recipesProvider.notifier).cookRecipe(
                          recipe: recipe,
                          executedByName: selectedMemberName,
                          executedByEmail: selectedMemberEmail,
                          executedByRole: selectedMemberRole,
                          householdId: householdId,
                        );

                    Navigator.pop(ctx);

                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          '✅ Receta "${recipe.name}" cocinada. Insumos descontados y registrados a: $selectedMemberName',
                        ),
                        backgroundColor: AppColors.optimal,
                        duration: const Duration(seconds: 4),
                      ),
                    );
                  },
                  child: const Text('Confirmar & Descontar'),
                ),
              ],
            );
          },
        );
      },
    );
  }
}

/// Modal Editor de Recetas (Crear / Editar con Ingredientes)
class _RecipeEditorModal extends ConsumerStatefulWidget {
  final String householdId;
  final Recipe? existingRecipe;

  const _RecipeEditorModal({required this.householdId, this.existingRecipe});

  @override
  ConsumerState<_RecipeEditorModal> createState() => _RecipeEditorModalState();
}

class _RecipeEditorModalState extends ConsumerState<_RecipeEditorModal> {
  late TextEditingController _nameCtrl;
  late TextEditingController _descCtrl;
  late TextEditingController _servingsCtrl;
  late TextEditingController _prepTimeCtrl;
  String _category = 'Plato Fuerte';
  late List<RecipeIngredient> _ingredients;

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.existingRecipe?.name ?? '');
    _descCtrl = TextEditingController(text: widget.existingRecipe?.description ?? '');
    _servingsCtrl = TextEditingController(text: (widget.existingRecipe?.servings ?? 4).toString());
    _prepTimeCtrl = TextEditingController(text: (widget.existingRecipe?.prepTimeMinutes ?? 30).toString());
    _category = widget.existingRecipe?.category ?? 'Plato Fuerte';
    _ingredients = List.from(widget.existingRecipe?.ingredients ?? [
      const RecipeIngredient(
        id: 'new_1',
        name: 'Harina de Trigo Extra Fina',
        requiredQuantity: 1.0,
        unit: 'kg',
        estimatedUnitPrice: 35.0,
      ),
    ]);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    _servingsCtrl.dispose();
    _prepTimeCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 580, maxHeight: 680),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.existingRecipe == null ? 'Nueva Receta de Cocina' : 'Editar Receta',
                style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: ListView(
                  children: [
                    TextField(
                      controller: _nameCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Nombre del Platillo / Receta',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _descCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Descripción / Notas del Chef',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _servingsCtrl,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Porciones',
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextField(
                            controller: _prepTimeCtrl,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Minutos Preparación',
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _category,
                            decoration: const InputDecoration(
                              labelText: 'Categoría',
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                            items: const [
                              DropdownMenuItem(value: 'Plato Fuerte', child: Text('Plato Fuerte')),
                              DropdownMenuItem(value: 'Repostería & Postres', child: Text('Repostería')),
                              DropdownMenuItem(value: 'Cava & Aperitivos', child: Text('Cava/Bocadillos')),
                            ],
                            onChanged: (val) {
                              if (val != null) setState(() => _category = val);
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Ingredientes Requeridos:', style: TextStyle(fontWeight: FontWeight.bold)),
                        TextButton.icon(
                          icon: const Icon(Icons.add, size: 16),
                          label: const Text('Agregar Ingrediente'),
                          onPressed: () {
                            setState(() {
                              _ingredients.add(
                                RecipeIngredient(
                                  id: const Uuid().v4(),
                                  name: 'Nuevo Insumo',
                                  requiredQuantity: 1.0,
                                  unit: 'pza',
                                  estimatedUnitPrice: 50.0,
                                ),
                              );
                            });
                          },
                        ),
                      ],
                    ),
                    ..._ingredients.asMap().entries.map((entry) {
                      final idx = entry.key;
                      final ing = entry.value;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: Row(
                          children: [
                            Expanded(
                              flex: 3,
                              child: TextFormField(
                                initialValue: ing.name,
                                decoration: const InputDecoration(labelText: 'Ingrediente', isDense: true),
                                onChanged: (val) => _ingredients[idx] = ing.copyWith(name: val),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              flex: 1,
                              child: TextFormField(
                                initialValue: ing.requiredQuantity.toString(),
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(labelText: 'Cant.', isDense: true),
                                onChanged: (val) {
                                  final num = double.tryParse(val) ?? 1.0;
                                  _ingredients[idx] = ing.copyWith(requiredQuantity: num);
                                },
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              flex: 1,
                              child: TextFormField(
                                initialValue: ing.unit,
                                decoration: const InputDecoration(labelText: 'Unidad', isDense: true),
                                onChanged: (val) => _ingredients[idx] = ing.copyWith(unit: val),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                              onPressed: () {
                                setState(() => _ingredients.removeAt(idx));
                              },
                            ),
                          ],
                        ),
                      );
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancelar')),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTokens.emeraldPrimary,
                      foregroundColor: Colors.white,
                    ),
                    onPressed: () {
                      if (_nameCtrl.text.trim().isEmpty) return;

                      final recipe = Recipe(
                        id: widget.existingRecipe?.id ?? const Uuid().v4(),
                        householdId: widget.householdId,
                        name: _nameCtrl.text.trim(),
                        description: _descCtrl.text.trim(),
                        category: _category,
                        servings: int.tryParse(_servingsCtrl.text) ?? 4,
                        prepTimeMinutes: int.tryParse(_prepTimeCtrl.text) ?? 30,
                        authorName: 'Chef / Alacena',
                        ingredients: _ingredients,
                        createdAt: widget.existingRecipe?.createdAt ?? DateTime.now(),
                      );

                      if (widget.existingRecipe == null) {
                        ref.read(recipesProvider.notifier).addRecipe(recipe);
                      } else {
                        ref.read(recipesProvider.notifier).updateRecipe(recipe);
                      }

                      Navigator.pop(context);
                    },
                    child: const Text('Guardar Receta'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
