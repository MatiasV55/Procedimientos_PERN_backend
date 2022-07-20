const emailVisado = require("../helpers/emails.js");
const pool = require("../db");

//FUNCIONES PARA LAS ETAPAS

const nuevaEtapa = async (req, res) => {
  const { nombre, descripcion, prioridad, procesoid, anteriorid } = req.body;
  const creador = req.usuario.rows[0].id;

  const encontreProceso = await pool.query(
    "select * from procesos where id=$1 and creador_id = $2",
    [procesoid, creador]
  );

  if (encontreProceso.rows.length === 0) {
    const error = new Error("No encontrado");
    return res.status(404).json({ msg: error.message });
  }

  try {
    const resultado = await pool.query(
      "INSERT INTO etapas (nombre,descripcion,prioridad,proceso_id,anterior_id)  VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [nombre, descripcion, prioridad, procesoid, anteriorid]
    ); //Peticion a la base
    if (anteriorid !== null) {
      const agregoSig = await pool.query(
        "update etapas set siguiente_id = $1 where id= $2",
        [resultado.rows[0].id, anteriorid]
      );
    }
    res.json({ msg: "Etapa añadida correctamente" });
  } catch (error) {
    console.log(error);
  }
};

const actualizarEtapa = async (req, res) => {
  const { id, name, description, priority } = req.body;
  try {
    const resultado = await pool.query(
      "update etapas set nombre=$1,descripcion=$2,prioridad=$3 where id=$4 RETURNING *",
      [name, description, priority, id]
    );
    res.json(resultado.rows[0]);
  } catch (error) {
    console.log(error);
  }
};

const eliminarEtapa = async (req, res) => {
  const { id } = req.params;

  const creador = req.usuario.rows[0].id;

  const auth = await pool.query(
    "select * from etapas where id = $1 and proceso_id in (select id from procesos where creador_id = $2)",
    [id, creador]
  );
  //NO es el creador del proceso
  if (auth.rowCount === 0) {
    const error = new Error("Acción no válida");
    return res.status(401).json({ msg: error.message });
  }

  try {
    const result = await pool.query("DELETE FROM etapas WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Etapa no encontrada",
      });
    }

    res.json({ msg: "Etapa eliminada" });
  } catch (error) {
    res.json({ error: error.message });
  }
};

const consultarEtapa = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM etapas WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Etapa no encontrada",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.json({ error: error.message });
  }
};

const consultarEtapas = async (req, res) => {
  let arrayVisados = [];
  let arrayAprobados = [];
  let etapasFinal = [];
  try {
    const { id } = req.params;
    const etapas = await pool.query(
      "SELECT * FROM etapas where proceso_id=$1 order by siguiente_id",
      [id]
    );
    if (etapas.rows.length !== 0) {
      for (let i = 0; i < etapas.rows.length; i++) {
        const etapaIdVisados = await pool.query(
          "select usuario_id from visados_por_etapa where etapa_id=$1",
          [etapas.rows[i].id]
        );
        const etapaIdAprobados = await pool.query(
          "select usuario_id from aprobados_por_etapa where etapa_id=$1",
          [etapas.rows[i].id]
        );
        //Si hay usuarios para visado
        if (etapaIdVisados.rows.length !== 0) {
          for (let j = 0; j < etapaIdVisados.rows.length; j++) {
            const etapaVisado = await pool.query(
              "SELECT id,nombre,mail FROM usuarios WHERE id=$1",
              [etapaIdVisados.rows[j].usuario_id]
            );
            //Encontré usuario en etapaVisado.rows[0]
            if (etapaVisado.rows.length !== 0) {
              arrayVisados.push(etapaVisado.rows[0]);
            }
          }
        }
        //Si no hay usuarios para visado
        else {
          arrayVisados.push({ id: 000, nombre: "No hay usuarios para visado" });
        }

        //Si hay usuarios para aprobado
        if (etapaIdAprobados.rows.length !== 0) {
          for (let k = 0; k < etapaIdAprobados.rows.length; k++) {
            const etapaAprobado = await pool.query(
              "SELECT id,nombre,mail FROM usuarios WHERE id=$1",
              [etapaIdAprobados.rows[k].usuario_id]
            );
            //Encontré usuario?
            if (etapaAprobado.rows.length !== 0) {
              arrayAprobados.push(etapaAprobado.rows[0]);
            }
          }
        }
        //Si no hay usuarios para aprobado
        else {
          arrayAprobados.push({
            id: 111,
            nombre: "No hay usuarios para aprobado",
          });
        }

        //Llegado acá debo ir armando el array etapasFinal
        //Desarmo el objeto de la etapa
        const {
          id,
          nombre,
          descripcion,
          prioridad,
          proceso_id,
          siguiente_id,
          anterior_id,
        } = etapas.rows[i];
        //Rearmo un nuevo objeto incluyendo los atributos de visados y aprobados
        const obj = {
          id: id,
          nombre: nombre,
          descripcion: descripcion,
          prioridad: prioridad,
          proceso_id: proceso_id,
          siguiente_id: siguiente_id,
          anterior_id: anterior_id,
          visados: arrayVisados,
          aprobados: arrayAprobados,
        };
        etapasFinal.push(obj);
        //Limpio los arreglos para la siguiente vuelta
        arrayVisados = [];
        arrayAprobados = [];
      }
      res.json(etapasFinal);
    } else {
      res.json(etapas.rows);
    }
  } catch (error) {
    console.log(error);
  }
};

