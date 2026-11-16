import { defineTool } from "eve/tools";
import { z } from "zod";

import { queryNexus } from "../../../../lib/nexus";

export default defineTool({
  description:
    "Consulta datos de Nexus en modo solo lectura. Recursos: tickets de soporte, eventos_ticket (historial), respuestas_ticket (correos del cliente) y clientes. Sin filtros devuelve los registros más recientes. Usa `id` para un registro concreto; en eventos_ticket y respuestas_ticket el `id` es el del ticket, y en espacios_proyecto el del proyecto. Si responde ok=false, no se obtuvieron datos.",
  inputSchema: z.object({
    recurso: z.enum(["tickets", "eventos_ticket", "respuestas_ticket", "clientes"]).describe("Tipo de registro a consultar."),
    id: z.string().optional().describe("UUID del registro (o del ticket/proyecto relacionado)."),
    estado: z.string().optional().describe("Filtra por estado exacto, si el recurso tiene estado."),
    buscar: z.string().optional().describe("Texto a buscar en nombre, folio, título o cliente."),
    limite: z.number().int().min(1).max(50).optional().describe("Máximo de filas (20 por defecto)."),
  }),
  label: { start: ({ recurso }) => `Consultar ${recurso} en Nexus` },
  execute: (input) => queryNexus(input),
});
