import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseKey, supabaseUrl } from "@/lib/env";

/** Supabase client for Server Components, Server Actions and Route Handlers. Acts as the signed-in user. */
export async function createClient() {
  const store = await cookies();
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          // Server Components cannot write cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}
