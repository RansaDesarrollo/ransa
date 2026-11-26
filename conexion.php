<?php
session_start();
error_reporting(0);


//error_reporting(E_ALL);
include ("bases_datos/adodb/adodb.inc.php");
include ("bases_datos/usb_defglobales.inc");

if ($_SESSION["autentificado"] != "SI") 
{
	header('Location: login.html?status=session');
	exit;
} 
else 
{  
	$fechaGuardada = $_SESSION["ultimoAcceso"];
    $ahora = date("Y-n-j H:i:s");
    $tiempo_transcurrido = (strtotime($ahora)-strtotime($fechaGuardada));
     if($tiempo_transcurrido >= $tiempo_sesion) {
		session_destroy(); 
		session_unset();
		header('Location: login.html?status=session');
		exit;
	}else {
    $_SESSION["ultimoAcceso"] = $ahora;
	}
} 

$dbmy = NewADOConnection("mysqli");
$ok_conn = @$dbmy->Connect($bd_host, $bd_usuario, $bd_password, $bd_base);
if (!$ok_conn || !$dbmy->_connectionID){
       echo "<br>Error de conexion a la base de datos: " . htmlspecialchars($dbmy->ErrorMsg()) . "<br>";
       exit;
}