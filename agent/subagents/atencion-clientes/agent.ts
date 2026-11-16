import { defineAgent } from "eve";

export default defineAgent({
  description: "Atiende solicitudes de clientes de SERTECH: redacta respuestas a correos, mensajes y tickets, clasifica la solicitud por tipo y urgencia, y propone el siguiente paso. Úsalo para cualquier comunicación con clientes.",
  model: "google/gemma-4-26b-a4b-it",
});
