import { defineTool } from "eve/tools";
import { z } from "zod";

import { queryNexus } from "../../../../lib/nexus";

export default defineTool({
  description:
    "Consulta datos de Nexus en modo solo lectura. Recursos: proyectos, espacios_proyecto (detalle de trabajo de un proyecto), operaciones y cotizaciones ligadas. Sin filtros devuelve los registros más recientes. Usa `id` para un registro concreto; en eventos_ticket y respuestas_ticket el `id` es el del ticket, y en espacios_proyecto el del proyecto. Si responde ok=false, no se obtuvieron datos.",
  inputSchema: z.object({
    recurso: z.enum(["proyectos", "espacios_proyecto", "operaciones", "cotizaciones"]).describe("Tipo de registro a consultar."),
    id: z.string().optional().describe("UUID del registro (o del ticket/proyecto relacionado)."),
    estado: z.string().optional().describe("Filtra por estado exacto, si el recurso tiene estado."),
    buscar: z.string().optional().describe("Texto a buscar en nombre, folio, título o cliente."),
    limite: z.number().int().min(1).max(50).optional().describe("Máximo de filas (20 por defecto)."),
  }),
  label: { start: ({ recurso }) => `Consultar ${recurso} en Nexus` },
  execute: (input) => queryNexus(input),
});
