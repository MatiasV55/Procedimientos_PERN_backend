const nodemailer = require("nodemailer");

const PRIORIDAD = ["BAJA", "MEDIA", "ALTA"];

const emailVisado = async (datos) => {
  const {
    email,
    nombre,
    id,
    ejecutado,
    titulo,
    etapa,
    descripcion,
    prioridad,
    accion,
  } = datos;

  const transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "08b98af7a2895b",
      pass: "afb85d0c9b10ea",
    },
  });

  //Info del mail

  if (accion == "visado") {
    const info = await transport.sendMail({
      from: '"Sistema de gestión - Administrador de procedimientos" <sistema@uptask.com>',
      to: email,
      subject: "Debes VISAR etapa de procedimiento",
      text: "Revisa la etapa para visado",
      html: `
        <div style ='font-family:sans-serif;'>
        <h2 style = 'color:#025669; font-weight:bold;'>Hola ${nombre}</h2>
  
        <p style='color:#48b4e0;'>
          Estás asignado para visar la siguiente etapa (prioridad ${
            PRIORIDAD[prioridad - 1]
          }) perteneciente al proceso: ${titulo}
        </p>
        <p style='color:#87ceeb; font-weight:bold;'>
          ${etapa} : ${descripcion}
        </p>
        <p style='color:#025669;'>
          Para efectuar tu visado por favor hace <a href='${
            process.env.FRONTEND_URL
          }/en-curso/visado/${ejecutado}/${id}' style='font-weight:bold;'>click aquí.</a>
        </p>      
        </div>
        `,
    });
  } else if (accion == "aprobado") {
    const info = await transport.sendMail({
      from: '"Sistema de gestión - Administrador de procedimientos" <sistema@uptask.com>',
      to: email,
      subject: "Debes APROBAR etapa de procedimiento",
      text: "Revisa la etapa para aprobar",
      html: `
      <div style ='font-family:sans-serif;'>
      <h2 style = 'color:#025669; font-weight:bold;'>Hola ${nombre}</h2>

      <p style='color:#48b4e0;'>
        Estás asignado para aprobar la siguiente etapa (prioridad ${
          PRIORIDAD[prioridad - 1]
        }) perteneciente al proceso: ${titulo}
      </p>
      <p style='color:#87ceeb; font-weight:bold;'>
        ${etapa} : ${descripcion}
      </p>
      <p style='color:#025669;'>
        Para contabilizar tu aprobación por favor hace <a href='${
          process.env.FRONTEND_URL
        }/en-curso/aprobado/${ejecutado}/${id}' style='font-weight:bold;'>click aquí.</a>
      </p>      
      </div>
      `,
    });
  }
};

module.exports = emailVisado;
