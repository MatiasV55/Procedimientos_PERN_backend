const jsonwebtoken = require("jsonwebtoken");

const generarJWT = (id) => {
  return jsonwebtoken.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

module.exports = generarJWT;
