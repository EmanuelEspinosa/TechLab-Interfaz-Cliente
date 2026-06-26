// URLs base de tu API de Spring Boot
const BASE_URL = "http://localhost:8080";

// ESTADOS LOCALES DE LA APP
let DB_PRODUCTOS = []; // Guardamos los productos que vienen de la BD
let CARRITO_LOCAL = []; // Estructura: [{ idProducto, cantidad, nombre, descripcion, maxStock }]

// ==========================================
// LÓGICA INICIAL Y CARGA DE DATOS
// ==========================================
window.onload = async () => {
    await actualizarDatosSistema();
};

async function actualizarDatosSistema() {
    await obtenerProductosBD();
    await obtenerCategoriasBD();
    await obtenerPedidosBD();
    renderizarProductosCatalogo();
    renderizarCarritoLocal();
}

// ==========================================
// MÓDULO PRODUCTOS Y CATÁLOGO
// ==========================================
async function obtenerProductosBD() {
    try {
        const res = await fetch(`${BASE_URL}/productos`);
        DB_PRODUCTOS = await res.json();
        renderizarTablaProductosAdmin(DB_PRODUCTOS);
    } catch (err) { console.error("Error cargando productos:", err); }
}

function renderizarProductosCatalogo() {
    const contenedor = document.getElementById("contenedorProductos");
    contenedor.innerHTML = "";

    if (DB_PRODUCTOS.length === 0) {
        contenedor.innerHTML = `<div class="col-12"><div class="alert alert-warning">No hay productos cargados en la Base de Datos.</div></div>`;
        return;
    }

    DB_PRODUCTOS.forEach(prod => {
        // Buscamos si el producto ya está en el carrito para calcular el stock visual disponible
        const itemEnCarrito = CARRITO_LOCAL.find(item => item.idProducto === prod.id);
        const stockVisual = itemEnCarrito ? (prod.stock - itemEnCarrito.cantidad) : prod.stock;

        contenedor.innerHTML += `
                    <div class="col-md-4 mb-3">
                        <div class="card shadow-sm h-100">
                            <div class="card-body d-flex flex-column">
                                <span class="badge bg-info text-dark align-self-start mb-2" style="text-transform: capitalize;">${prod.categoria ? prod.categoria.nombre : 'Sin Categoría'}</span>
                                <div class="d-flex justify-content-between align-items-center"><img style="width: 90%" src="${prod.urlImagen}" alt=""></div>
                                <h5 class="card-title">${prod.nombre}</h5>
                                <p class="card-text text-muted small flex-grow-1">${prod.descripcion || 'Sin descripción disponible.'}</p>
                                <div class="d-flex justify-content-between align-items-center mt-3">
                                    <span class="fs-5 fw-bold text-primary">
    ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(prod.precio)}
</span>
                                    <span class="badge ${stockVisual > 0 ? 'bg-success' : 'bg-danger'}">Stock: ${stockVisual}</span>
                                </div>
                            </div>
                            <div class="card-footer bg-white border-top-0">
                                <button class="btn btn-outline-primary btn-sm w-100" 
                                    onclick="agregarAlCarritoLocal(${prod.id}, '${prod.nombre}', '${prod.descripcion}', ${prod.stock}, ${prod.precio})"
                                    ${stockVisual <= 0 ? 'disabled' : ''}>
                                    <i class="fa-solid fa-cart-plus me-1"></i>${stockVisual > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
    });
}


// ==========================================
// 1. ALTA Y MODIFICACIÓN (Submit del Formulario)
// ==========================================
document.getElementById("formProducto").addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("prodId").value;
    const nombre = document.getElementById("prodNombre").value;
    const categoriaId = document.getElementById("prodCategoria").value;
    const descripcion = document.getElementById("prodDescripcion").value;
    const precio = parseFloat(document.getElementById("prodPrecio").value);
    const stock = parseInt(document.getElementById("prodStock").value);
    const marca = document.getElementById("prodMarca").value;
    const urlImagen = document.getElementById("prodUrlImagenInput").value;

    // Armamos el payload estructurado como lo espera tu Entidad en Spring Boot
    const payload = {
        nombre,
        descripcion,
        precio,
        stock,
        marca,
        urlImagen: urlImagen,
        categoria: { id: parseInt(categoriaId) }
    };

    try {
        let url = `${BASE_URL}/productos`;
        let metodo = "POST";

        if (id) { // Si hay ID en el input oculto, muta a PUT (Modificación)
            url = `${BASE_URL}/productos/${id}`;
            metodo = "PUT";
        }

        const res = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert(id ? "¡Producto actualizado con éxito!" : "¡Producto creado con éxito!");
            cancelarEdicionProducto(); // Limpia el formulario y resetea botones
            await actualizarDatosSistema(); // Recarga las tablas y el catálogo visual
        } else {
            const errText = await res.text();
            alert("Error al procesar el producto: " + errText);
        }
    } catch (err) {
        console.error("Error en ABM Productos:", err);
    }
});

// ==========================================
// 2. BAJA (Eliminar Producto de la BD)
// ==========================================
async function eliminarProductoBD(id) {
    if (!confirm("¿De verdad querés eliminar este producto? Esta acción no se puede deshacer.")) return;

    try {
        const res = await fetch(`${BASE_URL}/productos/${id}`, {
            method: "DELETE"
        });

        if (res.ok) {
            alert("Producto eliminado correctamente.");
            await actualizarDatosSistema();
        } else {
            alert("No se pudo eliminar el producto. Comprobá que no esté asociado a un pedido existente.");
        }
    } catch (err) {
        console.error("Error al eliminar producto:", err);
    }
}

// ==========================================
// 3. PREPARAR EDICIÓN (Cargar datos al formulario)
// ==========================================
function prepararEdicionProducto(prod) {
    document.getElementById("prodId").value = prod.id;
    document.getElementById("prodNombre").value = prod.nombre;
    document.getElementById("prodCategoria").value = prod.categoria ? prod.categoria.id : "";
    document.getElementById("prodDescripcion").value = prod.descripcion || "";
    document.getElementById("prodMarca").value = prod.marca;
    document.getElementById("prodPrecio").value = prod.precio;
    document.getElementById("prodStock").value = prod.stock;
    document.getElementById("prodUrlImagenInput").value = prod.urlImagen || "";

    // Cambiamos visualmente el comportamiento del formulario
    document.getElementById("btnGuardarProd").innerText = "Actualizar Cambios";
    document.getElementById("btnGuardarProd").className = "btn btn-warning w-100 fw-bold";
    document.getElementById("btnCancelarProdEdicion").classList.remove("d-none");
}

// Limpiar el formulario
function cancelarEdicionProducto() {
    document.getElementById("formProducto").reset();
    document.getElementById("prodId").value = "";

    document.getElementById("btnGuardarProd").innerText = "Guardar Producto";
    document.getElementById("btnGuardarProd").className = "btn btn-primary w-100 fw-bold";
    document.getElementById("btnCancelarProdEdicion").classList.add("d-none");
}

function renderizarTablaProductosAdmin(productos) {
    const tbody = document.getElementById("tablaProductosAdmin");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (productos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted">No hay productos cargados en el sistema.</td></tr>`;
        return;
    }

    productos.forEach(p => {
        // Formateamos el precio para que se vea lindo ($ 1.200,00)
        const precioFormateado = parseFloat(p.precio || 0).toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS"
        });

        // Obtenemos el nombre de la categoría de forma segura
        const nombreCat = p.categoria ? p.categoria.nombre : '<span class="text-danger">Sin Categoría</span>';

        tbody.innerHTML += `
            <tr>
                <td class="fw-bold">${p.id}</td>
                <td>
                    <div class="d-flex align-items-center">
                        ${p.urlImagen ? `<img src="${p.urlImagen}" class="rounded me-2" style="width: 50px; height: 50px; object-fit: cover;">` : ''}
                        <strong>${p.nombre}</strong>
                    </div>
                </td>
                <td><span class="badge bg-light text-dark border">${p.marca}</span></td>
                <td><span class="badge bg-light text-dark border" style="text-transform: capitalize;">${nombreCat}</span></td>
                <td class="font-monospace fw-bold text-success">${precioFormateado}</td>
                <td class="text-center font-monospace">${p.stock}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm" style="display: flex; gap: .5rem;">
                        <button class="btn btn-outline-warning" title="Editar Producto" onclick='prepararEdicionProducto(${JSON.stringify(p)})'>
                            ✏️
                        </button>
                        <button class="btn btn-outline-danger" title="Eliminar Producto" onclick="eliminarProductoBD(${p.id})">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
}


function actualizarSelectsDeCategorias(categorias) {
    const select = document.getElementById("prodCategoria");
    if (!select) return;

    // Dejamos solo la opción por defecto
    select.innerHTML = '<option value="">Seleccione una categoría...</option>';

    categorias.forEach(cat => {
        select.innerHTML += `<option value="${cat.id}">${cat.nombre}</option>`;
    });
}


// ==========================================
// MÓDULO CARRITO LOCAL 
// ==========================================
function agregarAlCarritoLocal(id, nombre, descripcion, maxStock, precio) {
    const itemExistente = CARRITO_LOCAL.find(item => item.idProducto === id);

    if (itemExistente) {
        if (itemExistente.cantidad < maxStock) {
            itemExistente.cantidad++;
        } else {
            alert("No podés agregar más unidades.");
            return;
        }
    } else {
        // ¡Guardamos el precio en el objeto del carrito local!
        CARRITO_LOCAL.push({ idProducto: id, cantidad: 1, nombre, descripcion, maxStock, precio: precio });
    }

    renderizarProductosCatalogo();
    renderizarCarritoLocal();
}

function modificarCantidadCarrito(idProducto, cambio) {
    const item = CARRITO_LOCAL.find(i => i.idProducto === idProducto);
    if (!item) return;

    item.cantidad += cambio;

    if (item.cantidad <= 0) {
        CARRITO_LOCAL = CARRITO_LOCAL.filter(i => i.idProducto !== idProducto);
    } else if (item.cantidad > item.maxStock) {
        alert("Superaste el stock disponible.");
        item.cantidad = item.maxStock;
    }

    renderizarProductosCatalogo();
    renderizarCarritoLocal();
}

function vaciarCarritoLocal() {
    CARRITO_LOCAL = [];
    renderizarProductosCatalogo();
    renderizarCarritoLocal();
}

function renderizarCarritoLocal() {
    const tbody = document.getElementById("tablaCarrito");
    const badge = document.getElementById("badgeCarrito");
    const btnConfirmar = document.getElementById("btnConfirmarPedido");
    const totalPagar = document.getElementById("totalAPagar");

    tbody.innerHTML = "";
    
    if (totalPagar) totalPagar.innerHTML = "";

    if (CARRITO_LOCAL.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">El carrito está vacío. Agregá productos desde el catálogo.</td></tr>`;
        badge.classList.add("d-none");
        btnConfirmar.disabled = true;
        
        if (totalPagar) {
            totalPagar.hidden;
        }
        return;
    }

    let totalItems = 0;
    let totalAPagar = 0;
    CARRITO_LOCAL.forEach(item => {
        totalItems += item.cantidad;
        totalAPagar += (item.precio * item.cantidad);
    });

    badge.innerText = totalItems;
    badge.classList.remove("d-none");
    btnConfirmar.disabled = false;

    CARRITO_LOCAL.forEach(item => {
        // Calculamos el subtotal de este producto
        const subtotalProducto = item.precio * item.cantidad;

        tbody.innerHTML += `
                    <tr>
                        <td><strong>${item.nombre}</strong></td>
                        <td class="text-muted small">${item.descripcion || '-'}</td>
                        <td class="font-monospace fw-bold text-secondary">
                            ${parseFloat(item.precio || 0).toLocaleString("es-AR", {
                                style: "currency",
                                currency: "ARS"
                            })}
                        </td>
                        <td class="text-center" style="width: 150px;">
                            <div class="input-group input-group-sm justify-content-center">
                                <button class="btn btn-outline-secondary" onclick="modificarCantidadCarrito(${item.idProducto}, -1)">-</button>
                                <span class="input-group-text px-3 fw-bold">${item.cantidad}</span>
                                <button class="btn btn-outline-secondary" onclick="modificarCantidadCarrito(${item.idProducto}, 1)" ${item.cantidad >= item.maxStock ? 'disabled' : ''}>+</button>
                            </div>
                        </td>
                        <td class="font-monospace fw-bold text-success">
                            ${subtotalProducto.toLocaleString("es-AR", {
                                style: "currency",
                                currency: "ARS"
                            })}
                        </td>
                        <td class="text-end">
                            <button class="btn btn-link text-danger p-0" onclick="CARRITO_LOCAL = CARRITO_LOCAL.filter(i => i.idProducto !== ${item.idProducto}); renderizarProductosCatalogo(); renderizarCarritoLocal();">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </td>
                    </tr>
        `;
    });

    if (totalPagar) {
        totalPagar.innerHTML = `
            <h5 class="fw-bold text-success">
                Total a Pagar: ${totalAPagar.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
            </h5>`;
    }
}

