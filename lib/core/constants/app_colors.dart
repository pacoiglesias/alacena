import 'package:flutter/material.dart';

/// Paleta de colores minimalista de lujo (Estilo Apple / Stripe)
/// Deep Dark Mode (#121212), Light Mode inmaculado y Acento Esmeralda Lujoso.
class AppColors {
  // --- Acento Primario de Lujo (Verde Esmeralda Profundo & Azul Imperial) ---
  static const Color primary = Color(0xFF065F46);          // Verde Esmeralda Lujoso
  static const Color primaryLight = Color(0xFF10B981);     // Esmeralda Vibrante
  static const Color oceanAccent = Color(0xFF0F172A);      // Azul Marino Imperial
  static const Color wineAccent = Color(0xFF7F1D1D);       // Borgoña Cava Reserva
  static const Color goldAccent = Color(0xFFB45309);       // Oro Añejo

  // --- Indicadores Semafóricos de Inventario ---
  static const Color optimal = Color(0xFF10B981);          // Verde Óptimo
  static const Color low = Color(0xFFF59E0B);              // Ámbar Advertencia
  static const Color outOfStock = Color(0xFFEF4444);        // Rojo Coral Alerta

  // --- Deep Dark Mode (#121212 Apple/Stripe) ---
  static const Color darkBg = Color(0xFF121212);           // Fondo OLED absoluto
  static const Color darkSurface = Color(0xFF1E1E1E);      // Superficie de tarjetas
  static const Color darkSurfaceVariant = Color(0xFF262626);
  static const Color darkTextPrimary = Color(0xFFF9FAFB);  // Blanco limpio
  static const Color darkTextSecondary = Color(0xFFA1A1AA);// Gris neutro suave
  static const Color darkBorder = Color(0xFF2E2E32);       // Borde sutil

  // --- Inmaculate Light Mode ---
  static const Color lightBg = Color(0xFFFAFAFA);          // Fondo casi blanco puro
  static const Color lightSurface = Colors.white;
  static const Color lightSurfaceVariant = Color(0xFFF4F4F5);
  static const Color lightTextPrimary = Color(0xFF18181B);  // Casi negro refinado
  static const Color lightTextSecondary = Color(0xFF71717A);
  static const Color lightBorder = Color(0xFFE4E4E7);      // Borde de retina

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
