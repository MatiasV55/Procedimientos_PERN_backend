const { Router } = require("express");
const {
  obtenerProcesos,
  nuevoProceso,
  obtenerProceso,
  editarProceso,
  eliminarProceso,
  etapasProceso,
  iniciarProceso,
  obtenerEnCurso,
} = require("../controllers/procesos.controller");

const checkAuth = require("../middleware/checkAuth");

//DEFINICIÓN DE RUTAS Y ACCIONES PARA LOS PROCESOS

const router = Router();

//Defino el CRUD SEGÚN LAS RUTAS

router.route("/").get(checkAuth, obtenerProcesos).post(checkAuth, nuevoProceso);

router.route("/ejecutados").get(checkAuth, obtenerEnCurso);

router
  .route("/:id")
  .get(checkAuth, obtenerProceso)
  .put(checkAuth, editarProceso)
  .delete(checkAuth, eliminarProceso);

router.get("/:id/etapas", checkAuth, etapasProceso);

router.get("/:id/iniciar", checkAuth, iniciarProceso);

module.exports = router;
