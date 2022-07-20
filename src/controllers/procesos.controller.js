const emailVisado = require("../helpers/emails.js");

const pool = require("../db");

//FUNCIONES PARA LOS PROCESOS

const obtenerProcesos = async (req, res) => {
  try {
    const procesos = await pool.query("SELECT * FROM procesos");
    res.json(procesos.rows);
  } catch (error) {
    res.json({ error: error.message });
  }
};

const nuevoProceso = async (req, res) => {
  const { titulo, descripcion, etapas } = req.body; //Obtengo lo que envia el cliente
  const creador = req.usuario.rows[0].id;

  try {
    const resultado = await pool.query(
      "INSERT INTO procesos (titulo, descripcion, creador_id, cantidad_etapas)  VALUES ($1, $2, $3, $4) RETURNING *",
      [titulo, descripcion, creador, etapas]
    ); //Peticion a la base
    let sig = null;
    let ant = null;
    for (let exP = 0; exP < etapas; exP++) {
      const añadoEtapa = await pool.query(
        "INSERT INTO etapas (nombre,descripcion,prioridad,proceso_id,siguiente_id,anterior_id) values ($1,$2,$3,$4,$5,$6) RETURNING *",
        [
          "Nombre por defecto",
          "Descripción por defecto",
          1,
          resultado.rows[0].id,
          sig,
          ant,
        ]
      );
      //Me fijo por la anterior para setearle el siguiente_id
      const buscoAnterior = await pool.query(
        "select * from etapas where id=$1",
        [añadoEtapa.rows[0].anterior_id]
      );

      if (buscoAnterior.rows.length !== 0) {
        const updateSiguiente = await pool.query(
          "UPDATE etapas set siguiente_id=$1 where id=$2",
          [añadoEtapa.rows[0].id, buscoAnterior.rows[0].id]
        );
      }
      ant = añadoEtapa.rows[0].id;
    }

    res.json(resultado.rows[0]); //Devuelvo al cliente lo insertado
  } catch (error) {
    res.json({ error: error.message });
  }
};

const obtenerProceso = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM procesos WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Proceso no encontrado",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.json({ error: error.message });
  }
};

const editarProceso = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion } = req.body;
    const creador = req.usuario.rows[0].id;

    const auth = await pool.query(
      "select * from procesos where id = $1 and creador_id=$2",
      [id, creador]
    );
    //NO es el creador del proceso
    if (auth.rowCount === 0) {
      const error = new Error("Acción no válida");
      return res.status(401).json({ msg: error.message });
    }

    const result = await pool.query(
      "UPDATE procesos SET titulo=$1, descripcion=$2 WHERE id=$3 RETURNING *",
      [titulo, descripcion, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Proceso no encontrado",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.json({ error: error.message });
  }
};

const eliminarProceso = async (req, res) => {
  const { id } = req.params;

  const creador = req.usuario.rows[0].id;

  const auth = await pool.query(
    "select * from procesos where id = $1 and creador_id=$2",
    [id, creador]
  );
  //NO es el creador del proceso
  if (auth.rowCount === 0) {
    const error = new Error("Acción no válida");
    return res.status(401).json({ msg: error.message });
  }

  try {
    const result = await pool.query("DELETE FROM procesos WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Proceso no encontrado",
      });
    }

    const deleteEtapas = await pool.query(
      "DELETE from etapas where proceso_id=$1",
      [id]
    );

    res.json({ msg: "Procedimiento eliminado" });
  } catch (error) {
    res.json({ error: error.message });
  }
};

const etapasProceso = async (req, res) => {
  const { id } = req.params;
  const creador = req.usuario.rows[0].id;
  try {
    const result = await pool.query(
      "SELECT * FROM etapas WHERE proceso_id = $1 order by 1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Etapas no encontradas",
      });
    }

    res.json(result.rows);
  } catch (error) {
    res.json({ error: error.message });
  }
};

