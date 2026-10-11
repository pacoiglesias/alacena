import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/household_model.dart';

final householdsListProvider = Provider<List<Household>>((ref) {
  return const [
    Household(
      id: 'casa-principal',
      name: 'Casa Principal',
      address: 'Lomas de Chapultepec, CDMX',
      zones: [
        HouseholdZone(id: 'all', name: 'Todas las Zonas', type: 'all', icon: 'grid_view'),
        HouseholdZone(id: 'alacena-1', name: 'Alacena Principal', type: 'pantry', icon: 'kitchen'),
        HouseholdZone(id: 'cava', name: 'Cava Subterránea', type: 'cellar', icon: 'wine_bar'),
        HouseholdZone(id: 'refrigerador', name: 'Cuarto Frío / Cavas', type: 'fridge', icon: 'ac_unit'),
        HouseholdZone(id: 'bar', name: 'Bar Terraza', type: 'bar', icon: 'liquor'),
      ],
    ),
    Household(
      id: 'casa-valle',
      name: 'Rancho / Valle de Bravo',
      address: 'Valle de Bravo, EdoMex',
      zones: [
        HouseholdZone(id: 'all', name: 'Todas las Zonas', type: 'all', icon: 'grid_view'),
        HouseholdZone(id: 'alacena-valle', name: 'Alacena Rústica', type: 'pantry', icon: 'kitchen'),
        HouseholdZone(id: 'cava-valle', name: 'Cava Piedra', type: 'cellar', icon: 'wine_bar'),
      ],
    ),
  ];
});

class SelectedHouseholdNotifier extends Notifier<Household> {
  @override
  Household build() {
    final list = ref.watch(householdsListProvider);
    return list.first;
  }

  void selectHousehold(String id) {
    final list = ref.read(householdsListProvider);
    state = list.firstWhere((h) => h.id == id, orElse: () => list.first);
    ref.read(selectedZoneProvider.notifier).setZone('all');
  }
}

final selectedHouseholdProvider = NotifierProvider<SelectedHouseholdNotifier, Household>(() {
  return SelectedHouseholdNotifier();
});

class SelectedZoneNotifier extends Notifier<String> {
  @override
  String build() => 'all';

  void setZone(String zoneId) => state = zoneId;
}

final selectedZoneProvider = NotifierProvider<SelectedZoneNotifier, String>(() {
  return SelectedZoneNotifier();
});
