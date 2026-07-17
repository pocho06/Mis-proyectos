<?php
header("Content-Type: application/json");
require_once "conexion.php";

// Recibir datos del formulario
$nombre   = $_POST['nombre']   ?? null;
$telefono = $_POST['telefono'] ?? null;
$servicio = $_POST['servicio'] ?? null;
$barbero  = $_POST['barbero']  ?? null;
$fecha    = $_POST['fecha']    ?? null;
$hora     = $_POST['hora']     ?? null;
$nota     = $_POST['nota']     ?? "";

// Validación mínima
if (!$nombre || !$telefono || !$servicio || !$barbero || !$fecha || !$hora) {
    echo json_encode([
        "status"  => "error",
        "mensaje" => "Faltan datos obligatorios."
    ]);
    exit;
}

// Registrar cliente
$sql_cliente = "INSERT INTO clientes (nombre, telefono) VALUES (?, ?)";
$stmt = $conexion->prepare($sql_cliente);
$stmt->bind_param("ss", $nombre, $telefono);
$stmt->execute();
$id_cliente = $stmt->insert_id;
$stmt->close();

// Generar código único
$codigo = "BS-" . rand(1000, 9999);

// Registrar reserva
$sql_reserva = "INSERT INTO reservas
(id_cliente, id_barbero, id_servicio, fecha, hora, nota, codigo_reserva, estado)
VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')";

$stmt = $conexion->prepare($sql_reserva);
$stmt->bind_param("iiissss", $id_cliente, $barbero, $servicio, $fecha, $hora, $nota, $codigo);
$stmt->execute();
$id_reserva = $stmt->insert_id;
$stmt->close();

// Respuesta JSON
echo json_encode([
    "status"     => "ok",
    "mensaje"    => "Reserva creada correctamente",
    "id_reserva" => $id_reserva,
    "codigo"     => $codigo
]);
?>
