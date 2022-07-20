const { Router } = require("express");
const {
  nuevaEtapa,
  actualizarEtapa,
  eliminarEtapa,
  consultarEtapa,
  consultarEtapas,
  buscarColaborador,
  añadirAprobado,
  añadirVisado,
  buscarVisados,
  buscarAprobados,
  eliminarColaborador,
  usersToCheck,
  etapaFromExecuted,
  cambiarCheckUser
} = require("../controllers/etapas.controller");

const checkAuth = require("../middleware/checkAuth");

//DEFINICIÓN DE RUTAS Y ACCIONES PARA LOS PROCESOS

const router = Router();

//Defino el CRUD SEGÚN LAS RUTAS

router.get("/proceso/:id", checkAuth, consultarEtapas);

router.post("/", checkAuth, nuevaEtapa);

router.post("/participantes", checkAuth, buscarColaborador);
router.post("/:id/agregar-visado", checkAuth, añadirVisado);
router.post("/:id/agregar-aprobado", checkAuth, añadirAprobado);

router.post("/:id/eliminar-colaborador", checkAuth, eliminarColaborador);

router.get("/visados/:id", checkAuth, buscarVisados);
router.get("/aprobados/:id", checkAuth, buscarAprobados);

router.put("/user-update/:id", checkAuth, cambiarCheckUser);

router
  .route("/:id")
  .get(checkAuth, consultarEtapa)
  .put(checkAuth, actualizarEtapa)
  .delete(checkAuth, eliminarEtapa);

router.get("/ejecutado-users/:id", checkAuth, usersToCheck);
router.get("/ejecutado-etapa/:id", checkAuth, etapaFromExecuted);

module.exports = router;
