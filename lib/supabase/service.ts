import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Cliente con la clave secreta (bypassa RLS). Uso exclusivo del servidor,
 * y solo para el puñado de rutas realmente públicas: la vista de
 * presupuesto compartida por link (`/p/[token]`) y su PDF. En cualquier
 * otro lado de la app se usa el cliente normal (`lib/supabase/server.ts`),
 * atado a la sesión del usuario y protegido por RLS.
 *
 * `SUPABASE_SECRET_KEY` NO lleva prefijo `NEXT_PUBLIC_`: nunca se
 * empaqueta en el bundle del navegador.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Falta SUPABASE_SECRET_KEY en las variables de entorno (clave secreta de Supabase, sin prefijo NEXT_PUBLIC_)."
    );
  }

  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false },
  });
}
