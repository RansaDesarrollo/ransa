<?php

include ("conexion.php");
$op=$_REQUEST['op'];
$cod_rol=$_REQUEST['cod_rol'];
$cod_aplicacion=$_REQUEST['cod_aplicacion'];


if($op=='I')
{
	$dbmy->beginTrans();
	$q="insert into rol_aplicaciones(cod_rol,cod_aplicacion) values($cod_rol,$cod_aplicacion)";

	
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
		$q="delete from rol_aplicaciones where cod_rol=$cod_rol and cod_aplicacion=$cod_aplicacion";
	
		
		if(!$eq=$dbmy->Execute($q))
		{
			echo '<div data-ransa-server-response data-ransa-type="error" data-ransa-message="ERROR AL ELIMINAR, POR FAVOR COMUNIQUE AL ADMINISTRADOR DEL SISTEMA"></div>';
			$dbmy->RollbackTrans();
			die();
			exit();
		}
		$dbmy->CommitTrans();
	
		
}

echo '<div data-ransa-server-response data-ransa-type="info" data-ransa-message="Asociación actualizada correctamente" data-ransa-reload="roles_aplicaciones.php" data-ransa-params="' . htmlspecialchars(json_encode(['rol' => (int) $cod_rol]), ENT_QUOTES, 'UTF-8') . '" data-ransa-refresh-sidebar="true"></div>';

?>