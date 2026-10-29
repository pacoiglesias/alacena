// Ayudas puras para borrar zonas sin dejar productos huérfanos.
// Los productos guardan la zona por NOMBRE (p.zone), no por id: al borrar
// una zona hay que reasignar sus productos a la primera zona viva.
export function firstLivingZoneName(zones, deletedZoneId) {
  const remaining = (zones || []).filter((z) => z.id !== deletedZoneId);
  return remaining[0]?.name || 'Alacena Principal';
}

export function reassignProductsFromDeletedZone(products, deletedZoneName, fallbackZoneName) {
  return (products || []).map((p) =>
    p.zone === deletedZoneName ? { ...p, zone: fallbackZoneName } : p
  );
}
