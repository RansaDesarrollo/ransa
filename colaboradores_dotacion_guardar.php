<?php
header('Content-Type: application/json; charset=utf-8');
include 'conexion.php';

function responder($status, $data)
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function fallar($status, $message)
{
    responder($status, array('message' => $message));
}

function textoOpcional($payload, $field, $maxLength)
{
    if (!array_key_exists($field, $payload) || $payload[$field] === null) {
        return null;
    }
    if (!is_string($payload[$field])) {
        fallar(422, 'El formato del campo ' . $field . ' no es válido.');
    }
    $value = trim($payload[$field]);
    $length = function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
    if ($length > $maxLength) {
        fallar(422, 'El campo ' . $field . ' supera la longitud permitida.');
    }
    return $value === '' ? null : $value;
}

function fechaOpcional($payload, $field)
{
    $value = textoOpcional($payload, $field, 10);
    if ($value === null) {
        return null;
    }
    $date = DateTime::createFromFormat('!Y-m-d', $value);
    $errors = DateTime::getLastErrors();
    if (!$date || $date->format('Y-m-d') !== $value || ($errors && ($errors['warning_count'] || $errors['error_count']))) {
        fallar(422, 'La fecha indicada para ' . $field . ' no es válida.');
    }
    return $value;
}

function listaCatalogo($payload, $field, $allowed, $maxLength, $format)
{
    $values = array_key_exists($field, $payload) ? $payload[$field] : array();
    if (!is_array($values)) {
        fallar(422, 'El formato de ' . $field . ' no es válido.');
    }

    $values = array_values(array_unique($values));
    foreach ($values as $value) {
        if (!is_string($value) || !in_array($value, $allowed, true)) {
            fallar(422, 'Hay una opción no válida en ' . $field . '.');
        }
    }

    $encoded = $format === 'json'
        ? json_encode($values, JSON_UNESCAPED_UNICODE)
        : implode(', ', $values);
    if (strlen($encoded) > $maxLength) {
        fallar(422, 'La selección de ' . $field . ' supera la longitud permitida.');
    }
    return $values ? $encoded : null;
}

function tallaOpcional($payload, $field, $allowed, $maximumItems)
{
    if (!array_key_exists($field, $payload) || $payload[$field] === null) {
        return null;
    }
    if (!is_string($payload[$field])) {
        fallar(422, 'El formato de ' . $field . ' no es válido.');
    }
    $raw = $payload[$field];
    if ($raw === '') {
        return null;
    }
    $values = json_decode($raw, true);
    if (!is_array($values) || count($values) > $maximumItems) {
        fallar(422, 'El formato de ' . $field . ' no es válido.');
    }
    foreach ($values as $value) {
        if (!is_string($value) || !in_array($value, $allowed, true)) {
            fallar(422, 'Hay una talla no válida en ' . $field . '.');
        }
    }
    return json_encode(array_values($values), JSON_UNESCAPED_UNICODE);
}

function ejecutar($db, $sql, $values)
{
    $result = $db->Execute($sql, $values);
    if ($result === false) {
        throw new RuntimeException('Error en operación de base de datos.');
    }
    return $result;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['accion']) && $_GET['accion'] === 'token') {
    if (empty($_SESSION['colaboradores_dotacion_csrf'])) {
        $_SESSION['colaboradores_dotacion_csrf'] = bin2hex(random_bytes(32));
    }
    responder(200, array('csrf_token' => $_SESSION['colaboradores_dotacion_csrf']));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: GET, POST');
    fallar(405, 'Método no permitido.');
}

$csrfToken = isset($_SERVER['HTTP_X_CSRF_TOKEN']) ? $_SERVER['HTTP_X_CSRF_TOKEN'] : '';
if (empty($_SESSION['colaboradores_dotacion_csrf']) || !hash_equals($_SESSION['colaboradores_dotacion_csrf'], $csrfToken)) {
    fallar(403, 'La sesión de seguridad venció. Recarga la página e inténtalo nuevamente.');
}

$contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (int) $_SERVER['CONTENT_LENGTH'] : 0;
if ($contentLength > 3000000) {
    fallar(413, 'La solicitud supera el tamaño permitido.');
}

$rawInput = file_get_contents('php://input');
$payload = json_decode($rawInput, true);
if (json_last_error() !== JSON_ERROR_NONE || !is_array($payload)) {
    fallar(400, 'No se pudo interpretar la información enviada.');
}

