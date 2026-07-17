<?php
require "conexion.php";

$nombre = $_POST["nombre"];
$email = $_POST["email"];
$pass = $_POST["pass"];

$sql = $conexion->prepare("INSERT INTO usuarios (nombre, email, pass) VALUES (?, ?, ?)");
$sql->bind_param("sss", $nombre, $email, $pass);

if ($sql->execute()) {
    echo json_encode(["ok" => true]);
} else {
    echo json_encode(["ok" => false, "error" => "Email ya registrado"]);
}
?>
