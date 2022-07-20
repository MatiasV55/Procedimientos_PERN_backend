const pool = require("../db");
const generarJWT = require("../helpers/generarJWT");

//FUNCIONES PARA LOS USUARIOS

const registrar = async (req, res) => {
  const { nombre, email, password } = req.body;

  //Chequeo que el mail no esté en la base
  const existeUsuario = await pool.query(
    "SELECT * FROM usuarios WHERE mail = $1",
    [email]
  );

  if (existeUsuario.rows.length !== 0) {
    const error = new Error("Usuario ya registrado");
    return res.status(400).json({ msg: error.message });
  }

  try {
    const resultado = await pool.query(
      "INSERT INTO usuarios (nombre, mail, pass)  VALUES ($1, $2, $3) RETURNING *",
      [nombre, email, password]
    ); //Peticion a la base

    res.json({ msg: "Usuario creado correctamente" });
  } catch (error) {
    res.json({ error: error.message });
  }
};

const autenticar = async (req, res) => {
  const { email, password } = req.body;
  //Comprobar si el usuario existe
  const existeUsuario = await pool.query(
    "SELECT * FROM usuarios WHERE mail = $1",
    [email]
  );

  if (existeUsuario.rows.length === 0) {
    const error = new Error("El usuario no existe");
    return res.status(404).json({ msg: error.message });
  }
  //Comprobar password para autenticar
  if (existeUsuario.rows[0].pass === password) {
    res.json({
      id: existeUsuario.rows[0].id,
      nombre: existeUsuario.rows[0].nombre,
      correo: existeUsuario.rows[0].mail,
      token: generarJWT(existeUsuario.rows[0].id),
    });
  } else {
    const error = new Error("El password es incorrecto");
    return res.status(403).json({ msg: error.message });
  }
};

const perfil = async (req, res) => {
  const {usuario} = req
  res.json(usuario.rows[0])
};

module.exports = {
  registrar,
  autenticar,
  perfil,
};
