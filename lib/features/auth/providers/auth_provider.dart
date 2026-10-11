import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_role.dart';

class AuthNotifier extends Notifier<AppUser?> {
  @override
  AppUser? build() {
    // Inicialmente no autenticado para forzar el Muro de Autenticación
    return null;
  }

  void signInAsAdmin({String email = 'admin@alacena.cobertores.com'}) {
    state = AppUser(
      uid: 'admin_paco_01',
      email: email,
      displayName: 'Paco Iglesias (Admin)',
      role: UserRole.admin,
      currentHouseholdId: 'casa-principal',
    );
  }

  void signInAsService({String email = 'servicio@alacena.cobertores.com'}) {
    state = AppUser(
      uid: 'service_staff_01',
      email: email,
      displayName: 'Personal de Cocina / Servicio',
      role: UserRole.service,
      currentHouseholdId: 'casa-principal',
    );
  }

  void signOut() {
    state = null;
  }

  void toggleRole() {
    if (state == null) return;
    final newRole = state!.role == UserRole.admin ? UserRole.service : UserRole.admin;
    state = state!.copyWith(
      role: newRole,
      displayName: newRole == UserRole.admin ? 'Paco Iglesias (Admin)' : 'Personal de Servicio',
    );
  }

  void setHousehold(String householdId) {
    if (state == null) return;
    state = state!.copyWith(currentHouseholdId: householdId);
  }
}

final authProvider = NotifierProvider<AuthNotifier, AppUser?>(() {
  return AuthNotifier();
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider) != null;
});

final isUserAdminProvider = Provider<bool>((ref) {
  final user = ref.watch(authProvider);
  return user?.role.isAdmin ?? false;
});
