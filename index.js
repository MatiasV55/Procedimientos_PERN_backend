const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const cors = require("cors");

const procesoRoutes = require("./src/routes/procesos.routes");
const usuarioRoutes = require("./src/routes/usuarios.routes");
const etapaRoutes = require("./src/routes/etapas.routes");

//ARCHIVO PRINCIPAL DEL SERVIDOR

const app = express();

dotenv.config(); //Busca el archivo .env para variables de entorno

app.use(morgan("dev"));
app.use(express.json()); //Para que el servidor pueda leer los objetos de tipo json

//Configurar CORS
const whiteList = [process.env.FRONTEND_URL];

const corsOptions = {
  origin: function (origin, callback) {
    if (whiteList.includes(origin)) {
      //Puede consultar la API
      callback(null, true);
    } else {
      //No está permitido
      callback(new Error("Error de Cors"));
    }
  },
};

app.use(cors(corsOptions));

//Routing
app.use("/api/procesos", procesoRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/etapas", etapaRoutes);

const PORT = process.env.PORT || 4000;

const servidor = app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// Socket.io
const { Server } = require("socket.io");

const io = new Server(servidor, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.FRONTEND_URL,
  },
});

io.on("connection", (socket) => {
  console.log("Conectado a socket.io");

  //Definimos eventos de socket io
});
