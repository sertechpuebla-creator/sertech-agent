/**
 * Read-only access to Nexus data (Supabase/PostgREST).
 *
 * Every request is an HTTP GET and is always filtered by the configured
 * tenant, so agents can neither write to Nexus nor read another company's rows.
 */

type Resource = {
  table: string;
  /** Columns returned in list results. */
  select: string;
  /** Columns returned when a single row is requested by id. */
  detailSelect?: string;
  /** Column matched by the `id` filter. */
  idColumn: string;
  /** Text columns matched by the `buscar` filter. */
  search: string[];
  statusColumn?: string;
  order: string;
  /** Fixed PostgREST filters always applied. */
  fixed?: Record<string, string>;
};

export const NEXUS_RESOURCES = {
  cotizaciones: {
    table: "st360_quotes",
    select:
      "id,folio,title,client_name,status,currency,issue_date,valid_until,next_follow_up,subtotal,tax,withholding,total,margin_percent,missing_costs,project_id,option_label,updated_at",
    detailSelect: "*",
    idColumn: "id",
    search: ["folio", "title", "client_name"],
    statusColumn: "status",
    order: "updated_at.desc",
  },
  catalogo: {
    table: "st360_catalog_products",
    select:
      "id,name,sku,type,description,brand,model,unit,currency,cost,price,availability,supplier,cost_date,active",
    idColumn: "id",
    search: ["name", "sku", "brand", "model", "description"],
    order: "name.asc",
    fixed: { deleted_at: "is.null" },
  },
  clientes: {
    table: "st360_records",
    select: "id,name,folio,data,active,updated_at",
    idColumn: "id",
    search: ["name"],
    order: "name.asc",
    fixed: { kind: "eq.clients" },
  },
  proyectos: {
    table: "st360_records",
    select:
      "id,name,folio,data,client_id,responsible,completed_at,active,created_at,updated_at",
    idColumn: "id",
    search: ["name"],
    order: "updated_at.desc",
    fixed: { kind: "eq.projects" },
  },
  espacios_proyecto: {
    table: "st360_project_workspaces",
    select: "project_id,data,version,updated_at",
    idColumn: "project_id",
    search: [],
    order: "updated_at.desc",
  },
  operaciones: {
    table: "st360_ops_entries",
    select: "id,kind,title,status,data,active,created_at,updated_at",
    idColumn: "id",
    search: ["title", "kind"],
    statusColumn: "status",
    order: "updated_at.desc",
  },
  tickets: {
    table: "st360_support_entries",
    select: "id,kind,folio,data,created_at,updated_at",
    idColumn: "id",
    search: ["kind"],
    order: "updated_at.desc",
  },
  eventos_ticket: {
    table: "st360_support_events",
    select: "id,entry_id,status,note,created_at",
    idColumn: "entry_id",
    search: ["note"],
    statusColumn: "status",
    order: "created_at.desc",
  },
  respuestas_ticket: {
    table: "st360_ticket_replies",
    select: "id,ticket_id,sender,subject,body,received_at",
    idColumn: "ticket_id",
    search: ["subject", "sender"],
    order: "received_at.desc",
  },
} as const satisfies Record<string, Resource>;

export type NexusResourceName = keyof typeof NEXUS_RESOURCES;

export type NexusQuery = {
  recurso: NexusResourceName;
  id?: string;
  estado?: string;
  buscar?: string;
  limite?: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ROWS = 50;

export async function queryNexus(query: NexusQuery) {
  const url = process.env.NEXUS_SUPABASE_URL;
  const key = process.env.NEXUS_SUPABASE_KEY;
  const tenant = process.env.NEXUS_TENANT_ID;
  if (!url || !key || !tenant) {
    return {
      ok: false as const,
      error:
        "La conexión a Nexus no está configurada (faltan NEXUS_SUPABASE_URL, NEXUS_SUPABASE_KEY o NEXUS_TENANT_ID). No se consultó Nexus.",
    };
  }

  const resource: Resource = NEXUS_RESOURCES[query.recurso];
  const params = new URLSearchParams();
  params.set("tenant_id", `eq.${tenant}`);
  for (const [column, filter] of Object.entries(resource.fixed ?? {})) {
    params.set(column, filter);
  }

  if (query.id) {
    if (!UUID.test(query.id)) {
      return { ok: false as const, error: "El id debe ser un UUID de Nexus." };
    }
    params.set(resource.idColumn, `eq.${query.id}`);
  }
  if (query.estado && resource.statusColumn) {
    params.set(resource.statusColumn, `eq.${query.estado}`);
  }
  // Keep only characters that cannot alter PostgREST filter syntax.
  const term = query.buscar?.replace(/[^\p{L}\p{N} ._@-]/gu, " ").trim();
  if (term && resource.search.length > 0) {
    params.set(
      "or",
      `(${resource.search.map((column) => `${column}.ilike.*${term}*`).join(",")})`,
    );
  }

  const single = Boolean(query.id) && resource.idColumn === "id";
  params.set("select", single ? (resource.detailSelect ?? resource.select) : resource.select);
  params.set("order", resource.order);
  params.set("limit", String(Math.min(Math.max(query.limite ?? 20, 1), MAX_ROWS)));

  let response: Response;
  try {
    response = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/${resource.table}?${params}`,
      {
        method: "GET",
        headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      },
    );
  } catch {
    return { ok: false as const, error: "No se pudo contactar a Nexus. No se obtuvieron datos." };
  }
  if (!response.ok) {
    return {
      ok: false as const,
      error: `Nexus respondió con el error ${response.status}. No se obtuvieron datos.`,
    };
  }
  const filas = (await response.json()) as unknown[];
  return { ok: true as const, recurso: query.recurso, total: filas.length, filas };
}
