<?php
include ("conexion.php");

$cod_rol = isset($_REQUEST['rol']) ? (int) $_REQUEST['rol'] : 0;

?>
 
<form name="form" id="form" class="ransa-association-form" action="" method="post" onsubmit="return false;">
<input type="hidden" name="op" id="op">
<section class="ransa-association" aria-labelledby="ransa-association-title">
<header class="ransa-association__header">
	<h2 class="ransa-association__title" id="ransa-association-title">Asociación de aplicaciones a roles</h2>
</header>

<div class="ransa-association__filters tw-grid tw-grid-cols-1 tw-gap-4">
	<div class="ransa-association__field">
		<label for="rol"><?php echo htmlentities('Seleccione el rol');?></label>
		<select name="rol" id="rol" required class="form-control">
		<option value="">-Seleccione-</option>
	<?php
	$query="select * from rol order by nombre";
	$equery=$dbmy->Execute($query);
	$fquery=$equery->RecordCount();
	for ($i=0;$i<$fquery;$i++){
	
		$codigo=$equery->fields['id'];
		$nombre=$equery->fields['nombre'];
	
		if($cod_rol==$codigo)
		{
			echo "
			<option value='$codigo' selected>".utf8_encode($nombre)."</option>
			";
		}
		else
		{
			echo "
			<option value='$codigo'>".utf8_encode($nombre)."</option>
			";
		}
		
		
		$equery->MoveNext();
	}
	?>
	
	</select>
	</div>
	<button type="submit" name="bt1" id="bt1" value="Consultar" title="Consultar aplicaciones del rol" onclick="consultar();" class="btn btn-primary color_botton1">
		<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> Consultar
	</button>
</div>

<?php
if ($cod_rol > 0)
{
?>
	<div class="ransa-association__search">
		<label class="visually-hidden" for="myInput">Buscar aplicación</label>
		<input type="search" id="myInput" onkeyup="myFunction()" placeholder="Buscar aplicación…" class="form-control">
	</div>

	<div class="table-responsive ransa-table-scroll">
	<table id="myTable" class="table table-hover align-middle mb-0">
		<thead>
			<tr>
				<th scope="col">#</th>
				<th scope="col">Aplicación</th>
				<th scope="col">Asignada</th>
			</tr>
		</thead>
		<tbody>
	
	<?php

	$q1="select id,nombre from aplicaciones order by nombre ";
	$eq1=$dbmy->Execute($q1);
	$fq1=$eq1->RecordCount();
	$j = 0;

	for ($i=0;$i<$fq1;$i++){
		
		$j=$i+1;	
		$codigo_b=$eq1->fields['id'];
		$nombre_b=$eq1->fields['nombre'];
		
		$q="select * from rol_aplicaciones  where cod_rol=$cod_rol and cod_aplicacion=$codigo_b";
		$eq=$dbmy->Execute($q);
		$fq=$eq->RecordCount();
	?>

	<tr>
		<td align=center><?php  echo $j;?></td>
		<td ><?php echo $nombre_b;?></td>
		<?php
		if($fq==0)
		{
		?>
			<td>
			<input type='checkbox' name='ck<?php echo $j;?>' id='ck<?php echo $j;?>' value='<?php echo $codigo_b;?>' onclick="actualizar('ck<?php echo $j;?>',<?php echo $codigo_b;?>,<?php echo $cod_rol;?>);">
			</td>
		<?php
		}
		else
		{
		?>
			<td>
			<input type='checkbox' name='ck<?php echo $j;?>' id='ck<?php echo $j;?>' value='<?php echo $codigo_b;?>' onclick="actualizar('ck<?php echo $j;?>',<?php echo $codigo_b;?>,<?php echo $cod_rol;?>);" checked>
			</td>
		<?php
		}
		?>	
	</tr>
	<?php	
		$eq1->MoveNext();
	}	
	?>
		</tbody>
		<tfoot>
			<tr>
				<td colspan="3" class="text-end"><?php echo $j.' Registros existentes'?></td>
			</tr>
		</tfoot>
	</table>
	</div>
<?php
}
?>	
</section>
</form>

