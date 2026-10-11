import 'package:flutter/material.dart';

/// Paleta de colores empresarial para ALACENA
/// Basada en código semafórico glanceable y soporte Dark / Light mode de alto contraste.
class AppColors {
  // --- Codigo Semaforico de Inventario ---
  static const Color optimal = Color(0xFF10B981);       // Verde Esmeralda (Optimo)
  static const Color low = Color(0xFFF59E0B);           // Ambar Calido (Bajo)
  static const Color outOfStock = Color(0xFFEF4444);     // Rojo Coral Intenso (Agotado)

  // --- Acentos de Marca (Cava de Vinos & Alacena Premium) ---
  static const Color primary = Color(0xFF1E3A8A);        // Azul Marino Profundo
  static const Color primaryLight = Color(0xFF3B82F6);
  static const Color wineAccent = Color(0xFF881337);     // Borgoña / Cava de vinos
  static const Color goldAccent = Color(0xFFD97706);     // Dorado Barrica

  // --- Modo Oscuro (Dark Theme) ---
  static const Color darkBg = Color(0xFF0B1120);          // Fondo profundo
  static const Color darkSurface = Color(0xFF1E293B);     // Tarjetas y modales
  static const Color darkSurfaceVariant = Color(0xFF334155);
  static const Color darkTextPrimary = Color(0xFFF8FAFC);
  static const Color darkTextSecondary = Color(0xFF94A3B8);
  static const Color darkBorder = Color(0xFF334155);

  // --- Modo Claro (Light Theme) ---
  static const Color lightBg = Color(0xFFF8FAFC);
  static const Color lightSurface = Colors.white;
  static const Color lightSurfaceVariant = Color(0xFFF1F5F9);
  static const Color lightTextPrimary = Color(0xFF0F172A);
  static const Color lightTextSecondary = Color(0xFF64748B);
  static const Color lightBorder = Color(0xFFE2E8F0);

  // Helper semaforico
  static Color getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'OPTIMAL':
        return optimal;
      case 'LOW':
        return low;
      case 'OUT_OF_STOCK':
      default:
        return outOfStock;
    }
  }

  static String getStatusLabel(String status) {
    switch (status.toUpperCase()) {
      case 'OPTIMAL':
        return 'Óptimo';
      case 'LOW':
        return 'Stock Bajo';
      case 'OUT_OF_STOCK':
      default:
        return 'Agotado';
    }
  }
}
