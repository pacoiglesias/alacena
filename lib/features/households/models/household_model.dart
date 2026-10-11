class HouseholdZone {
  final String id;
  final String name;
  final String type; // 'pantry' | 'cellar' | 'fridge' | 'freezer' | 'warehouse' | 'bar'
  final String icon;
  final String? temperatureNotes; // Ej. "4°C", "14°C - 70% HR", "-18°C"

  const HouseholdZone({
    required this.id,
    required this.name,
    required this.type,
    required this.icon,
    this.temperatureNotes,
  });

  HouseholdZone copyWith({
    String? name,
    String? type,
    String? icon,
    String? temperatureNotes,
  }) {
    return HouseholdZone(
      id: id,
      name: name ?? this.name,
      type: type ?? this.type,
      icon: icon ?? this.icon,
      temperatureNotes: temperatureNotes ?? this.temperatureNotes,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'icon': icon,
      'temperatureNotes': temperatureNotes,
    };
  }

  factory HouseholdZone.fromMap(Map<String, dynamic> map) {
    return HouseholdZone(
      id: map['id'] ?? '',
      name: map['name'] ?? '',
      type: map['type'] ?? 'pantry',
      icon: map['icon'] ?? 'kitchen',
      temperatureNotes: map['temperatureNotes'],
    );
  }
}

class Household {
  final String id;
  final String name;
  final String address;
  final List<HouseholdZone> zones;
  final DateTime createdAt;

  const Household({
    required this.id,
    required this.name,
    required this.address,
    required this.zones,
    required this.createdAt,
  });

  Household copyWith({
    String? name,
    String? address,
    List<HouseholdZone>? zones,
  }) {
    return Household(
      id: id,
      name: name ?? this.name,
      address: address ?? this.address,
      zones: zones ?? this.zones,
      createdAt: createdAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'zones': zones.map((z) => z.toMap()).toList(),
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory Household.fromMap(Map<String, dynamic> map) {
    return Household(
      id: map['id'] ?? '',
      name: map['name'] ?? '',
      address: map['address'] ?? '',
      zones: (map['zones'] as List<dynamic>? ?? [])
          .map((z) => HouseholdZone.fromMap(z as Map<String, dynamic>))
          .toList(),
      createdAt: map['createdAt'] != null ? DateTime.parse(map['createdAt']) : DateTime.now(),
    );
  }
}