$personalFields = array(
    'cedula' => textoOpcional($payload, 'cedula', 20),
    'nombre' => textoOpcional($payload, 'nombre', 150),
    'genero' => textoOpcional($payload, 'genero', 20),
    'nacimiento' => fechaOpcional($payload, 'nacimiento'),
    'edad' => null,
    'ingreso' => fechaOpcional($payload, 'ingreso'),
    'antiguedad' => textoOpcional($payload, 'antiguedad', 50),
    'motivo_retiro' => textoOpcional($payload, 'motivo_retiro', 150),
    'empresa' => textoOpcional($payload, 'empresa', 100),
    'agencia' => textoOpcional($payload, 'agencia', 100),
    'cargo' => textoOpcional($payload, 'cargo', 100),
    'tipo_contrato' => textoOpcional($payload, 'tipo_contrato', 50),
    'gerencia' => textoOpcional($payload, 'gerencia', 100),
    'plataforma' => textoOpcional($payload, 'plataforma', 100),
    'estado' => textoOpcional($payload, 'estado', 20),
    'proceso' => textoOpcional($payload, 'proceso', 100),
    'centro_costo' => textoOpcional($payload, 'centro_costo', 50),
    'nombre_centro_costo' => textoOpcional($payload, 'nombre_centro_costo', 150),
    'tipo_costo' => textoOpcional($payload, 'tipo_costo', 50),
    'funcion' => textoOpcional($payload, 'funcion', 100),
    'jefe_inmediato' => textoOpcional($payload, 'jefe_inmediato', 150)
);

if ($personalFields['cedula'] === null || $personalFields['nombre'] === null) {
    fallar(422, 'La cédula y el nombre del colaborador son obligatorios.');
}

$edad = textoOpcional($payload, 'edad', 3);
if ($edad !== null) {
    if (!ctype_digit($edad) || (int) $edad > 120) {
        fallar(422, 'La edad debe ser un número entre 0 y 120.');
    }
    $personalFields['edad'] = (int) $edad;
}

$requiereTi = textoOpcional($payload, 'requiere_ti', 10);
if ($requiereTi !== null && !in_array($requiereTi, array('SI', 'NO', 'NO APLICA'), true)) {
    fallar(422, 'La selección de requiere TI no es válida.');
}

$tipoEquipoTi = listaCatalogo($payload, 'tipo_equipo_ti', array('All In One', 'Celular', 'Laptop', 'SAP'), 100, 'json');
$tipoDotacionLey = listaCatalogo($payload, 'tipo_dotacion_ley', array(
    'BATA ANTIFLUIDOS', 'BATA POLIESTER', 'BONO DE DOTACIÓN', 'BOTAS', 'CAMISA ADMS MC',
    'CAMISA ADMS ML', 'CAMISETA GRIS MC', 'Casco', 'Chaleco', 'CHANCHON TIPO PILOTO',
    'Chaqueta', 'CHAQUETA TERMICA', 'CHAQUETA TERMICA AZUL CLARO CALIDAD', 'COFIA',
    'Guantes', 'GUANTES AZULES TERMICOS', 'GUANTES FLECCE', 'GUANTES NITRILO', 'JEAN',
    'MEDIAS', 'OVEROL PILOTO NEGRO', 'PANTALON TERMICO', 'Pantalón', 'PASAMONTAÑAS',
    'PIJAMA GRUESA', 'POLO BEIGE MC', 'POLO BEIGE ML', 'POLO VERDE MC', 'POLO VERDE ML',
    'ZAPATONES'
), 255, 'text');

$tallaHombre = tallaOpcional($payload, 'talla_hombre', array(
    'S', 'M', 'L', 'XL', 'XXL', '30', '32', '34', '36', '38', '39', '40', '41', '42', '43', '44'
), 3);
$tallaMujer = tallaOpcional($payload, 'talla_mujer', array('S', 'M', 'L', '35', '36'), 2);
$observaciones = textoOpcional($payload, 'observaciones', 2000);

$firmaId = isset($payload['firma_id']) && is_numeric($payload['firma_id']) ? (int) $payload['firma_id'] : 0;
$firmaBinaria = null;

