import 'package:flutter/material.dart';

enum MemberRole {
  admin,
  service,
  chef,
  family,
}

extension MemberRoleExtension on MemberRole {
  String get label {
    switch (this) {
      case MemberRole.admin:
        return 'Administrador (Finanzas & Control)';
      case MemberRole.service:
        return 'Personal de Servicio (Solo Escaneo)';
      case MemberRole.chef:
        return 'Chef Privado (Recetas & Despensa)';
      case MemberRole.family:
        return 'Familiar / Residente (Colaborativo)';
    }
  }

  String get shortLabel {
    switch (this) {
      case MemberRole.admin:
        return 'Admin';
      case MemberRole.service:
        return 'Servicio';
      case MemberRole.chef:
        return 'Chef';
      case MemberRole.family:
        return 'Familia';
    }
  }

  Color get color {
    switch (this) {
      case MemberRole.admin:
        return const Color(0xFF059669);
      case MemberRole.service:
        return const Color(0xFFF59E0B);
      case MemberRole.chef:
        return const Color(0xFF881337);
      case MemberRole.family:
        return const Color(0xFF2563EB);
    }
  }

  Color get badgeColor => color;

  IconData get icon {
    switch (this) {
      case MemberRole.admin:
        return Icons.admin_panel_settings;
      case MemberRole.service:
        return Icons.room_service_outlined;
      case MemberRole.chef:
        return Icons.restaurant_menu;
      case MemberRole.family:
        return Icons.family_restroom;
    }
  }
}

class UserMember {
  final String id;
  final String displayName;
  final String email;
  final MemberRole role;
  final String assignedHouseholdId;
  final DateTime createdAt;

  const UserMember({
    required this.id,
    required this.displayName,
    required this.email,
    required this.role,
    required this.assignedHouseholdId,
    required this.createdAt,
  });

  UserMember copyWith({
    String? displayName,
    String? email,
    MemberRole? role,
    String? assignedHouseholdId,
  }) {
    return UserMember(
      id: id,
      displayName: displayName ?? this.displayName,
      email: email ?? this.email,
      role: role ?? this.role,
      assignedHouseholdId: assignedHouseholdId ?? this.assignedHouseholdId,
      createdAt: createdAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'displayName': displayName,
      'email': email,
      'role': role.name,
      'assignedHouseholdId': assignedHouseholdId,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory UserMember.fromMap(Map<String, dynamic> map) {
    return UserMember(
      id: map['id'] ?? '',
      displayName: map['displayName'] ?? '',
      email: map['email'] ?? '',
      role: MemberRole.values.firstWhere(
        (r) => r.name == map['role'],
        orElse: () => MemberRole.service,
      ),
      assignedHouseholdId: map['assignedHouseholdId'] ?? '',
      createdAt: map['createdAt'] != null ? DateTime.parse(map['createdAt']) : DateTime.now(),
    );
  }
}
