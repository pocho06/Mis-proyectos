<?php
// CONFIGURACIÓN DE CONEXIÓN
$host = "localhost";      // Servidor MySQL
$usuario = "root";        // Usuario MySQL
$clave = "";              // Contraseña (si usás XAMPP queda vacía)
$bd = "barberia_db";      // Base de datos creada

$conexion = new mysqli($host, $usuario, $clave, $bd);

// Verificar errores
if ($conexion->connect_error) {
    die("Error de conexión: " . $conexion->connect_error);
}

// Codificación
$conexion->set_charset("utf8mb4");
?>