if ($firmaId > 0) {
    $firmaRow = ejecutar($dbmy, 'SELECT `imagen`, `tipo_mime` FROM `firmas` WHERE `id` = ?', array($firmaId));
    if ($firmaRow->EOF) {
        fallar(422, 'La firma asociada no existe. Dibuja o guarda la firma nuevamente.');
    }
    $firmaBinaria = $firmaRow->fields['imagen'];
} else {
    $firmaData = isset($payload['firma']) && is_string($payload['firma']) ? $payload['firma'] : '';
    if (!preg_match('/^data:(image\/png|image\/jpeg);base64,([A-Za-z0-9+\/=\r\n]+)$/', $firmaData, $matches)) {
        fallar(422, 'La firma debe dibujarse antes de guardar.');
    }
    $firmaBinaria = base64_decode($matches[2], true);
}

if (!is_string($firmaBinaria) || $firmaBinaria === '' || strlen($firmaBinaria) > 2000000) {
    fallar(422, 'La imagen de la firma no es válida o supera el tamaño permitido.');
}
$imageInfo = getimagesizefromstring($firmaBinaria);
if ($imageInfo === false || !in_array($imageInfo[2], array(IMAGETYPE_PNG, IMAGETYPE_JPEG), true)) {
    fallar(422, 'El formato de la firma no es válido.');
}

$fechaFirma = new DateTimeImmutable('now', new DateTimeZone('America/Bogota'));
$personalColumns = array_keys($personalFields);
$quotedColumns = array_map(function ($column) {
    return '`' . $column . '`';
}, $personalColumns);
$personalPlaceholders = implode(', ', array_fill(0, count($personalColumns), '?'));
$updateClauses = array();
foreach (array_slice($personalColumns, 1) as $column) {
    $updateClauses[] = '`' . $column . '` = COALESCE(VALUES(`' . $column . '`), `' . $column . '`)';
}
$personalSql = 'INSERT INTO `personal` (' . implode(', ', $quotedColumns) . ') VALUES (' .
    $personalPlaceholders . ') ON DUPLICATE KEY UPDATE ' . implode(', ', $updateClauses);

$dbmy->StartTrans();
try {
    ejecutar($dbmy, $personalSql, array_values($personalFields));

    $personalRow = ejecutar($dbmy, 'SELECT `cedula` FROM `personal` WHERE `cedula` = ? FOR UPDATE', array($personalFields['cedula']));
    if ($personalRow->EOF) {
        throw new RuntimeException('No se pudo bloquear el registro del colaborador.');
    }

    $deliveryResult = ejecutar(
        $dbmy,
        'SELECT COUNT(*) AS total, COALESCE(MAX(`numero_entrega`), 0) AS max_numero FROM `dotacion` WHERE `cedula` = ?',
        array($personalFields['cedula'])
    );
    $numeroEntrega = max((int) $deliveryResult->fields['total'] + 1, (int) $deliveryResult->fields['max_numero'] + 1);

    ejecutar(
        $dbmy,
        'INSERT INTO `dotacion` (`cedula`, `numero_entrega`, `requiere_ti`, `tipo_equipo_ti`, `tipo_dotacion_ley`, ' .
        '`talla_hombre`, `talla_mujer`, `observaciones`, `firma`, `fecha_firma`, `vigencia_inicio`) ' .
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        array(
            $personalFields['cedula'],
            $numeroEntrega,
            $requiereTi,
            $tipoEquipoTi,
            $tipoDotacionLey,
            $tallaHombre,
            $tallaMujer,
            $observaciones,
            $firmaBinaria,
            $fechaFirma->format('Y-m-d H:i:s'),
            $fechaFirma->format('Y-m-d')
        )
    );
} catch (Throwable $exception) {
    $dbmy->FailTrans();
    $dbmy->CompleteTrans();
    error_log('No fue posible guardar el registro de colaborador y dotación.');
    fallar(500, 'No fue posible guardar el registro. Verifica los datos e inténtalo nuevamente.');
}

if (!$dbmy->CompleteTrans()) {
    error_log('No fue posible confirmar la transacción de colaborador y dotación.');
    fallar(500, 'No fue posible guardar el registro. Inténtalo nuevamente.');
}

responder(201, array(
    'message' => 'Registro guardado.',
    'numero_entrega' => $numeroEntrega,
    'fecha_firma' => $fechaFirma->format('Y-m-d H:i:s'),
    'vigencia_inicio' => $fechaFirma->format('Y-m-d')
));
