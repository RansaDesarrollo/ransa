<?php
include ("conexion.php");

$cod = isset($_REQUEST['cod']) ? trim($_REQUEST['cod']) : '';
$id_a = '';
$nombre_a = '';

if ($cod != '') {
    $cod_clean = intval($cod);
    $q = "select * from rol where id=$cod_clean";
    $eq = $dbmy->Execute($q);
    if ($eq && $eq->RecordCount() > 0) {
        $id_a = $eq->fields['id'];
        $nombre_a = $eq->fields['nombre'];
    }
}
?>

<section class="m-card" aria-labelledby="roles-title">
  <!-- ── Card Header ── -->
  <div class="m-card__header d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom">
    <div>
      <h3 class="m-card__title fs-5 fw-bold mb-1" id="roles-title">
        <i class="fa-solid fa-user-shield text-primary me-2"></i>Gestión de Roles de Usuario
      </h3>
      <p class="m-card__subtitle text-muted mb-0 small">Administre, asigne y actualice los roles del sistema</p>
    </div>
    <?php if ($cod != '' && $nombre_a != ''): ?>
    <div>
      <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill fs-6">
        <i class="fa-solid fa-circle-dot me-1 text-primary"></i> Editando rol: <strong><?php echo htmlspecialchars($nombre_a); ?></strong>
      </span>
    </div>
    <?php endif; ?>
  </div>

  <form name="form" id="form" action="" method="post" onsubmit="return false;">
    <input type="hidden" name="op" id="op">
    <input type="hidden" name="codigo" id="codigo" value="<?php echo htmlspecialchars($id_a); ?>">

    <?php if ($cod != '' && $nombre_a != ''): ?>
    <!-- ── Indicador visual de rol seleccionado ── -->
    <div class="alert alert-primary d-flex align-items-center justify-content-between py-2 px-3 mb-4 rounded-3 border-0 shadow-sm" style="background: #e7f5ec;" id="selected-role-alert">
      <div class="d-flex align-items-center">
        <span class="badge bg-primary me-2 px-2 py-1"><i class="fa-solid fa-check me-1"></i> Rol Seleccionado</span>
        <span class="text-dark">Está modificando el rol: <strong class="text-primary fs-6"><?php echo htmlspecialchars($nombre_a); ?></strong> <span class="text-muted small ms-1">(ID: <?php echo htmlspecialchars($id_a); ?>)</span></span>
      </div>
      <button type="button" class="btn btn-sm btn-outline-secondary bg-white" onclick="restablecer();" title="Cancelar selección y volver a modo creación">
        <i class="fa-solid fa-xmark me-1"></i> Deseleccionar
      </button>
    </div>
    <?php endif; ?>

    <!-- ── Form: role name input ── -->
    <div class="row mb-3">
      <div class="col-md-8 offset-md-2">
        <label class="form-label fw-semibold text-dark mb-1" for="nombre">Nombre del rol</label>
        <div class="input-group">
          <span class="input-group-text"><i class="fa-solid fa-tag text-muted"></i></span>
          <input type="text" name="nombre" id="nombre" value="<?php echo htmlspecialchars($nombre_a); ?>" class="form-control" placeholder="Escriba el nombre del rol…" required autofocus>
        </div>
      </div>
    </div>

    <!-- ── Action Buttons ── -->
    <div class="row mb-4">
      <div class="col-md-8 offset-md-2">
        <div class="tw-flex tw-flex-wrap tw-items-center tw-justify-center tw-gap-2">
        <?php if ($cod != ''): ?>
          <button type="button" name="bt2" id="bt2" title="De clic para Restablecer" onclick="restablecer();" class="btn btn-outline-secondary px-3">
            <i class="fa-solid fa-rotate-left me-1"></i> Restablecer
          </button>
          <button type="submit" name="bt3" id="bt3" title="De clic para Modificar" onclick="modificar();" class="btn btn-primary px-3">
            <i class="fa-solid fa-floppy-disk me-1"></i> Guardar Cambios
          </button>
          <button type="submit" name="bt4" id="bt4" title="De clic para Eliminar" onclick="eliminar();" class="btn btn-danger px-3">
            <i class="fa-solid fa-trash-can me-1"></i> Eliminar
          </button>
        <?php else: ?>
          <button type="submit" name="bt1" id="bt1" title="De clic para Insertar" onclick="insertar();" class="btn btn-primary px-4">
            <i class="fa-solid fa-plus me-1"></i> Insertar Rol
          </button>
        <?php endif; ?>
        </div>
      </div>
    </div>

    <!-- ── Search ── -->
    <div class="row mb-3">
      <div class="col-12">
        <div class="input-group">
          <span class="input-group-text"><i class="fa-solid fa-magnifying-glass text-muted"></i></span>
          <input type="text" id="myInput" onkeyup="myFunction()" placeholder="Buscar rol por nombre…" class="form-control">
        </div>
      </div>
    </div>

    <!-- ── Table ── -->
    <div class="table-responsive rounded-3 border">
      <table id="myTable" class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th class="text-center text-secondary small text-uppercase" style="width: 60px;">#</th>
            <th class="text-secondary small text-uppercase">Nombre del Rol</th>
            <th class="text-center text-secondary small text-uppercase" style="width: 160px;">Estado</th>
            <th class="text-center text-secondary small text-uppercase" style="width: 140px;">Acciones</th>
          </tr>
        </thead>
        <tbody>
        <?php
        $q = "select * from rol order by nombre";
        $eq = $dbmy->Execute($q);
        $fq = $eq ? $eq->RecordCount() : 0;
        $j = 0;

        for ($i = 0; $i < $fq; $i++) {
            $j = $i + 1;
            $codigo_b = $eq->fields['id'];
            $nombre_b = $eq->fields['nombre'];
            $isSelected = ($cod != '' && $cod == $codigo_b);
        ?>
          <tr <?php if ($isSelected) echo 'class="table-primary fw-semibold" style="border-left: 4px solid var(--m-accent);"'; ?>>
            <td class="text-center text-muted"><?php echo $j; ?></td>
            <td>
              <span class="d-inline-flex align-items-center">
                <i class="fa-solid fa-shield-halved me-2 <?php echo $isSelected ? 'text-primary' : 'text-muted'; ?>"></i>
                <?php echo htmlspecialchars($nombre_b); ?>
              </span>
            </td>
            <td class="text-center">
              <?php if ($isSelected): ?>
                <span class="badge bg-primary px-2 py-1"><i class="fa-solid fa-check me-1"></i> Seleccionado</span>
              <?php else: ?>
                <span class="badge bg-light text-secondary border">Disponible</span>
              <?php endif; ?>
            </td>
            <td class="text-center">
              <?php if ($isSelected): ?>
                <button type="button" class="btn btn-sm btn-primary active shadow-sm" title="Rol actualmente en edición" onclick="ver(<?php echo $codigo_b; ?>)">
                  <i class="fa-solid fa-pen-to-square me-1"></i> Editando
                </button>
              <?php else: ?>
                <button type="button" class="btn btn-sm btn-outline-primary" title="Seleccionar este rol" onclick="ver(<?php echo $codigo_b; ?>)">
                  <i class="fa-solid fa-pen-to-square me-1"></i> Seleccionar
                </button>
              <?php endif; ?>
            </td>
          </tr>
        <?php
            $eq->MoveNext();
        }
        ?>
        </tbody>
        <tfoot class="table-light">
          <tr>
            <td colspan="4" class="text-end py-2 px-3">
              <span class="badge bg-secondary-subtle text-secondary border px-3 py-2 rounded-pill">
                <i class="fa-solid fa-database me-1"></i> <?php echo $j; ?> Registros existentes
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

  </form>
</section>
