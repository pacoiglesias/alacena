import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_role.dart';

class AuthNotifier extends Notifier<AppUser?> {
  @override
  AppUser? build() {
    // Usuario inicial de desarrollo (Admin por defecto)
    return const AppUser(
      uid: 'admin_demo_01',
      email: 'paco@cobertores.com',
      displayName: 'Paco Iglesias',
      role: UserRole.admin,
      currentHouseholdId: 'casa-principal',
    );
  }

  void toggleRole() {
    if (state == null) return;
    final newRole = state!.role == UserRole.admin ? UserRole.service : UserRole.admin;
    state = state!.copyWith(
      role: newRole,
      displayName: newRole == UserRole.admin ? 'Paco Iglesias' : 'Personal de Servicio',
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

final isUserAdminProvider = Provider<bool>((ref) {
  final user = ref.watch(authProvider);
  return user?.role.isAdmin ?? false;
});
