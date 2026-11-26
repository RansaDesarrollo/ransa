<?php
include ("conexion.php");

$id_usuario=$_SESSION["id"];
$datos_usuario=$_SESSION["nombre"];
$email=$_SESSION["email"];

function renderRoleMenu($dbmy, $id_usuario, $mobile = false)
{
	$id_usuario = (int) $id_usuario;
	$list_class = $mobile ? 'navbar-mobile__list list-unstyled' : 'list-unstyled navbar__list';
	$item_class = $mobile ? 'has-sub' : 'active has-sub';
	$link_class = $mobile ? 'js-arrow' : 'js-arrow open';
	$sub_list_class = $mobile
		? 'navbar-mobile-sub__list list-unstyled js-sub-list'
		: 'list-unstyled navbar__sub-list js-sub-list ransa-open-submenu';

	echo '<ul class="' . $list_class . '">';

	$roles = $dbmy->Execute("select r.id, r.nombre from rol r, rol_usuarios u where u.cod_rol=r.id and u.cod_usuario=$id_usuario ORDER BY r.nombre");
	if (!$roles) {
		echo '<li class="menu-load-error">No se pudieron cargar los roles.</li></ul>';
		return;
	}

	for ($i = 0, $count = $roles->RecordCount(); $i < $count; $i++) {
		$role_id = (int) $roles->fields['id'];
		$role_name = htmlspecialchars($roles->fields['nombre'], ENT_QUOTES, 'UTF-8');
		echo '<li class="' . $item_class . '"><a class="' . $link_class . '" href="#"><i class="fa-solid fa-tachometer-alt" aria-hidden="true"></i>' . $role_name . '</a>';
		echo '<ul class="' . $sub_list_class . '">';

		$applications = $dbmy->Execute("select a.id, a.nombre, a.url from aplicaciones a, rol_aplicaciones r where r.cod_aplicacion=a.id and r.cod_rol=$role_id ORDER BY a.nombre");
		if (!$applications) {
			echo '<li class="menu-load-error"><span>No se pudieron cargar las aplicaciones.</span></li>';
		} else {
			for ($j = 0, $app_count = $applications->RecordCount(); $j < $app_count; $j++) {
				$application_url = trim($applications->fields['url']);
				$application_path = parse_url($application_url, PHP_URL_PATH);
				if ($application_path && strcasecmp(basename($application_path), 'cambio.php') === 0) {
					$applications->MoveNext();
					continue;
				}

				$app_name = htmlspecialchars($applications->fields['nombre'], ENT_QUOTES, 'UTF-8');
				$app_url = htmlspecialchars($application_url, ENT_QUOTES, 'UTF-8');
				echo '<li><a href="#" class="js-app-link ransa-app-link" data-app-url="' . $app_url . '">' . $app_name . '</a></li>';
				$applications->MoveNext();
			}
		}

		echo '</ul></li>';
		$roles->MoveNext();
	}

	echo '</ul>';
}

if (isset($_GET['fragment']) && $_GET['fragment'] === 'sidebar') {
	renderRoleMenu($dbmy, $id_usuario, isset($_GET['mode']) && $_GET['mode'] === 'mobile');
	exit;
}


