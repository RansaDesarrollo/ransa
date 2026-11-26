-- Los registros históricos conservan sus columnas nuevas en NULL.
-- Cada nueva firma guardará la siguiente secuencia de entrega y sus fechas.
ALTER TABLE `dotacion`
  ADD COLUMN `numero_entrega` INT UNSIGNED NULL,
  ADD COLUMN `fecha_firma` DATETIME NULL,
  ADD COLUMN `vigencia_inicio` DATE NULL,
  ADD UNIQUE KEY `uq_dotacion_cedula_entrega` (`cedula`, `numero_entrega`);

-- Tabla base para guardar, listar y verificar firmas electrónicas (base DEMO).
CREATE TABLE IF NOT EXISTS `firmas` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `imagen` MEDIUMBLOB NOT NULL,
  `tipo_mime` VARCHAR(50) NOT NULL,
  `tamano_bytes` INT UNSIGNED NOT NULL,
  `creado_en` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_firmas_creado_en` (`creado_en`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET @colaboradores_app_id = (SELECT COALESCE(MAX(`id`), 0) + 1 FROM `aplicaciones`);
SET @colaboradores_app_order = (SELECT COALESCE(MAX(`orden`), 0) + 1 FROM `aplicaciones`);

INSERT INTO `aplicaciones` (`id`, `nombre`, `url`, `url_imagen`, `orden`, `cod_doc`)
SELECT @colaboradores_app_id, 'Colaboradores y dotación', 'colaboradores_dotacion.html', '', @colaboradores_app_order, 0
WHERE NOT EXISTS (
  SELECT 1 FROM `aplicaciones` WHERE `url` = 'colaboradores_dotacion.html'
);

SET @colaboradores_app_id_actual = (SELECT `id` FROM `aplicaciones` WHERE `url` = 'colaboradores_dotacion.html' LIMIT 1);

INSERT INTO `rol_aplicaciones` (`cod_rol`, `cod_aplicacion`)
SELECT 1, @colaboradores_app_id_actual
WHERE EXISTS (SELECT 1 FROM `rol` WHERE `id` = 1)
  AND @colaboradores_app_id_actual IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `rol_aplicaciones` WHERE `cod_rol` = 1 AND `cod_aplicacion` = @colaboradores_app_id_actual
  );
