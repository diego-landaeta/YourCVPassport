import { supabase } from '../supabase/client';

/**
 * Destino tras confirmar el correo o volver de un proveedor: quien se registro como
 * empresa (user_metadata.tipo === 'empresa') sigue en el alta de empresa; el resto, al panel.
 * Si no se puede leer el usuario, al panel (el comportamiento de siempre).
 */
export async function postAuthDestination(): Promise<string> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.user_metadata?.tipo === 'empresa' ? '/company/register' : '/dashboard';
  } catch {
    return '/dashboard';
  }
}
