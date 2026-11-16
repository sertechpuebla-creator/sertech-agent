import { defineAgent } from "eve";

export default defineAgent({
  description: "Da seguimiento a proyectos de SERTECH: avances, tareas pendientes, responsables, fechas compromiso, atrasos y riesgos. Úsalo para revisar el estado de proyectos o planear siguientes pasos.",
  model: "google/gemma-4-26b-a4b-it",
});
