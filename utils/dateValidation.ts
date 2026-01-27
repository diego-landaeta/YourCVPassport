/**
 * Utilidad para validar fechas de forma lógica
 */

export interface DateValidationResult {
  isValid: boolean;
  error?: string;
}

export interface DateValidationTranslations {
  dateFormatInvalid: string;
  yearInvalid: string;
  yearTooOld: string;
  yearFuture: string;
  monthInvalid: string;
  endDateBeforeStart: string;
  dateRangeTooLong: string;
}

/**
 * Valida que una fecha sea lógica y realista
 */
export function validateDate(
  dateStr: string | null | undefined,
  fieldName: string = 'Date',
  t?: DateValidationTranslations
): DateValidationResult {
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
      error: t?.dateFormatInvalid || `${fieldName} has invalid format. Use YYYY-MM (eg: 2024-03)`
    };
  }

  // Validar que el año tenga 4 dígitos válidos
  if (year < 1000 || year > 9999 || isNaN(year)) {
    return {
      isValid: false,
      error: t?.yearInvalid || `${fieldName} must have a valid 4-digit year (YYYY)`
    };
  }

  // Validar año lógico (entre 1950 y año actual)
  const currentYear = new Date().getFullYear();
  const minYear = 1950;
  const maxYear = currentYear;

  if (year < minYear) {
    return {
      isValid: false,
      error: t?.yearTooOld || `${fieldName} cannot be before ${minYear}`
    };
  }

  if (year > maxYear) {
    return {
      isValid: false,
      error: t?.yearFuture || `${fieldName} cannot be after ${maxYear}`
    };
  }

  // Validar mes
  if (month < 1 || month > 12) {
    return {
      isValid: false,
      error: t?.monthInvalid || `Month must be between 01 and 12`
    };
  }

  // Validar día si está presente
  if (fullDateMatch) {
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) {
      return {
        isValid: false,
        error: `Day must be between 01 and ${daysInMonth} for ${month}/${year}`
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
  isCurrent: boolean = false,
  t?: DateValidationTranslations
): DateValidationResult {
  // Validar fecha de inicio
  const startValidation = validateDate(startDate, 'Start date', t);
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
  const endValidation = validateDate(endDate, 'End date', t);
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
        error: t?.endDateBeforeStart || 'End date cannot be before start date'
      };
    }

    // Validar que el rango no sea mayor a 50 años (poco realista)
    const yearsDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (yearsDiff > 50) {
      return {
        isValid: false,
        error: t?.dateRangeTooLong || 'Date range cannot be longer than 50 years'
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
