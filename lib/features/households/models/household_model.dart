class HouseholdZone {
  final String id;
  final String name;
  final String type; // 'pantry' | 'cellar' | 'fridge' | 'bar'
  final String icon;

  const HouseholdZone({
    required this.id,
    required this.name,
    required this.type,
    required this.icon,
  });
}

class Household {
  final String id;
  final String name;
  final String address;
  final List<HouseholdZone> zones;

  const Household({
    required this.id,
    required this.name,
    required this.address,
    required this.zones,
  });
}
