"use server";

import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";

export interface SearchResult {
  id: string;
  type: "client" | "project";
  title: string;
  subtitle: string | null;
}

export async function globalSearchAction(query: string): Promise<SearchResult[]> {
  await verifySession();
  const q = query.trim();
  if (q.length < 2) return [];

  const supabase = await createClient();
  const like = `%${q}%`;

  const [{ data: clients }, { data: projects }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, company")
      .or(`name.ilike.${like},company.ilike.${like},email.ilike.${like}`)
      .limit(5),
    supabase
      .from("projects")
      .select("id, name, clients(name)")
      .ilike("name", like)
      .limit(5),
  ]);

  const clientResults: SearchResult[] = (clients ?? []).map((c) => ({
    id: c.id,
    type: "client",
    title: c.name,
    subtitle: c.company,
  }));

  const projectResults: SearchResult[] = (
    (projects ?? []) as unknown as { id: string; name: string; clients: { name: string } | null }[]
  ).map((p) => ({
    id: p.id,
    type: "project",
    title: p.name,
    subtitle: p.clients?.name ?? null,
  }));

  return [...projectResults, ...clientResults];
}
