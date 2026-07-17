// tienda.js

// Helpers rápidos
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// Catálogo de productos (podés editar nombres y precios)
const productos = [
  {
    id: 'maq-pro-1',
    nombre: 'Máquina de corte Pro Fade X',
    categoria: 'maquinas',
    descripcion: 'Máquina profesional con palanca de ajuste y cuchillas de acero.',
    precio: 75000,
  },
  {
    id: 'maq-wireless-1',
    nombre: 'Máquina inalámbrica Studio Cut',
    categoria: 'maquinas',
    descripcion: 'Batería de larga duración, ideal para trabajar todo el día.',
    precio: 98000,
  },
  {
    id: 'trimmer-1',
    nombre: 'Trimmer de detalles Edge Line',
    categoria: 'maquinas',
    descripcion: 'Perfecta para contornos, patillas y diseños precisos.',
    precio: 52000,
  },
  {
    id: 'cera-mate-1',
    nombre: 'Cera mate efecto seco',
    categoria: 'peinado',
    descripcion: 'Fijación media, sin brillo, look natural.',
    precio: 8500,
  },
  {
    id: 'pomada-brillo-1',
    nombre: 'Pomada brillo intenso',
    categoria: 'peinado',
    descripcion: 'Fijación fuerte con brillo clásico.',
    precio: 8900,
  },
  {
    id: 'spray-fijador-1',
    nombre: 'Spray fijador ligero',
    categoria: 'peinado',
    descripcion: 'Controla el frizz sin dejar el pelo duro.',
    precio: 7600,
  },
  {
    id: 'aceite-barba-1',
    nombre: 'Aceite para barba cítrico',
    categoria: 'barba',
    descripcion: 'Hidrata, perfuma y suaviza la barba.',
    precio: 9900,
  },
  {
    id: 'balsamo-barba-1',
    nombre: 'Bálsamo modelador de barba',
    categoria: 'barba',
    descripcion: 'Control y forma para barbas medias y largas.',
    precio: 10400,
  },
  {
    id: 'kit-barba-1',
    nombre: 'Kit completo cuidado de barba',
    categoria: 'barba',
    descripcion: 'Aceite, shampoo y cepillo. Todo en uno.',
    precio: 24900,
  },
];

// Estado del carrito: { id: {producto, cantidad} }
const carrito = {};

// ====== RENDER DE PRODUCTOS ======
function renderProductos(filtro = 'todos') {
  const contenedor = $('#listaProductos');
  if (!contenedor) return;

  contenedor.innerHTML = '';

  const listaFiltrada =
    filtro === 'todos'
      ? productos
      : productos.filter((p) => p.categoria === filtro);

  if (!listaFiltrada.length) {
    contenedor.innerHTML =
      '<p class="text-sm text-white/60 col-span-full">No hay productos en esta categoría.</p>';
    return;
  }

  listaFiltrada.forEach((p) => {
    const card = document.createElement('article');
    card.className =
      'rounded-2xl bg-black/40 border border-white/10 p-4 flex flex-col justify-between shadow-soft';

    const precio = formatearPrecio(p.precio);

    card.innerHTML = `
      <div class="space-y-1 mb-3">
        <p class="text-[0.65rem] uppercase tracking-[0.18em] text-white/40">
          ${p.categoria === 'maquinas' ? 'Máquina de corte'
            : p.categoria === 'peinado' ? 'Peinado y styling'
            : 'Cuidado de barba'}
        </p>
        <h3 class="text-sm font-semibold">${p.nombre}</h3>
        <p class="text-xs text-white/60">${p.descripcion}</p>
      </div>

      <div class="mt-2 flex items-center justify-between gap-3">
        <span class="text-sm font-semibold">${precio}</span>
        <button
          class="px-3 py-1.5 rounded-2xl bg-brand text-xs font-semibold shadow-soft hover:-translate-y-0.5 hover:shadow-lg transition"
          data-add="${p.id}"
        >
          Agregar al carrito
        </button>
      </div>
    `;

    contenedor.appendChild(card);
  });

  // Listeners de los botones "Agregar"
  $$('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-add');
      agregarAlCarrito(id);
    });
  });
}

// ====== MANEJO DEL CARRITO ======
function agregarAlCarrito(idProducto) {
  const producto = productos.find((p) => p.id === idProducto);
  if (!producto) return;

  if (!carrito[idProducto]) {
    carrito[idProducto] = { producto, cantidad: 1 };
  } else {
    carrito[idProducto].cantidad += 1;
  }

  renderCarrito();
}

function cambiarCantidad(idProducto, delta) {
  if (!carrito[idProducto]) return;
  carrito[idProducto].cantidad += delta;

  if (carrito[idProducto].cantidad <= 0) {
    delete carrito[idProducto];
  }
  renderCarrito();
}

function vaciarCarrito() {
  Object.keys(carrito).forEach((id) => delete carrito[id]);
  renderCarrito();
}

function calcularTotales() {
  let totalItems = 0;
  let subtotal = 0;

  Object.values(carrito).forEach(({ producto, cantidad }) => {
    totalItems += cantidad;
    subtotal += producto.precio * cantidad;
  });

  return { totalItems, subtotal };
}

