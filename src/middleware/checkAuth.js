const jsonwebtoken = require("jsonwebtoken");
const pool = require("../db");

const checkAuth = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);

      req.usuario = await pool.query(
        "SELECT id, nombre, mail FROM usuarios WHERE id = $1",
        [decoded.id]
      );

      return next();
    } catch (error) {
      return res.status(404).json({ msg: "Hubo un error" });
    }
  }

  if (!token) {
    const error = new Error("Token no válido");
    res.status(401).json({ msg: error.message });
  }

  next();
};

module.exports = checkAuth;