const buscarColaborador = async (req, res) => {
  const { email } = req.body;

  const usuario = await pool.query(
    "SELECT id,nombre,mail from usuarios where mail = $1",
    [email]
  );
  if (usuario.rows.length === 0) {
    return res.status(404).json({
      msg: "Usuario no encontrado",
    });
  }
  res.json(usuario.rows[0]);
};

const añadirVisado = async (req, res) => {
  const userId = req.usuario.rows[0].id;
  const { obj } = req.body;
  const { etapa, email } = obj;
  try {
    const userAgregar = await pool.query(
      "select id from usuarios where mail=$1",
      [email]
    );
    if (userAgregar.rows[0].id === userId) {
      const error = new Error("No puede agregarse a si mismo");
      return res.status(404).json({ msg: error.message });
    }
    const yaExiste = await pool.query(
      "select * from visados_por_etapa where etapa_id=$1 and usuario_id=$2",
      [etapa, userAgregar.rows[0].id]
    );
    if (yaExiste.rows.length !== 0) {
      const error = new Error("El usuario ya existe para el rol");
      return res.status(404).json({ msg: error.message });
    }

    const agregar = await pool.query(
      "insert into visados_por_etapa (etapa_id,usuario_id) values ($1,$2)",
      [etapa, userAgregar.rows[0].id]
    );

    res.json({ msg: "Usuario agregado con éxito" });
  } catch (error) {
    console.log(error);
  }
};

const añadirAprobado = async (req, res) => {
  const userId = req.usuario.rows[0].id;
  const { obj } = req.body;
  const { etapa, email } = obj;
  try {
    const userAgregar = await pool.query(
      "select id from usuarios where mail=$1",
      [email]
    );
    if (userAgregar.rows[0].id === userId) {
      const error = new Error("No puede agregarse a si mismo");
      return res.status(404).json({ msg: error.message });
    }
    const yaExiste = await pool.query(
      "select * from aprobados_por_etapa where etapa_id=$1 and usuario_id=$2",
      [etapa, userAgregar.rows[0].id]
    );
    if (yaExiste.rows.length !== 0) {
      const error = new Error("El usuario ya existe para el rol");
      return res.status(404).json({ msg: error.message });
    }

    const agregar = await pool.query(
      "insert into aprobados_por_etapa (etapa_id,usuario_id) values ($1,$2)",
      [etapa, userAgregar.rows[0].id]
    );

    res.json({ msg: "Usuario agregado con éxito" });
  } catch (error) {
    console.log(error);
  }
};

