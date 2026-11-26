<?php

include ("conexion.php");

$op = isset($_REQUEST['op']) ? $_REQUEST['op'] : '';
$id = isset($_REQUEST['codigo']) ? (int) $_REQUEST['codigo'] : 0;
$nombre = isset($_REQUEST['nombre']) ? trim($_REQUEST['nombre']) : '';


if($op=='I')
{
	$id_usuario = isset($_SESSION['id']) ? (int) $_SESSION['id'] : 0;
	if ($id_usuario <= 0) {
		echo '<div data-ransa-server-response data-ransa-type="error" data-ransa-message="No se pudo identificar al usuario que crea el rol."></div>';
		exit;
	}

	$dbmy->beginTrans();
	$q = "insert into rol(nombre) values(" . $dbmy->qstr($nombre) . ")";
	//echo "<br>".$q;
	
	if(!$eq=$dbmy->Execute($q))
	{
		echo '<div data-ransa-server-response data-ransa-type="error" data-ransa-message="ERROR AL INSERTAR, POR FAVOR COMUNIQUE AL ADMINISTRADOR DEL SISTEMA"></div>';
		$dbmy->RollbackTrans();
		die();
		exit();
	}

	$id_rol = (int) $dbmy->Insert_ID();
	if ($id_rol <= 0) {
		echo '<div data-ransa-server-response data-ransa-type="error" data-ransa-message="No se pudo obtener el identificador del nuevo rol."></div>';
		$dbmy->RollbackTrans();
		exit;
	}

	$q = "insert into rol_usuarios(cod_rol,cod_usuario) values($id_rol,$id_usuario)";
	if (!$dbmy->Execute($q)) {
		echo '<div data-ransa-server-response data-ransa-type="error" data-ransa-message="No se pudo asignar el nuevo rol al usuario creador."></div>';
		$dbmy->RollbackTrans();
		exit;
	}

	$dbmy->CommitTrans();	
}
if($op=='M')
{

	$dbmy->beginTrans();
	$q = "update rol set nombre=" . $dbmy->qstr($nombre) . " where id=$id";
	
	
	if(!$eq=$dbmy->Execute($q))
	{
		echo '<div data-ransa-server-response data-ransa-type="error" data-ransa-message="ERROR AL MODIFICAR, POR FAVOR COMUNIQUE AL ADMINISTRADOR DEL SISTEMA"></div>';
		$dbmy->RollbackTrans();
		die();
		exit();
	}
	$dbmy->CommitTrans();	
}
if($op=='E')
{
	if ($id <= 0) {
		echo '<div data-ransa-server-response data-ransa-type="error" data-ransa-message="El identificador del rol no es válido."></div>';
		exit;
	}

	$dbmy->beginTrans();
	$deletions = array(
		"delete from rol_aplicaciones where cod_rol=$id",
		"delete from rol_usuarios where cod_rol=$id",
		"delete from rol where id=$id"
	);

	foreach ($deletions as $query) {
		if (!$dbmy->Execute($query)) {
			echo '<div data-ransa-server-response data-ransa-type="error" data-ransa-message="No se pudo eliminar el rol y sus asociaciones."></div>';
			$dbmy->RollbackTrans();
			exit;
		}
	}

	$dbmy->CommitTrans();
}

$refresh_sidebar = in_array($op, array('I', 'M', 'E'), true) ? ' data-ransa-refresh-sidebar="true"' : '';
echo '<div data-ransa-server-response data-ransa-type="success" data-ransa-message="Transacción exitosa" data-ransa-reload="roles.php" data-ransa-params="{}"' . $refresh_sidebar . '></div>';
?>