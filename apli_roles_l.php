<?php

include ("conexion.php");

$op=$_REQUEST['op'];
$cod_rol=$_REQUEST['cod_rol'];
$cod_usuario=$_REQUEST['cod_usuario'];


if($op=='I')
{
	$dbmy->beginTrans();
	$q="insert into rol_usuarios(cod_rol,cod_usuario) values($cod_rol,$cod_usuario)";

	
	if(!$eq=$dbmy->Execute($q))
	{
		echo '<div data-ransa-server-response data-ransa-type="error" data-ransa-message="ERROR AL INSERTAR, POR FAVOR COMUNIQUE AL ADMINISTRADOR DEL SISTEMA"></div>';
		$dbmy->RollbackTrans();
		die();
		exit();
	}
	$dbmy->CommitTrans();	
}

if($op=='E')
{
		$dbmy->beginTrans();
		$q="delete from rol_usuarios where cod_rol=$cod_rol and cod_usuario=$cod_usuario";
		
		
		if(!$eq=$dbmy->Execute($q))
		{
			echo '<div data-ransa-server-response data-ransa-type="error" data-ransa-message="ERROR AL ELIMINAR, POR FAVOR COMUNIQUE AL ADMINISTRADOR DEL SISTEMA"></div>';
			$dbmy->RollbackTrans();
			die();
			exit();
		}
		$dbmy->CommitTrans();
	
		
}

$refresh_sidebar = isset($_SESSION['id']) && (int) $_SESSION['id'] === (int) $cod_usuario ? ' data-ransa-refresh-sidebar="true"' : '';
echo '<div data-ransa-server-response data-ransa-type="info" data-ransa-message="Asignación de usuario actualizada" data-ransa-reload="apli_roles.php" data-ransa-params="' . htmlspecialchars(json_encode(['rol' => (int) $cod_usuario]), ENT_QUOTES, 'UTF-8') . '"' . $refresh_sidebar . '></div>';


?>