function renderCarrito() {
  const contenedor = $('#cartLista');
  const spanItems = $('#cartTotalItems');
  const spanSubtotal = $('#cartSubtotal');
  const miniCount = $('#miniCartCount');
  const btnGenerar = $('#btnGenerarPedido');
  const btnVaciar = $('#btnVaciarCarrito');
  const resultado = $('#resultadoPedido');

  if (!contenedor || !spanItems || !spanSubtotal || !btnGenerar || !btnVaciar) return;

  contenedor.innerHTML = '';
  resultado.classList.add('hidden');
  resultado.textContent = '';

  const { totalItems, subtotal } = calcularTotales();

  spanItems.textContent = totalItems;
  spanSubtotal.textContent = formatearPrecio(subtotal);
  if (miniCount) miniCount.textContent = totalItems;

  if (totalItems === 0) {
    contenedor.innerHTML =
      '<p class="text-white/60 text-sm">Aún no agregaste productos.</p>';
    btnGenerar.disabled = true;
    btnVaciar.disabled = true;
    return;
  }

  btnGenerar.disabled = false;
  btnVaciar.disabled = false;

  Object.values(carrito).forEach(({ producto, cantidad }) => {
    const item = document.createElement('div');
    item.className =
      'rounded-xl border border-white/10 bg-black/40 px-3 py-2 flex items-start justify-between gap-3';

    const subtotalItem = producto.precio * cantidad;

    item.innerHTML = `
      <div class="text-xs">
        <p class="font-semibold text-sm">${producto.nombre}</p>
        <p class="text-[0.7rem] text-white/50">${formatearPrecio(producto.precio)} c/u</p>
        <p class="text-[0.7rem] text-white/60 mt-0.5">
          Cantidad:
          <button class="px-1 rounded border border-white/20 text-[0.65rem]" data-dec="${producto.id}">−</button>
          <span class="mx-1">${cantidad}</span>
          <button class="px-1 rounded border border-white/20 text-[0.65rem]" data-inc="${producto.id}">+</button>
        </p>
      </div>
      <div class="flex flex-col items-end justify-between text-xs">
        <button class="text-[0.7rem] text-red-300 hover:underline mb-1" data-del="${producto.id}">
          Quitar
        </button>
        <p class="font-semibold text-sm">${formatearPrecio(subtotalItem)}</p>
      </div>
    `;

    contenedor.appendChild(item);
  });

  // Botones de cantidad y eliminar
  $$('[data-inc]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-inc');
      cambiarCantidad(id, +1);
    });
  });

  $$('[data-dec]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-dec');
      cambiarCantidad(id, -1);
    });
  });

  $$('[data-del]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-del');
      delete carrito[id];
      renderCarrito();
    });
  });
}

// ====== GENERAR MENSAJE PARA WHATSAPP ======
function generarMensajePedido() {
  const resultado = $('#resultadoPedido');
  if (!resultado) return;

  const { totalItems, subtotal } = calcularTotales();
  if (totalItems === 0) return;

  const lineas = ['Pedido desde la tienda de Barber Studio Pro:', ''];

  Object.values(carrito).forEach(({ producto, cantidad }) => {
    const totalItem = producto.precio * cantidad;
    lineas.push(
      `- ${producto.nombre} x${cantidad} (${formatearPrecio(totalItem)})`
    );
  });

  lineas.push('');
  lineas.push(`Total aproximado: ${formatearPrecio(subtotal)}`);
  lineas.push('');
  lineas.push('Por favor confirmame disponibilidad y formas de pago.');

  resultado.textContent = lineas.join('\n');
  resultado.classList.remove('hidden');
}

// ====== FORMATEO DE PRECIOS ======
function formatearPrecio(valor) {
  try {
    return valor.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    });
  } catch {
    return '$' + valor;
  }
}

// ====== FILTROS ======
function initFiltros() {
  const chips = $$('.chip[data-filtro]');
  if (!chips.length) return;

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const filtro = chip.getAttribute('data-filtro') || 'todos';

      chips.forEach((c) =>
        c.classList.remove('border-brand', 'bg-brand/20', 'text-brand')
      );
      chip.classList.add('border-brand', 'bg-brand/20', 'text-brand');

      renderProductos(filtro);
    });
  });

  // Activar "todos" al inicio
  const chipTodos = $('.filtro-todo[data-filtro="todos"]');
  if (chipTodos) chipTodos.click();
}

// ====== MENÚ MÓVIL Y MINI CARRITO ======
function initMenu() {
  const btnMenu = $('#btnMenu');
  const menuMovil = $('#menuMovil');
  const iconMenu = $('#iconMenu');

  if (btnMenu && menuMovil && iconMenu) {
    btnMenu.addEventListener('click', () => {
      const abierto = !menuMovil.classList.contains('hidden');
      if (abierto) {
        menuMovil.classList.add('hidden');
        iconMenu.textContent = '☰';
      } else {
        menuMovil.classList.remove('hidden');
        iconMenu.textContent = '✕';
      }
    });

    $$('#menuMovil a').forEach((link) => {
      link.addEventListener('click', () => {
        menuMovil.classList.add('hidden');
        iconMenu.textContent = '☰';
      });
    });
  }

  const btnMiniCart = $('#btnMiniCart');
  const carritoSection = document.querySelector('.cart-card');

  if (btnMiniCart && carritoSection) {
    btnMiniCart.addEventListener('click', () => {
      carritoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

// ====== BOTONES PRINCIPALES ======
function initAccionesCarrito() {
  const btnGenerar = $('#btnGenerarPedido');
  const btnVaciar = $('#btnVaciarCarrito');

  if (btnGenerar) {
    btnGenerar.addEventListener('click', generarMensajePedido);
  }
  if (btnVaciar) {
    btnVaciar.addEventListener('click', vaciarCarrito);
  }
}

// ====== INICIO ======
document.addEventListener('DOMContentLoaded', () => {
  initMenu();
  initFiltros();
  renderCarrito();
  initAccionesCarrito();
});