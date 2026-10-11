import 'package:flutter/material.dart';

/// Sistema Centralizado de Tokens de Diseño (Estándar Linear / Stripe)
/// Escala matemática 4/8, jerarquía visual estricta y breakpoints adaptativos.
abstract class AppTokens {
  // ==========================================
  // PALETA CROMÁTICA PRINCIPAL
  // ==========================================
  // Obsidian Dark Theme
  static const Color darkBg = Color(0xFF0C0E12);
  static const Color darkSurface = Color(0xFF14171F);
  static const Color darkSurfaceVariant = Color(0xFF1C212D);
  static const Color darkBorder = Color(0xFF262C3D);
  static const Color darkBorderSubtle = Color(0xFF1E2330);
  static const Color darkTextPrimary = Color(0xFFF1F5F9);
  static const Color darkTextSecondary = Color(0xFF94A3B8);
  static const Color darkTextTertiary = Color(0xFF64748B);

  // Pure Light Theme
  static const Color lightBg = Color(0xFFF8FAFC);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightSurfaceVariant = Color(0xFFF1F5F9);
  static const Color lightBorder = Color(0xFFE2E8F0);
  static const Color lightBorderSubtle = Color(0xFFF1F5F9);
  static const Color lightTextPrimary = Color(0xFF0F172A);
  static const Color lightTextSecondary = Color(0xFF64748B);
  static const Color lightTextTertiary = Color(0xFF94A3B8);

  // Acentos de Identidad
  static const Color emeraldPrimary = Color(0xFF059669); // Primario Luxury
  static const Color emeraldLight = Color(0xFF10B981);   // Acento de contraste
  static const Color emeraldDark = Color(0xFF064E3B);
  static const Color wineAccent = Color(0xFF881337);     // Cava y Vinos
  static const Color goldAccent = Color(0xFFD97706);     // Premium & Aged
  static const Color blueAccent = Color(0xFF2563EB);     // Operativo

  // Semáforo de Existencias y Auditoría
  static const Color statusOptimal = Color(0xFF10B981);
  static const Color statusLow = Color(0xFFF59E0B);
  static const Color statusOutOfStock = Color(0xFFEF4444);
  static const Color statusInTransit = Color(0xFF3B82F6);
  static const Color statusDiscontinued = Color(0xFF6B7280);

  // ==========================================
  // ESCALA DE ESPACIADO (Base 4/8)
  // ==========================================
  static const double s2 = 2.0;
  static const double s4 = 4.0;
  static const double s6 = 6.0;
  static const double s8 = 8.0;
  static const double s10 = 10.0;
  static const double s12 = 12.0;
  static const double s16 = 16.0;
  static const double s20 = 20.0;
  static const double s24 = 24.0;
  static const double s32 = 32.0;
  static const double s40 = 40.0;
  static const double s48 = 48.0;
  static const double s64 = 64.0;

  // ==========================================
  // RADIOS DE CURVATURA
  // ==========================================
  static const double r4 = 4.0;
  static const double r8 = 8.0;
  static const double r10 = 10.0;
  static const double r12 = 12.0;
  static const double r16 = 16.0;
  static const double r20 = 20.0;
  static const double r24 = 24.0;
  static const double rFull = 999.0;

  static const BoxShadow shadowSm = BoxShadow(
    color: Color(0x0F000000),
    blurRadius: 4,
    offset: Offset(0, 1),
  );

  // ==========================================
  // BREAKPOINTS RESPONSIVE (M3 / Tailwind)
  // ==========================================
  static const double bpMobile = 600.0;   // < 600: Smartphone
  static const double bpTablet = 904.0;   // 600 - 904: Tablet / Foldable
  static const double bpDesktop = 1240.0; // 905 - 1239: Laptop / Master-Detail
  static const double bpWide = 1440.0;    // >= 1240: Desktop / Data Table

  // ==========================================
  // DURACIONES DE ANIMACIÓN
  // ==========================================
  static const Duration animFast = Duration(milliseconds: 150);
  static const Duration animStandard = Duration(milliseconds: 250);
  static const Duration animSmooth = Duration(milliseconds: 350);

  // ==========================================
  // SOMBRAS JERÁRQUICAS (3 Niveles Estrictos)
  // ==========================================
  static List<BoxShadow> shadowLow(bool isDark) => [
        BoxShadow(
          color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
          blurRadius: 4,
          offset: const Offset(0, 1),
        ),
      ];

  static List<BoxShadow> shadowMed(bool isDark) => [
        BoxShadow(
          color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.06),
          blurRadius: 12,
          offset: const Offset(0, 4),
        ),
      ];

  static List<BoxShadow> shadowHigh(bool isDark) => [
        BoxShadow(
          color: Colors.black.withValues(alpha: isDark ? 0.45 : 0.10),
          blurRadius: 24,
          offset: const Offset(0, 8),
        ),
      ];
}
