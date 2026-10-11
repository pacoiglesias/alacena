import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../models/user_member_model.dart';

class MembersNotifier extends Notifier<List<UserMember>> {
  @override
  List<UserMember> build() {
    final now = DateTime.now();
    return [
      UserMember(
        id: 'usr_admin_master',
        displayName: 'Paco Iglesias (Owner)',
        email: 'admin@alacena.cobertores.com',
        role: MemberRole.admin,
        assignedHouseholdId: 'casa-principal',
        createdAt: now.subtract(const Duration(days: 90)),
      ),
      UserMember(
        id: 'usr_service_01',
        displayName: 'María (Personal de Cocina)',
        email: 'servicio@alacena.cobertores.com',
        role: MemberRole.service,
        assignedHouseholdId: 'casa-principal',
        createdAt: now.subtract(const Duration(days: 60)),
      ),
      UserMember(
        id: 'usr_chef_02',
        displayName: 'Chef Antonio (Menús & Cava)',
        email: 'chef@alacena.cobertores.com',
        role: MemberRole.chef,
        assignedHouseholdId: 'casa-principal',
        createdAt: now.subtract(const Duration(days: 30)),
      ),
      UserMember(
        id: 'usr_family_03',
        displayName: 'Familia Iglesias (Residente)',
        email: 'familia@alacena.cobertores.com',
        role: MemberRole.family,
        assignedHouseholdId: 'casa-principal',
        createdAt: now.subtract(const Duration(days: 15)),
      ),
    ];
  }

  void addMember({
    required String displayName,
    required String email,
    required MemberRole role,
    required String assignedHouseholdId,
  }) {
    final newMember = UserMember(
      id: const Uuid().v4(),
      displayName: displayName,
      email: email,
      role: role,
      assignedHouseholdId: assignedHouseholdId,
      createdAt: DateTime.now(),
    );
    state = [...state, newMember];
  }

  void updateRole(String memberId, MemberRole newRole) {
    state = state.map((m) {
      if (m.id == memberId) {
        return m.copyWith(role: newRole);
      }
      return m;
    }).toList();
  }

  void removeMember(String memberId) {
    if (state.length <= 1) return; // Mínimo 1 administrador activo
    state = state.where((m) => m.id != memberId).toList();
  }
}

final membersProvider = NotifierProvider<MembersNotifier, List<UserMember>>(() {
  return MembersNotifier();
});
