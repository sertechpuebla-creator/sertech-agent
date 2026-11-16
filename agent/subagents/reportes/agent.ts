import { defineAgent } from "eve";

export default defineAgent({
  description: "Elabora reportes y resúmenes de SERTECH (diarios, semanales o por tema) a partir de datos de ventas, cotizaciones, proyectos o servicio: indicadores, tablas y conclusiones. Úsalo cuando se pida un reporte o resumen.",
  model: "google/gemma-4-26b-a4b-it",
});
