// ÚNICA función de formato de dinero de la app (3.14.0, C-4 de la
// auditoría de diseño): toda cifra que se enseña sale de aquí y usa la
// moneda de la CASA ACTIVA — Casa España es EUR y no debe ver jamás un
// «$ MXN» escrito a mano. Antes cada vista formateaba por su cuenta y
// varias llevaban «$ … MXN» fijo (Modo Súper, tabla de despensa,
// recetas, alta manual), falso en cuanto se cambiaba de casa.
//
// El campo de datos sigue llamándose *Mxn por historia del esquema;
// lo que manda al mostrar es `house.currency`.

export function houseCurrencyCode(house) {
  return house?.currency || 'MXN';
}

export function houseCurrencySymbol(house) {
  return houseCurrencyCode(house) === 'EUR' ? '€' : '$';
}

export function houseLocale(house) {
  return houseCurrencyCode(house) === 'EUR' ? 'es-ES' : 'es-MX';
}

// «$1,234.50» / «1.234,50 €» según la casa, siempre con 2 decimales:
// ninguna pantalla redondea el dinero a enteros (A-5).
export function formatHouseMoney(house, value) {
  const amount = Number(value) || 0;
  const formatted = amount.toLocaleString(houseLocale(house), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return houseCurrencyCode(house) === 'EUR' ? `${formatted} €` : `$${formatted}`;
}
