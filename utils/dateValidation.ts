/**
 * Utilidad para validar fechas de forma lógica
 */

export interface DateValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Valida que una fecha sea lógica y realista
 */
export function validateDate(dateStr: string | null | undefined, fieldName: string = 'La fecha'): DateValidationResult {
  // Si no hay fecha, es válido (campo opcional)
  if (!dateStr) {
    return { isValid: true };
  }

  // Validar formato YYYY-MM o YYYY-MM-DD
  const monthYearFormat = /^(\d{4})-(\d{2})$/;
  const fullDateFormat = /^(\d{4})-(\d{2})-(\d{2})$/;

  let year: number;
  let month: number;
  let day: number = 1;

  const monthYearMatch = dateStr.match(monthYearFormat);
  const fullDateMatch = dateStr.match(fullDateFormat);

  if (fullDateMatch) {
    year = parseInt(fullDateMatch[1], 10);
    month = parseInt(fullDateMatch[2], 10);
    day = parseInt(fullDateMatch[3], 10);
  } else if (monthYearMatch) {
    year = parseInt(monthYearMatch[1], 10);
    month = parseInt(monthYearMatch[2], 10);
  } else {
    return {
      isValid: false,
      error: `${fieldName} tiene un formato inválido. Use YYYY-MM (ej: 2024-03)`
    };
  }

  // Validar que el año tenga 4 dígitos válidos
  if (year < 1000 || year > 9999 || isNaN(year)) {
    return {
      isValid: false,
      error: `${fieldName} debe tener un año de 4 dígitos válido (YYYY)`
    };
  }

  // Validar año lógico (entre 1950 y año actual)
  const currentYear = new Date().getFullYear();
  const minYear = 1950;
  const maxYear = currentYear;

  if (year < minYear) {
    return {
      isValid: false,
      error: `${fieldName} no puede ser anterior a ${minYear}`
    };
  }

  if (year > maxYear) {
    return {
      isValid: false,
      error: `${fieldName} no puede ser posterior a ${maxYear}`
    };
  }

  // Validar mes
  if (month < 1 || month > 12) {
    return {
      isValid: false,
      error: `El mes debe estar entre 01 y 12`
    };
  }

  // Validar día si está presente
  if (fullDateMatch) {
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) {
      return {
        isValid: false,
        error: `El día debe estar entre 01 y ${daysInMonth} para ${month}/${year}`
      };
    }
  }

  return { isValid: true };
}

/**
 * Valida un rango de fechas (inicio y fin)
 */
export function validateDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  isCurrent: boolean = false
): DateValidationResult {
  // Validar fecha de inicio
  const startValidation = validateDate(startDate, 'La fecha de inicio');
  if (!startValidation.isValid) {
    return startValidation;
  }

  // Si es trabajo/estudio actual, no validar fecha fin
  if (isCurrent) {
    return { isValid: true };
  }

  // Si no es actual y no hay fecha de fin, es válido (campo opcional)
  // Esto permite guardar experiencias sin fecha de fin cuando no es actual
  if (!endDate || endDate.trim() === '') {
    return { isValid: true };
  }

  // Validar fecha de fin
  const endValidation = validateDate(endDate, 'La fecha de fin');
  if (!endValidation.isValid) {
    return endValidation;
  }

  // Validar que la fecha de fin sea posterior a la de inicio
  if (startDate && endDate) {
    const start = new Date(startDate + (startDate.length === 7 ? '-01' : ''));
    const end = new Date(endDate + (endDate.length === 7 ? '-01' : ''));

    if (end < start) {
      return {
        isValid: false,
        error: 'La fecha de fin no puede ser anterior a la fecha de inicio'
      };
    }

    // Validar que el rango no sea mayor a 50 años (poco realista)
    const yearsDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (yearsDiff > 50) {
      return {
        isValid: false,
        error: 'El rango de fechas no puede ser mayor a 50 años'
      };
    }
  }

  return { isValid: true };
}

/**
 * Formatea una fecha para visualización
 */
export function formatDateForDisplay(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Presente';

  try {
    const date = new Date(dateStr + (dateStr.length === 7 ? '-01' : ''));
    return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