?>

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
    <meta name="generator" content="CoolAdmin 3.5.0"/>
    <meta name="description" content="Sales pipeline dashboard with deals funnel, top reps, and source attribution."/>
    <title>Aplicaciones Ransa</title>
    <meta property="og:type" content="website"/>
    <meta property="og:title" content="Sales pipeline | CoolAdmin Bootstrap 5 Admin Dashboard"/>
    <meta property="og:description" content="Sales pipeline dashboard with deals funnel, top reps, and source attribution."/>
    <meta property="og:image" content="screenshots/cooladmin-bootstrap-dashboard-2.png"/>
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="Sales pipeline | CoolAdmin Bootstrap 5 Admin Dashboard"/>
    <meta name="twitter:description" content="Sales pipeline dashboard with deals funnel, top reps, and source attribution."/>
    <meta name="theme-color" content="#009A3F"/>
    <link href="css/font-face.css" rel="stylesheet" media="all"/>
    <link rel="preconnect" href="https://rsms.me/"/>
    <link rel="stylesheet" href="https://rsms.me/inter/inter.css"/>
    <link href="vendor/fontawesome-7.3.1/css/all.min.css" rel="stylesheet" media="all"/>
    <link href="vendor/bootstrap-5.3.8.min.css" rel="stylesheet" media="all"/>
    <link href="vendor/css-hamburgers/hamburgers.min.css" rel="stylesheet" media="all"/>
    <link href="css/theme.css" rel="stylesheet" media="all"/>
    <link href="css/app.css?v=<?php echo filemtime(__DIR__ . '/css/app.css'); ?>" rel="stylesheet" media="all"/>
    <link href="css/tailwind.css" rel="stylesheet" media="all"/>
	
	
	
  </head>
  <body class="app ransa-workspace"><a class="visually-hidden-focusable skip-link" href="#main-content">Skip to main content</a>
    <div class="page-wrapper">
      <header class="header-mobile d-block d-lg-none">
        <div class="header-mobile__bar">
          <div class="container-fluid">
            <div class="header-mobile-inner"><a class="logo" href="contexto.php" aria-label="Ransa inicio"><img src="images/brand/ransa-mark.png" alt="Ransa"></a>
              <button class="hamburger hamburger--slider" type="button" aria-label="Toggle navigation"><span class="hamburger-box"><span class="hamburger-inner"></span></span></button>
            </div>
          </div>
        </div>
        <nav class="navbar-mobile">
          <div class="container-fluid" id="mobile-sidebar-roles"><?php renderRoleMenu($dbmy, $id_usuario, true); ?></div>
        </nav>
      </header>
	  
      <aside class="menu-sidebar" id="main-sidebar">
        <div class="logo"><a class="logo-link" href="contexto.php" aria-label="Ransa inicio"><img class="logo-mark" src="images/brand/ransa-mark.png" alt="" aria-hidden="true"><span class="logo-text">Ransa</span></a>
          <button class="sidebar-close js-sidebar-toggle" type="button" aria-label="Close navigation"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
        </div>
        <div class="menu-sidebar__content js-scrollbar1">
          <nav class="navbar-sidebar" id="sidebar-roles">
            <?php renderRoleMenu($dbmy, $id_usuario); ?>
          </nav>
        </div>
      </aside>
      <div class="page-container">
        <header class="header-desktop">
          <div class="section__content section__content--p30">
            <div class="container-fluid">
              <div class="header-wrap tw-grid tw-items-center tw-min-w-0 tw-w-full">
                <button class="sidebar-toggle js-sidebar-toggle" type="button" aria-label="Abrir o cerrar el menú" aria-expanded="false" aria-controls="main-sidebar"><i class="fa-solid fa-bars" aria-hidden="true"></i></button>
                <form class="form-header ransa-search-form tw-flex tw-items-center tw-w-full tw-min-w-0" role="search">
                  <i class="fa-solid fa-magnifying-glass form-header__icon" aria-hidden="true"></i>
                  <input class="au-input au-input--xl" type="search" name="search" placeholder="Buscar roles o módulos…" aria-label="Buscar roles o módulos" autocomplete="off">
                  <kbd class="form-header__hint" aria-hidden="true">Ctrl+K</kbd>
                </form>
                <div class="header-button tw-flex tw-items-center tw-justify-end">
                  <div class="account-wrap">
                    <div class="account-item clearfix js-item-menu" role="button" tabindex="0" aria-haspopup="true" aria-expanded="false" aria-controls="account-dropdown" aria-label="Cuenta de <?php echo htmlspecialchars($datos_usuario, ENT_QUOTES, 'UTF-8'); ?>">
                      <div class="content"><span class="js-acc-btn"><?php echo htmlspecialchars($datos_usuario, ENT_QUOTES, 'UTF-8'); ?></span></div>
                      <div class="account-dropdown js-dropdown" id="account-dropdown">
                        <div class="info clearfix">
                          <div class="content">
                            <h5 class="name"><?php echo htmlspecialchars($datos_usuario, ENT_QUOTES, 'UTF-8'); ?></h5>
                            <span class="email"><?php echo htmlspecialchars($email, ENT_QUOTES, 'UTF-8'); ?></span>
                          </div>
                        </div>
                        <div class="account-dropdown__body">
                          <div class="account-dropdown__item">
                            <a href="#" class="js-app-link js-account-app-link" data-app-url="cambio.php"><i class="fa-solid fa-key" aria-hidden="true"></i>Cambio de contraseña</a>
                          </div>
                        </div>
                        <div class="account-dropdown__footer">
                          <a href="salida.php"><i class="fa-solid fa-power-off" aria-hidden="true"></i>Cerrar sesión</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
		
		
        <main class="main-content" id="main-content">
          <div class="section__content section__content--p30">
            <div class="container-fluid">                        <!-- Page header -->
             
				<div class="row row-tight workspace-layout">
					<div class="col-lg-12">
						<div id="contenedor" name="contenedor" aria-live="polite"></div>
					</div>
					
				</div>
		

				<!-- Footer -->
				<div class="row ransa-workspace-footer">
					<div class="col-md-12">
						<div class="copyright">
							<p>Copyright © 2026 Ransa <a href="https://www.ransa.biz" rel="nofollow" target="_blank">Ransa</a>.</p>
						</div>
					</div>
				</div>

            </div>
          </div>
        </main>
      </div>
    </div>
    <script src="js/vanilla-utils.js"></script>
    <script src="vendor/bootstrap-5.3.8.bundle.min.js"></script>
    <script src="vendor/chartjs/chart.umd.js-4.5.1.min.js"></script>
    <script src="js/bootstrap5-init.js"></script>
    <script src="js/main-vanilla.js"></script>
    <script src="js/modern-plugins.js"></script>

    <!-- Arquitectura de Capas JS (Conexión, Lógica y Front/UI) -->
    <script src="js/layers/connection.js"></script>
    <script src="js/layers/logic.js"></script>
    <script src="js/layers/ui.js"></script>
    <script src="js/layers/legacy-bridges.js"></script>
    <script src="js/layers/response-ui.js"></script>
  </body>
</html>