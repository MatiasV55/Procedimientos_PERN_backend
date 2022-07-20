const { Router } = require("express");
const {
  registrar,
  autenticar,
  perfil,
} = require("../controllers/usuarios.controller");

const checkAuth = require("../middleware/checkAuth");

//DEFINICIÓN DE RUTAS Y ACCIONES PARA LOS PROCESOS

const router = Router();

//Defino LAS RUTAS
// Autenticación, registro y perfil de usuarios
router.post("/", registrar); //Crea un nuevo usuario
router.post("/login", autenticar);

router.get("/perfil", checkAuth, perfil);

module.exports = router;