const buscarVisados = async (req, res) => {
  try {
    const { id } = req.params;
    let arrayVisado = [];
    const visados = await pool.query(
      "SELECT usuario_id FROM visados_por_etapa where etapa_id=$1",
      [id]
    );

    if (visados.rows.length === 0) {
      return res.json({
        message: "No hay usuarios para visado en la etapa",
      });
    }

    for (let i = 0; i < visados.rows.length; i++) {
      const userVisado = await pool.query(
        "SELECT id,nombre,mail FROM usuarios WHERE id=$1",
        [visados.rows[i].usuario_id]
      );

      if (userVisado.rows.length === 0) {
        return res.json({
          message: "Error usuario no encontrado",
        });
      }
      const { id, nombre, mail } = userVisado.rows[0];
      const obj = {
        id: id,
        nombre: nombre,
        mail: mail,
      };
      arrayVisado.unshift(obj);
    }
    res.json(arrayVisado);
  } catch (error) {
    console.log(error);
  }
};

const buscarAprobados = async (req, res) => {
  try {
    const { id } = req.params;
    let arrayAprobado = [];
    const aprobados = await pool.query(
      "SELECT usuario_id FROM aprobados_por_etapa where etapa_id=$1",
      [id]
    );

    if (aprobados.rows.length === 0) {
      return res.json({
        message: "No hay usuarios para aprobado en la etapa",
      });
    }

    for (let i = 0; i < aprobados.rows.length; i++) {
      const userAprobado = await pool.query(
        "SELECT id,nombre,mail FROM usuarios WHERE id=$1",
        [aprobados.rows[i].usuario_id]
      );

      if (userAprobado.rows.length === 0) {
        return res.json({
          message: "Error usuario no encontrado",
        });
      }
      const { id, nombre, mail } = userAprobado.rows[0];
      const obj = {
        id: id,
        nombre: nombre,
        mail: mail,
      };
      arrayAprobado.unshift(obj);
    }
    res.json(arrayAprobado);
  } catch (error) {
    console.log(error);
  }
};

const eliminarColaborador = async (req, res) => {
  const { id } = req.params;
  const { userId, rol } = req.body;

  try {
    let result;
    if (rol === "visado") {
      result = await pool.query(
        "DELETE FROM visados_por_etapa WHERE etapa_id=$1 and usuario_id=$2",
        [id, userId]
      );
    } else if (rol === "aprobado") {
      result = await pool.query(
        "DELETE FROM aprobados_por_etapa WHERE etapa_id=$1 and usuario_id=$2",
        [id, userId]
      );
    }

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "No se ha podido eliminar",
      });
    }

    res.json({ msg: "Colaborador eliminado" });
  } catch (error) {
    res.json({ error: error.message });
  }
};

const usersToCheck = async (req, res) => {
  try {
    const { id } = req.params;
    let array = [];
    const etapa = await pool.query(
      "SELECT etapa_actual FROM procesos_ejecutados where id=$1",
      [id]
    );
    const users = await pool.query(
      "SELECT user_id, accion, check_ok FROM users_check where ejecutado_id=$1 and etapa_id=$2",
      [id, etapa.rows[0].etapa_actual]
    );

    if (users.rows.length === 0) {
      return res.json({
        message: "No hay usuarios para visado/aprobado en la etapa",
      });
    }

    for (let i = 0; i < users.rows.length; i++) {
      const userData = await pool.query(
        "SELECT id,nombre,mail FROM usuarios WHERE id=$1",
        [users.rows[i].user_id]
      );

      if (userData.rows.length === 0) {
        return res.json({
          message: "Error usuario no encontrado",
        });
      }
      const { id, nombre, mail } = userData.rows[0];
      const obj = {
        id: id,
        nombre: nombre,
        mail: mail,
        accion: users.rows[i].accion,
        chequeo: users.rows[i].check_ok,
      };
      array.unshift(obj);
    }
    res.json(array);
  } catch (error) {
    console.log(error);
  }
};

