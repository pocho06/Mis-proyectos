<?php
session_start();
require "conexion.php";

$email = $_POST["email"];
$pass = $_POST["pass"];

$sql = $conexion->prepare("SELECT * FROM usuarios WHERE email=? AND pass=?");
$sql->bind_param("ss", $email, $pass);
$sql->execute();
$res = $sql->get_result();

if ($res->num_rows === 1) {
    $u = $res->fetch_assoc();
    $_SESSION["usuario"] = [
        "id" => $u["id"],
        "nombre" => $u["nombre"],
        "email" => $u["email"],
        "rol" => $u["rol"]
    ];
    echo json_encode(["ok" => true]);
} else {
    echo json_encode(["ok" => false]);
}
?>
