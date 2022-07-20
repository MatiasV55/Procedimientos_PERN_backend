CREATE DATABASE sistema_pern

CREATE TABLE procesos(
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) UNIQUE,
    descripcion VARCHAR(255),
    creador_id int
    cantidad_etapas int
);

CREATE TABLE etapas(
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255),
    descripcion VARCHAR(255),
    prioridad int,
    proceso_id int,
    siguiente_id int,
    anterior_id int
);

CREATE TABLE usuarios(
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255),
    mail VARCHAR(255),
    pass VARCHAR(255)
);

CREATE TABLE visados_por_etapa(
    id SERIAL PRIMARY KEY,
    etapa_id int,
    usuario_id int
);

CREATE TABLE aprobados_por_etapa(
    id SERIAL PRIMARY KEY,
    etapa_id int,
    usuario_id int
);

