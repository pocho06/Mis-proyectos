
(function initReserva() {
  const form = document.querySelector("#formReserva");
  const alerta = document.querySelector("#alertaReserva");
  const resumen = document.querySelector("#resumenReserva");

  if (!form || !alerta || !resumen) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = new FormData(form);

    try {
      const req = await fetch("guardar_reserva.php", {
        method: "POST",
        body: data
      });

      const res = await req.json();

      if (res.status === "ok") {
        mostrarAlerta(alerta, "Turno guardado correctamente. Código: " + res.codigo, "ok");

        resumen.innerHTML = `
          <p><strong>Cliente:</strong> ${data.get("nombre")}</p>
          <p><strong>WhatsApp:</strong> ${data.get("telefono")}</p>
          <p><strong>Servicio:</strong> ${data.get("servicio")}</p>
          <p><strong>Barbero:</strong> ${data.get("barbero")}</p>
          <p><strong>Fecha:</strong> ${data.get("fecha")} - ${data.get("hora")}</p>
          <p><strong>Código de reserva:</strong> ${res.codigo}</p>
        `;

        form.reset();
      } else {
        mostrarAlerta(alerta, res.mensaje, "error");
      }

    } catch (error) {
      mostrarAlerta(alerta, "Error de conexión con el servidor", "error");
    }
  });

  function mostrarAlerta(el, mensaje, tipo) {
    el.textContent = mensaje;
    el.classList.remove("hidden");

    if (tipo === "ok") {
      el.classList.add("bg-emerald-500/20", "text-emerald-100");
      el.classList.remove("bg-red-500/20", "text-red-200");
    } else {
      el.classList.add("bg-red-500/20", "text-red-200");
      el.classList.remove("bg-emerald-500/20", "text-emerald-100");
    }
  }
})();
document.querySelectorAll(".reservar-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const id = btn.dataset.servicio;
        const select = document.querySelector("#servicio");

        if (select) {
            select.value = id;
        }
    });
});

document.querySelectorAll(".reservar-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const idServicio = btn.dataset.servicio;
    const selectServicio = document.querySelector("#servicio");

    if (selectServicio) {
      selectServicio.value = idServicio;
    }
  });
});
// Cuando se selecciona fecha u hora en el calendario
resFecha.addEventListener("DOMSubtreeModified", () => {
  const fechaInput = document.querySelector("#fechaReserva");
  fechaInput.value = resFecha.textContent !== "—" ? resFecha.textContent : "";
});

resHora.addEventListener("DOMSubtreeModified", () => {
  const horaInput = document.querySelector("#horaReserva");
  horaInput.value = resHora.textContent !== "—" ? resHora.textContent : "";
});

