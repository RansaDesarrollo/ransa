<?php
include ("conexion.php");

$nombre_usuario = $_SESSION["nombre"] ?? 'Usuario';
$email_usuario = $_SESSION["email"] ?? '';
?>

<section class="m-card" aria-labelledby="cambio-title">
  <!-- ── Card Header ── -->
  <div class="m-card__header d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom">
    <div>
      <h3 class="m-card__title fs-5 fw-bold mb-1" id="cambio-title">
        <i class="fa-solid fa-key text-primary ransa-brand-icon me-2" aria-hidden="true"></i>Cambio de Contraseña
      </h3>
      <p class="m-card__subtitle text-muted mb-0 small">Actualice su clave de acceso al sistema Ransa</p>
    </div>
    <div>
      <span class="badge bg-light text-secondary border px-3 py-2 rounded-pill">
        <i class="fa-solid fa-user-lock me-1"></i> Seguridad de cuenta
      </span>
    </div>
  </div>

  <form name="formCambio" id="formCambio" action="" method="post" onsubmit="return false;">
    <div class="row justify-content-center">
      <div class="col-md-7 col-lg-6">

        <!-- ── Usuario activo banner ── -->
        <div class="card bg-light border-0 shadow-sm p-3 mb-4 rounded-3">
          <div class="d-flex align-items-center">
            <div class="bg-primary text-white ransa-brand-avatar rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0" style="width: 44px; height: 44px; font-weight: 700; font-size: 18px;">
              <?php echo strtoupper(substr($nombre_usuario, 0, 1)); ?>
            </div>
            <div class="overflow-hidden">
              <div class="small text-muted">Sesión iniciada como:</div>
              <div class="fw-bold text-dark text-truncate"><?php echo htmlspecialchars($nombre_usuario); ?></div>
              <?php if (!empty($email_usuario)): ?>
                <div class="small text-muted text-truncate"><?php echo htmlspecialchars($email_usuario); ?></div>
              <?php endif; ?>
            </div>
          </div>
        </div>

        <!-- ── Contraseña actual ── -->
        <div class="form-group mb-3">
          <label for="clave_actual" class="form-label fw-semibold text-dark mb-1">Contraseña actual</label>
          <div class="input-group">
            <span class="input-group-text"><i class="fa-solid fa-lock text-muted"></i></span>
            <input type="password" class="form-control" id="clave_actual" name="clave_actual" placeholder="Ingrese su contraseña actual" autocomplete="current-password" required autofocus>
            <button class="btn btn-toggle-password" type="button" tabindex="-1" title="Mostrar/ocultar contraseña" onclick="togglePassword('clave_actual')">
              <i class="fa-solid fa-eye" id="icon_clave_actual"></i>
            </button>
          </div>
        </div>

        <!-- ── Nueva contraseña ── -->
        <div class="form-group mb-3">
          <label for="clave_nueva" class="form-label fw-semibold text-dark mb-1">Nueva contraseña</label>
          <div class="input-group">
            <span class="input-group-text"><i class="fa-solid fa-key text-muted"></i></span>
            <input type="password" class="form-control" id="clave_nueva" name="clave_nueva" placeholder="Ingrese su nueva contraseña" autocomplete="new-password" required>
            <button class="btn btn-toggle-password" type="button" tabindex="-1" title="Mostrar/ocultar contraseña" onclick="togglePassword('clave_nueva')">
              <i class="fa-solid fa-eye" id="icon_clave_nueva"></i>
            </button>
          </div>
          <div class="form-text text-muted small">
            <i class="fa-solid fa-circle-info me-1"></i> La contraseña debe tener al menos 4 caracteres.
          </div>
        </div>

        <!-- ── Confirmar nueva contraseña ── -->
        <div class="form-group mb-4">
          <label for="clave_confirmar" class="form-label fw-semibold text-dark mb-1">Confirmar nueva contraseña</label>
          <div class="input-group">
            <span class="input-group-text"><i class="fa-solid fa-shield-check text-muted"></i></span>
            <input type="password" class="form-control" id="clave_confirmar" name="clave_confirmar" placeholder="Confirme su nueva contraseña" autocomplete="new-password" required>
            <button class="btn btn-toggle-password" type="button" tabindex="-1" title="Mostrar/ocultar contraseña" onclick="togglePassword('clave_confirmar')">
              <i class="fa-solid fa-eye" id="icon_clave_confirmar"></i>
            </button>
          </div>
        </div>

        <!-- ── Submit button ── -->
        <div class="d-grid gap-2">
          <button type="submit" id="btnCambiarClave" onclick="cambiarClave();" class="btn btn-primary btn-login">
            <i class="fa-solid fa-check-double me-2"></i> Actualizar Contraseña
          </button>
        </div>

      </div>
    </div>
  </form>
</section>
