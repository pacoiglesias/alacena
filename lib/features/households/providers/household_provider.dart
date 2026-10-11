import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../models/household_model.dart';

class HouseholdsListNotifier extends Notifier<List<Household>> {
  @override
  List<Household> build() {
    final now = DateTime.now();
    return [
      Household(
        id: 'casa-principal',
        name: 'Residencia Principal (Lomas)',
        address: 'Lomas de Chapultepec, Miguel Hidalgo, CDMX',
        createdAt: now.subtract(const Duration(days: 120)),
        zones: const [
          HouseholdZone(id: 'all', name: 'Todas las Zonas', type: 'all', icon: 'grid_view'),
          HouseholdZone(id: 'alacena-1', name: 'Alacena Principal (Cocina)', type: 'pantry', icon: 'kitchen'),
          HouseholdZone(id: 'cava', name: 'Cava Subterránea Climatizada', type: 'cellar', icon: 'wine_bar', temperatureNotes: '14°C • 70% HR'),
          HouseholdZone(id: 'refrigerador', name: 'Refrigerador & Cuarto Frío', type: 'fridge', icon: 'ac_unit', temperatureNotes: '4°C'),
          HouseholdZone(id: 'congelador', name: 'Congelador Deep-Freeze', type: 'freezer', icon: 'severe_cold', temperatureNotes: '-18°C'),
          HouseholdZone(id: 'bodega', name: 'Bodega de Insumos & Despensa Seca', type: 'warehouse', icon: 'inventory_2'),
          HouseholdZone(id: 'bar', name: 'Bar Terraza & Cristalería', type: 'bar', icon: 'liquor'),
        ],
      ),
      Household(
        id: 'casa-valle',
        name: 'Rancho Valle de Bravo',
        address: 'Avándaro, Valle de Bravo, Estado de México',
        createdAt: now.subtract(const Duration(days: 60)),
        zones: const [
          HouseholdZone(id: 'all', name: 'Todas las Zonas', type: 'all', icon: 'grid_view'),
          HouseholdZone(id: 'alacena-valle', name: 'Alacena Rústica de Madera', type: 'pantry', icon: 'kitchen'),
          HouseholdZone(id: 'cava-valle', name: 'Cava de Piedra Natural', type: 'cellar', icon: 'wine_bar', temperatureNotes: '16°C'),
          HouseholdZone(id: 'refri-valle', name: 'Refrigerador Cocina Abierta', type: 'fridge', icon: 'ac_unit'),
        ],
      ),
    ];
  }

  void addHousehold({required String name, required String address}) {
    final newHousehold = Household(
      id: const Uuid().v4(),
      name: name,
      address: address,
      createdAt: DateTime.now(),
      zones: [
        const HouseholdZone(id: 'all', name: 'Todas las Zonas', type: 'all', icon: 'grid_view'),
        HouseholdZone(id: const Uuid().v4(), name: 'Alacena Principal', type: 'pantry', icon: 'kitchen'),
        HouseholdZone(id: const Uuid().v4(), name: 'Refrigerador', type: 'fridge', icon: 'ac_unit'),
        HouseholdZone(id: const Uuid().v4(), name: 'Cava', type: 'cellar', icon: 'wine_bar'),
      ],
    );

    state = [...state, newHousehold];
  }

  void updateHousehold({required String id, required String name, required String address}) {
    state = state.map((h) {
      if (h.id == id) {
        return h.copyWith(name: name, address: address);
      }
      return h;
    }).toList();
  }

  void deleteHousehold(String id) {
    if (state.length <= 1) return; // Mínimo 1 casa activa siempre
    state = state.where((h) => h.id != id).toList();
  }

  void addZone({required String householdId, required String name, required String type, String? temperatureNotes}) {
    state = state.map((h) {
      if (h.id == householdId) {
        String icon = 'kitchen';
        if (type == 'cellar') icon = 'wine_bar';
        if (type == 'fridge') icon = 'ac_unit';
        if (type == 'freezer') icon = 'severe_cold';
        if (type == 'warehouse') icon = 'inventory_2';
        if (type == 'bar') icon = 'liquor';

        final newZone = HouseholdZone(
          id: const Uuid().v4(),
          name: name,
          type: type,
          icon: icon,
          temperatureNotes: temperatureNotes,
        );
        return h.copyWith(zones: [...h.zones, newZone]);
      }
      return h;
    }).toList();
  }

  void updateZone({required String householdId, required String zoneId, required String name, String? temperatureNotes}) {
    state = state.map((h) {
      if (h.id == householdId) {
        final updatedZones = h.zones.map((z) {
          if (z.id == zoneId) {
            return z.copyWith(name: name, temperatureNotes: temperatureNotes);
          }
          return z;
        }).toList();
        return h.copyWith(zones: updatedZones);
      }
      return h;
    }).toList();
  }

  void deleteZone({required String householdId, required String zoneId}) {
    if (zoneId == 'all') return;
    state = state.map((h) {
      if (h.id == householdId) {
        return h.copyWith(zones: h.zones.where((z) => z.id != zoneId).toList());
      }
      return h;
    }).toList();
  }
}

final householdsListProvider = NotifierProvider<HouseholdsListNotifier, List<Household>>(() {
  return HouseholdsListNotifier();
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