const etapaFromExecuted = async (req, res) => {
  try {
    const { id } = req.params;
    const etapaActual = await pool.query(
      "SELECT etapa_actual FROM procesos_ejecutados WHERE id=$1",
      [id]
    );
    const result = await pool.query("SELECT * FROM etapas WHERE id = $1", [
      etapaActual.rows[0].etapa_actual,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Etapa no encontrada",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.json({ error: error.message });
  }
};

const cambiarCheckUser = async (req, res) => {
  const { ejecutado, usuario, accion, etapa } = req.body;
  const ejecutante = req.usuario.rows[0].id;

  if (ejecutante != usuario) {
    const error = new Error("Acción no válida");
    return res.status(401).json({ msg: error.message });
  }

  try {
    const resultado = await pool.query(
      "update users_check set check_ok=$1 where ejecutado_id=$2 and user_id=$3 and etapa_id=$4 and accion=$5 RETURNING *",
      [true, ejecutado, usuario, etapa, accion]
    );

    const proccess = await pool.query(
      "select proceso_id from procesos_ejecutados where id=$1",
      [ejecutado]
    );

    const ingreso = await pool.query(
      "insert into seguimientos (proceso_id,user_id) values ($1,$2)",
      [proccess.rows[0].proceso_id, usuario]
    );

    //Chequeo si queda algun usuario por confirmar
    if (etapa) {
      const allChecked = await pool.query(
        "Select count(*) from users_check where check_ok=$1 and ejecutado_id=$2 and etapa_id=$3",
        [false, ejecutado, etapa]
      );
      if (allChecked.rows[0].count == 0) {
        const sig = await pool.query(
          "select id, proceso_id, nombre, descripcion, prioridad from etapas where anterior_id=$1",
          [etapa]
        );

        //Tiene siguiente
        if (sig.rows.length != 0) {
          const actualizo = await pool.query(
            "update procesos_ejecutados set etapa_actual=$1 where id=$2",
            [sig.rows[0].id, ejecutado]
          );

          //Proceso de ingresar y avisar a usuarios
          const visados = await pool.query(
            "select usuario_id from visados_por_etapa where etapa_id=$1",
            [sig.rows[0].id]
          );
          const aprobados = await pool.query(
            "select usuario_id from aprobados_por_etapa where etapa_id=$1",
            [sig.rows[0].id]
          );
          const procesoE = await pool.query(
            "select titulo from procesos where id = $1",
            [sig.rows[0].proceso_id]
          );
          for (us in visados.rows) {
            const visadosinCheck = await pool.query(
              "insert into users_check (accion,check_ok,ejecutado_id,user_id,etapa_id) values (1,false,$1,$2,$3)",
              [ejecutado, visados.rows[us].usuario_id, sig.rows[0].id]
            );

            const userVisado = await pool.query(
              "select nombre, mail from usuarios where id=$1",
              [visados.rows[us].usuario_id]
            );

            //Enviar email visado
            emailVisado({
              email: userVisado.rows[0].mail,
              nombre: userVisado.rows[0].nombre,
              id: visados.rows[us].usuario_id,
              ejecutado: ejecutado,
              titulo: procesoE.rows[0].titulo,
              etapa: sig.rows[0].nombre,
              descripcion: sig.rows[0].descripcion,
              prioridad: sig.rows[0].prioridad,
              accion: "visado",
            });
          }
          for (us in aprobados.rows) {
            const aprobadosinCheck = await pool.query(
              "insert into users_check (accion,check_ok,ejecutado_id,user_id,etapa_id) values (2,false,$1,$2,$3)",
              [ejecutado, aprobados.rows[us].usuario_id, sig.rows[0].id]
            );

            const userAprobado = await pool.query(
              "select nombre, mail from usuarios where id=$1",
              [aprobados.rows[us].usuario_id]
            );

            //Enviar email aprobado
            emailVisado({
              email: userAprobado.rows[0].mail,
              nombre: userAprobado.rows[0].nombre,
              id: aprobados.rows[us].usuario_id,
              ejecutado: ejecutado,
              titulo: procesoE.rows[0].titulo,
              etapa: sig.rows[0].nombre,
              descripcion: sig.rows[0].descripcion,
              prioridad: sig.rows[0].prioridad,
              accion: "aprobado",
            });
          }
        } else {
          const actualizo = await pool.query(
            "update procesos_ejecutados set finish=true where id=$1",
            [ejecutado]
          );
        }
      }
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    res.json({ error: error.message });
  }
};

module.exports = {
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
  cambiarCheckUser,
};