// POST - ENVIAR EL CARRITO ENTERO COMO UN PEDIDO EN CASCADA
async function confirmarPedidoBD() {
    if (CARRITO_LOCAL.length === 0) return;

    const lineasPayload = CARRITO_LOCAL.map(item => {
        const precioArticulo = parseFloat(item.precio || 0);
        const subtotalCalculado = parseFloat(precioArticulo * item.cantidad);

        return {
            cantidad: parseInt(item.cantidad),
            subtotal: subtotalCalculado, // Le mandamos el subtotal real numérico
            producto: {
                id: parseInt(item.idProducto),
                precio: precioArticulo,      // Inicializamos en el JSON para evitar el "null into double"
                stock: parseInt(item.maxStock || 0),
                nombre: item.nombre || ""
            }
        };
    });

    const payload = {
        total: 0.0, // Tu servicio lo calcula de cero, así que mandamos un valor base
        fechaAlta: new Date().toISOString(),
        lineas: lineasPayload
    };

    console.log("JSON final enviado a la BD:", JSON.stringify(payload));

    try {
        const res = await fetch(`${BASE_URL}/pedidos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("¡Pedido procesado con éxito en la Base de Datos!");
            CARRITO_LOCAL = [];
            await actualizarDatosSistema();

            const triggerEl = document.querySelector('#pedidos-tab');
            const tabInstance = bootstrap.Tab.getOrCreateInstance(triggerEl);
            tabInstance.show();
        } else {
            const errorMsg = await res.text();
            alert("Error en el servidor: " + errorMsg);
        }
    } catch (err) {
        alert("No se pudo conectar con el servidor Backend.");
        console.error(err);
    }
}

// ==========================================
// MÓDULO CATEGORÍAS (CRUD COMPLETO)
// ==========================================
async function obtenerCategoriasBD() {
    try {
        const res = await fetch(`${BASE_URL}/categorias`);
        const categorias = await res.json();
        const tbody = document.getElementById("tablaCategorias");
        tbody.innerHTML = "";

        categorias.forEach(cat => {
            tbody.innerHTML += `
                        <tr>
                            <td class="ps-3 fw-bold text-muted">${cat.id}</td>
                            <td><span class="badge bg-secondary">${cat.nombre}</span></td>
                            <td class="small text-muted">${cat.descripcion || '-'}</td>
                            <td class="text-end pe-3" style="display:flex; flex-direction:column; gap: .5rem;">
                                <button class="btn btn-outline-warning btn-sm me-1" onclick="cargarCategoriaParaEditar(${cat.id}, '${cat.nombre}', '${cat.descripcion || ''}')" style="width: 100%;">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-sm" onclick="eliminarCategoriaBD(${cat.id})" style="width: 100%;">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </td>
                        </tr>`;
        });
        actualizarSelectsDeCategorias(categorias);
    } catch (err) { console.error("Error mapeando categorías:", err); }
}

// POST / PUT - MANEJO UNIFICADO DEL FORMULARIO CATEGORÍAS
document.getElementById("formCategoria").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("catId").value;
    const nombre = document.getElementById("catNombre").value;
    const descripcion = document.getElementById("catDescripcion").value;

    const payload = { nombre, descripcion };

    try {
        let url = `${BASE_URL}/categorias`;
        let metodo = "POST";

        if (id) { // Si hay ID, estamos haciendo un UPDATE (PUT)
            url = `${BASE_URL}/categorias/${id}`;
            metodo = "PUT";
        }

        const res = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            cancelarEdicionCategoria();
            await actualizarDatosSistema();
        } else { alert("Error al procesar la categoría."); }
    } catch (err) { console.error(err); }
});

function cargarCategoriaParaEditar(id, nombre, descripcion) {
    document.getElementById("catId").value = id;
    document.getElementById("catNombre").value = nombre;
    document.getElementById("catDescripcion").value = descripcion;

    document.getElementById("tituloFormCat").innerText = "Editar Categoría " + nombre;
    document.getElementById("btnGuardarCat").className = "btn btn-warning w-100";
    document.getElementById("btnGuardarCat").innerText = "Actualizar Cambios";
    document.getElementById("btnCancelarEdicion").classList.remove("d-none");
}

function cancelarEdicionCategoria() {
    document.getElementById("formCategoria").reset();
    document.getElementById("catId").value = "";
    document.getElementById("tituloFormCat").innerText = "Registrar Categoría";
    document.getElementById("btnGuardarCat").className = "btn btn-success w-100";
    document.getElementById("btnGuardarCat").innerText = "Guardar Categoría";
    document.getElementById("btnCancelarEdicion").classList.add("d-none");
}

// DELETE
async function eliminarCategoriaBD(id) {
    if (confirm(`¿Estás seguro de eliminar la categoría #${ id } ? `)) {
        try {
            const res = await fetch(`${BASE_URL}/categorias/${id}`, { method: "DELETE" });
            if (res.ok || res.status === 204) {
                await actualizarDatosSistema();
            } else { alert("No se puede eliminar la categoría (verificá si tiene productos asociados)."); }
        } catch (err) { console.error(err); }
    }
}

// ==========================================
// MÓDULO HISTORIAL PEDIDOS (CON RESTABLECIMIENTO DE STOCK)
// ==========================================
async function obtenerPedidosBD() {
    try {
        const res = await fetch(`${BASE_URL}/pedidos`);
        const pedidos = await res.json();
        const acordeon = document.getElementById("listaPedidos");
        acordeon.innerHTML = "";

        if (pedidos.length === 0) {
            acordeon.innerHTML = `<div class= "alert alert-info" > No se registraron transacciones de pedidos todavía.</div>`;
            return;
        }

        pedidos.forEach((p, index) => {
            // Generamos las filas de la subtabla de detalles por cada ítem/línea de pedido
            let filasDetalle = "";
            if (p.lineas && p.lineas.length > 0) {
                p.lineas.forEach(linea => {
                    const nombreProd = linea.producto ? linea.producto.nombre : `Producto ID: ${ linea.producto_id || 'N/A' }`;
                    const precioUnitFormat = parseFloat(linea.producto.precio || 0).toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS"
                    });
                    filasDetalle += `
                        <tr>
                            <td>${linea.producto.id}</td>
                            <td><strong>${nombreProd}</strong></td>
                            <td>${precioUnitFormat}</td>
                            <td class="text-center font-monospace">${linea.cantidad}</td>
                        </tr >`;
                });
            } else {
                filasDetalle = `< tr > <td colspan="3" class="text-center text-muted">Sin líneas de detalle</td></tr > `;
            }

            const totalFormateado = parseFloat(p.total || 0).toLocaleString("es-AR", {
                style: "currency",
                currency: "ARS"
            });

            const fechaObj = p.fechaAlta ? new Date(p.fechaAlta) : null;
            const fechaFormateada = fechaObj && !isNaN(fechaObj)
                ? new Intl.DateTimeFormat('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false // Formato 24hs
                }).format(fechaObj)
                : 'Fecha N/A';

            acordeon.innerHTML += `
                        <div class= "accordion-item">
                            <h2 class="accordion-header" id="heading${p.id}">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${p.id}">
                                    <div class="d-flex justify-content-between w-100 align-items-center pe-3">
                                        <div>
                                            <span class="fw-bold text-primary">Pedido N°${p.id}</span>
                                            <span class="ms-3 text-muted small">${fechaFormateada || 'Fecha N/A'}</span>
                                        </div>
                                        <span class="badge bg-success">Procesado</span>
                                    </div>
                                </button>
                            </h2>
                            <div id="collapse${p.id}" class="accordion-collapse collapse" data-bs-parent="#listaPedidos">
                                <div class="accordion-body bg-white">
                                    <h6 class="fw-bold mb-3"><i class="fa-solid fa-list-check me-2"></i>Líneas de Pedido Asociadas</h6>
                                    <table class="table table-sm table-bordered align-middle small">
                                        <thead class="table-light">
                                            <tr>
                                                <th style="width: 80px;">Prod ID</th>
                                                <th>Nombre del Artículo</th>
                                                <th class="text-center" style="width: 200px;">Precio Unitario</th>
                                                <th class="text-center" style="width: 100px;">Cantidad</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${filasDetalle}
                                        </tbody>
                                    </table>
                                    <div class="d-flex justify-content-end align-items-center mt-2 px-1">
                                        <span class="text-muted me-2 small">Total a pagar:</span>
                                        <span class="fw-bold text-success fs-5">${totalFormateado}</span>
                                    </div>
                                    <div class="text-end mt-3 border-top pt-2">
                                        <button class="btn btn-danger btn-sm" onclick="eliminarPedidoBD(${p.id})">
                                            <i class="fa-solid fa-ban me-1"></i>Cancelar Pedido y Devolver Stock
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div >`;
        });
    } catch (err) { console.error("Error mapeando pedidos:", err); }
}

// DELETE - ANULACIÓN DE PEDIDO Y REVERSION DE STOCK
async function eliminarPedidoBD(id) {
    if (confirm(`¿Anular el Pedido #${ id } ? Esto va a ejecutar tu lógica de Java para reintegrar el stock de cada artículo.`)) {
        try {
            const res = await fetch(`${BASE_URL}/pedidos/${id}`, { method: "DELETE" });
            if (res.ok || res.status === 204) {
                alert("Pedido eliminado. Se restableció el stock correspondiente en los productos.");
                await actualizarDatosSistema(); // Recarga todo para ver el impacto inmediato del stock
            } else {
                alert("Error al intentar anular el pedido en el servidor.");
            }
        } catch (err) { console.error(err); }
    }
}