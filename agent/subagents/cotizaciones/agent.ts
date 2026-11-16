import { defineAgent } from "eve";

export default defineAgent({
  description: "Prepara, revisa y da seguimiento a cotizaciones de SERTECH para clientes: partidas, cantidades, precios, totales, vigencia y condiciones. Úsalo para cualquier tarea de cotización.",
  model: "google/gemma-4-26b-a4b-it",
});
