<?php
declare(strict_types=1);

require_once __DIR__ . '/conexion.php';

function responderFirma(int $status, array $data): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// GET sin ID: devuelve solo los datos necesarios para llenar la lista.
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !isset($_GET['id'])) {
    $consulta = $dbmy->Execute(
        'SELECT id, tipo_mime, tamano_bytes, creado_en
         FROM firmas
         ORDER BY creado_en DESC, id DESC'
    );

    if ($consulta === false) {
        responderFirma(500, ['ok' => false, 'mensaje' => 'No se pudo cargar la lista.']);
    }

    $firmas = [];
    while (!$consulta->EOF) {
        $firmas[] = [
            'id' => (int) $consulta->fields['id'],
            'tipo_mime' => (string) $consulta->fields['tipo_mime'],
            'tamano_bytes' => (int) $consulta->fields['tamano_bytes'],
            'creado_en' => (string) $consulta->fields['creado_en'],
        ];
        $consulta->MoveNext();
    }

    responderFirma(200, ['ok' => true, 'firmas' => $firmas]);
}

// GET con ID: devuelve la imagen para mostrarla o descargarla.
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
    if (!$id || $id < 1) {
        responderFirma(400, ['ok' => false, 'mensaje' => 'ID no valido.']);
    }

    $consulta = $dbmy->Execute('SELECT imagen, tipo_mime FROM firmas WHERE id = ?', [$id]);
    if ($consulta === false) {
        responderFirma(500, ['ok' => false, 'mensaje' => 'No se pudo obtener la firma.']);
    }

    if ($consulta->EOF) {
        responderFirma(404, ['ok' => false, 'mensaje' => 'La firma no existe.']);
    }

    $imagen = $consulta->fields['imagen'];
    $tipoMime = $consulta->fields['tipo_mime'];

    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    header('Content-Type: ' . $tipoMime);
    header('Content-Disposition: inline; filename="firma-electronica-' . $id . '.png"');
    header('Content-Length: ' . strlen($imagen));
    echo $imagen;
    exit;
}

// Solo se acepta POST para guardar una nueva firma.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responderFirma(405, ['ok' => false, 'mensaje' => 'Metodo no permitido.']);
}

// El navegador envía la imagen como texto Base64 dentro de un JSON.
$entrada = json_decode(file_get_contents('php://input'), true);
$firma = is_array($entrada) ? ($entrada['firma'] ?? '') : '';
if (!is_string($firma) || !preg_match(
    '/^data:(image\/png|image\/jpeg);base64,([A-Za-z0-9+\/=\r\n]+)$/',
    $firma,
    $partes
)) {
    responderFirma(422, ['ok' => false, 'mensaje' => 'Imagen Base64 no valida.']);
}

// Se quita el prefijo Base64 y se guardan los bytes reales en el BLOB.
$imagen = base64_decode($partes[2], true);
if ($imagen === false || $imagen === '') {
    responderFirma(422, ['ok' => false, 'mensaje' => 'La imagen esta vacia.']);
}

$tipoMime = $partes[1];
$tamanoBytes = strlen($imagen);

$stmt = mysqli_prepare(
    $dbmy->_connectionID,
    'INSERT INTO firmas (imagen, tipo_mime, tamano_bytes) VALUES (?, ?, ?)'
);

if (!$stmt) {
    responderFirma(500, ['ok' => false, 'mensaje' => 'No se pudo guardar la firma.']);
}

$null = null;
mysqli_stmt_bind_param($stmt, 'bsi', $null, $tipoMime, $tamanoBytes);
mysqli_stmt_send_long_data($stmt, 0, $imagen);
$ok = mysqli_stmt_execute($stmt);
$nuevoId = (int) mysqli_insert_id($dbmy->_connectionID);
mysqli_stmt_close($stmt);

if (!$ok || $nuevoId <= 0) {
    responderFirma(500, ['ok' => false, 'mensaje' => 'No se pudo guardar la firma.']);
}

responderFirma(201, [
    'ok' => true,
    'mensaje' => 'Firma guardada correctamente.',
    'id' => $nuevoId,
]);
