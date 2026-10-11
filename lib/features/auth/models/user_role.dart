enum UserRole {
  admin,
  service;

  bool get isAdmin => this == UserRole.admin;
  bool get isService => this == UserRole.service;

  String get label => this == UserRole.admin ? 'Familia / Admin' : 'Servicio';
}

class AppUser {
  final String uid;
  final String email;
  final String displayName;
  final UserRole role;
  final String currentHouseholdId;

  const AppUser({
    required this.uid,
    required this.email,
    required this.displayName,
    required this.role,
    required this.currentHouseholdId,
  });

  AppUser copyWith({
    String? uid,
    String? email,
    String? displayName,
    UserRole? role,
    String? currentHouseholdId,
  }) {
    return AppUser(
      uid: uid ?? this.uid,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      role: role ?? this.role,
      currentHouseholdId: currentHouseholdId ?? this.currentHouseholdId,
    );
  }
}