const iniciarProceso = async (req, res) => {
  const { id } = req.params;
  const ejecutante = req.usuario.rows[0].id;
  const obj = {
    procesoId: id,
    ejecutante: ejecutante,
  };
  try {
    const etapaInicial = await pool.query(
      "select id, nombre, descripcion, prioridad from etapas where proceso_id=$1 and anterior_id is null",
      [id]
    );
    const initProceso = await pool.query(
      "insert into procesos_ejecutados (user_id,proceso_id,etapa_actual,finish) values ($1,$2,$3,false) RETURNING *",
      [ejecutante, id, etapaInicial.rows[0].id]
    );
    const visados = await pool.query(
      "select usuario_id from visados_por_etapa where etapa_id=$1",
      [etapaInicial.rows[0].id]
    );
    const aprobados = await pool.query(
      "select usuario_id from aprobados_por_etapa where etapa_id=$1",
      [etapaInicial.rows[0].id]
    );
    const procesoE = await pool.query(
      "select titulo from procesos where id = $1",
      [id]
    );
    for (us in visados.rows) {
      const visadosinCheck = await pool.query(
        "insert into users_check (accion,check_ok,ejecutado_id,user_id,etapa_id) values (1,false,$1,$2,$3)",
        [
          initProceso.rows[0].id,
          visados.rows[us].usuario_id,
          etapaInicial.rows[0].id,
        ]
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
        ejecutado: initProceso.rows[0].id,
        titulo: procesoE.rows[0].titulo,
        etapa: etapaInicial.rows[0].nombre,
        descripcion: etapaInicial.rows[0].descripcion,
        prioridad: etapaInicial.rows[0].prioridad,
        accion: "visado",
      });
    }
    for (us in aprobados.rows) {
      const aprobadosinCheck = await pool.query(
        "insert into users_check (accion,check_ok,ejecutado_id,user_id,etapa_id) values (2,false,$1,$2,$3)",
        [
          initProceso.rows[0].id,
          aprobados.rows[us].usuario_id,
          etapaInicial.rows[0].id,
        ]
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
        ejecutado: initProceso.rows[0].id,
        titulo: procesoE.rows[0].titulo,
        etapa: etapaInicial.rows[0].nombre,
        descripcion: etapaInicial.rows[0].descripcion,
        prioridad: etapaInicial.rows[0].prioridad,
        accion: "aprobado",
      });
    }
    res.json(obj);
  } catch (error) {
    res.json("Mensaje de error");
  }
};

const obtenerEnCurso = async (req, res) => {
  const usuarioId = req.usuario.rows[0].id;
  try {
    const result = await pool.query(
      "select p.id, p.titulo, p.descripcion, e.nombre, e.id as etapaID, e.prioridad, pe.id as ejecutadoid from procesos p, etapas e, procesos_ejecutados pe where pe.finish is false and pe.user_id=$1 and pe.proceso_id = p.id and pe.etapa_actual = e.id",
      [usuarioId]
    );

    const result2 = await pool.query(
      "select distinct p.id, p.titulo, p.descripcion, e.nombre, e.id as etapaID, e.prioridad, pe.id as ejecutadoid from procesos p, etapas e, procesos_ejecutados pe, seguimientos s where pe.finish is false and pe.proceso_id = p.id and pe.etapa_actual = e.id and p.id=s.proceso_id and s.user_id=$1",
      [usuarioId]
    );

    if (result.rows.length === 0 && result2.rows.length === 0) {
      return res.status(404).json({
        message: "No posee procedimientos en curso",
      });
    }

    if (result.rows.length != 0) {
      for (resultados in result.rows) {
        for (resultados2 in result2.rows) {
          if (resultados.ejecutadoid != resultados2.ejecutadoid) {
            result.rows = result.rows.push(resultados2);
          }
        }
      }
    } else {
      result.rows = result.rows.concat(result2.rows);
    }

    res.json(result.rows);
  } catch (error) {
    res.json({ error: error.message });
  }
};

module.exports = {
  obtenerProcesos,
  nuevoProceso,
  obtenerProceso,
  editarProceso,
  eliminarProceso,
  etapasProceso,
  iniciarProceso,
  obtenerEnCurso,
};
