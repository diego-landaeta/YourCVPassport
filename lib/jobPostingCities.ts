/**
 * Sugerencias de ciudad para el autocompletado del asistente (<datalist>).
 * Son solo ayudas: el campo admite cualquier texto. Para los países que no
 * están aquí se sugieren las ciudades de las ofertas anteriores de la empresa.
 */
const CITIES: Record<string, string[]> = {
  ES: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Bilbao', 'Alicante', 'Las Palmas de Gran Canaria', 'Valladolid', 'Granada', 'A Coruña', 'Vigo', 'San Sebastián', 'Santander', 'Pamplona'],
  MX: ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Querétaro', 'Mérida', 'Cancún', 'San Luis Potosí', 'Chihuahua', 'Toluca'],
  AR: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'San Miguel de Tucumán', 'Mar del Plata', 'Salta', 'Santa Fe', 'Neuquén'],
  CO: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales', 'Santa Marta'],
  CL: ['Santiago', 'Valparaíso', 'Concepción', 'Viña del Mar', 'Antofagasta', 'Temuco', 'Rancagua', 'La Serena'],
  PE: ['Lima', 'Arequipa', 'Trujillo', 'Cusco', 'Chiclayo', 'Piura', 'Iquitos'],
  EC: ['Quito', 'Guayaquil', 'Cuenca', 'Ambato'],
  UY: ['Montevideo', 'Punta del Este', 'Salto', 'Paysandú'],
  PT: ['Lisboa', 'Oporto', 'Braga', 'Coímbra', 'Faro'],
  FR: ['París', 'Lyon', 'Marsella', 'Toulouse', 'Burdeos', 'Lille'],
  DE: ['Berlín', 'Múnich', 'Hamburgo', 'Fráncfort', 'Colonia', 'Stuttgart'],
  IT: ['Roma', 'Milán', 'Nápoles', 'Turín', 'Bolonia', 'Florencia'],
  GB: ['Londres', 'Mánchester', 'Birmingham', 'Edimburgo', 'Glasgow', 'Bristol'],
  IE: ['Dublín', 'Cork', 'Galway', 'Limerick'],
};

/** Sugerencias para un país, mezcladas con las ciudades ya usadas por la empresa (sin duplicados). */
export function citySuggestions(countryCode: string, used: readonly string[] = []): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const c of [...used, ...(CITIES[countryCode] || [])]) {
    const k = c.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(c.trim());
  }
  return out;
}
