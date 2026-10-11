import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../features/households/providers/household_provider.dart';
import '../../features/households/presentation/quick_zone_dialogs.dart';
import '../theme/tokens.dart';

/// Selector Pill Elegante y Minimalista para el AppBar
/// Muestra la casa activa y al pulsar abre el gestor de residencias.
class HouseholdSelectorHeader extends ConsumerWidget {
  const HouseholdSelectorHeader({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedHousehold = ref.watch(selectedHouseholdProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () => ManageHouseholdsModal.show(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isDark ? AppTokens.darkSurface : AppTokens.lightSurface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? AppTokens.darkBorder : AppTokens.lightBorder,
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: AppTokens.emeraldPrimary.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.location_on,
                size: 15,
                color: AppTokens.emeraldLight,
              ),
            ),
            const SizedBox(width: 8),
            Flexible(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'CASA ACTIVA',
                    style: TextStyle(
                      fontSize: 8.5,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.8,
                      color: isDark ? AppTokens.darkTextTertiary : AppTokens.lightTextTertiary,
                    ),
                  ),
                  Text(
                    selectedHousehold.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: isDark ? AppTokens.darkTextPrimary : AppTokens.lightTextPrimary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 6),
            Icon(
              Icons.keyboard_arrow_down,
              size: 18,
              color: isDark ? AppTokens.darkTextSecondary : AppTokens.lightTextSecondary,
            ),
          ],
        ),
      ),
    );
  }
}
