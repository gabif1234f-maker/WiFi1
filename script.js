// Variable global para guardar coordenadas en tiempo real si se usa el GPS
let ultimaLatitud = null;
let ultimaLongitud = null;

// === 1. LÓGICA DE GEOLOCALIZACIÓN (BOTÓN "MI POSICIÓN") ===
if (document.getElementById('btnGeolocalizar')) {
    document.getElementById('btnGeolocalizar').addEventListener('click', () => {
        const inputUbicacion = document.getElementById('ubicacion');
        
        if (!navigator.geolocation) {
            alert("Tu navegador no soporta la geolocalización.");
            return;
        }

        inputUbicacion.value = "Obteniendo ubicación...";

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                ultimaLatitud = position.coords.latitude;
                ultimaLongitud = position.coords.longitude;
                
                try {
                    // Intenta traducir las coordenadas a una dirección legible
                    const response = await fetch(`https://openstreetmap.org{ultimaLatitud}&lon=${ultimaLongitud}`);
                    const data = await response.json();
                    
                    if (data && data.display_name) {
                        inputUbicacion.value = data.display_name;
                    } else {
                        inputUbicacion.value = `${ultimaLatitud}, ${ultimaLongitud}`;
                    }
                } catch (error) {
                    // Si falla el servidor de nombres, dejamos las coordenadas directas
                    inputUbicacion.value = `${ultimaLatitud}, ${ultimaLongitud}`;
                }
            },
            (error) => {
                alert("No se pudo acceder a tu ubicación. Asegúrate de dar los permisos en el navegador.");
                inputUbicacion.value = "";
            }
        );
    });
}

// === 2. LÓGICA DEL BOTÓN: VER EN GOOGLE MAPS ===
if (document.getElementById('btnVerMapa')) {
    document.getElementById('btnVerMapa').addEventListener('click', () => {
        const inputUbicacion = document.getElementById('ubicacion');
        const ubicacionValor = inputUbicacion.value.trim();
        
        if (!ubicacionValor || ubicacionValor === "Obteniendo ubicación...") {
            alert("Por favor, ingresa o carga una ubicación primero.");
            return;
        }
// // Fíjate bien en las comillas inclinadas (`) al inicio y al final de la URL:

const urlMaps = `https://google.com{encodeURIComponent(ubicacionValor)}`;

window.open(urlMaps, '_blank');
        
    });
}




// === 3. LÓGICA PARA GUARDAR DATOS (FORMULARIO -> LOCALSTORAGE) ===
const wifiForm = document.getElementById('wifiForm');
if (wifiForm) {
    wifiForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Detiene la recarga automática del formulario

        // Capturar los valores actuales del formulario
        const nuevoCliente = {
            id: Date.now(), // ID único basado en milisegundos
            nombre: document.getElementById('nombreCliente').value,
            ubicacion: document.getElementById('ubicacion').value,
            lat: ultimaLatitud,
            lon: ultimaLongitud,
            red: document.getElementById('nombreRed').value,
            password: document.getElementById('password').value
        };

        // Recuperar registros anteriores de la memoria o empezar una lista vacía
        let listaClientes = JSON.parse(localStorage.getItem('wifi_records')) || [];
        
        // Añadir el nuevo registro
        listaClientes.push(nuevoCliente);

        // Guardar la lista actualizada de vuelta en LocalStorage
        localStorage.setItem('wifi_records', JSON.stringify(listaClientes));

        alert("¡Registro guardado con éxito!");
        
        // Limpiar variables de coordenadas para el siguiente cliente
        ultimaLatitud = null;
        ultimaLongitud = null;
        
        wifiForm.reset(); // Limpia los campos visualmente
        
        // Redirección inmediata a la base de datos de registros
        window.location.href = "registros.html";
    });
}

// === 4. LÓGICA PARA MOSTRAR DATOS EN LA TABLA (PÁGINA REGISTROS) ===
function mostrarRegistros() {
    const tablaBody = document.getElementById('tablaClientes');
    if (!tablaBody) return; // Si no estamos en la página de registros, detiene la función

    let listaClientes = JSON.parse(localStorage.getItem('wifi_records')) || [];
    tablaBody.innerHTML = ""; // Vaciar la tabla antes de renderizar

    if (listaClientes.length === 0) {
        tablaBody.innerHTML = `<tr><td colspan="5" class="empty-msg">No hay clientes registrados todavía.</td></tr>`;
        return;
    }

    listaClientes.forEach(cliente => {
        const fila = document.createElement('tr');
        
        let urlMaps;
        // Si el registro se guardó con coordenadas precisas
        if (cliente.lat && cliente.lon) {
            if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                urlMaps = `https://google.com{cliente.lat},${cliente.lon}`;
            } else {
                urlMaps = `https://google.com{cliente.lat},${cliente.lon}`;
            }
        } else {
            // Si solo contenía texto manual
            urlMaps = `https://google.com{encodeURIComponent(cliente.ubicacion)}`;
        }

        fila.innerHTML = `
            <td><strong>${cliente.nombre}</strong></td>
            <td>${cliente.ubicacion}</td>
            <td><code>${cliente.red}</code></td>
            <td><span style="font-family: monospace; font-weight: bold; background: #fffbeb; padding: 2px 6px; border-radius: 4px;">${cliente.password}</span></td>
            <td>
                <a href="${urlMaps}" target="_blank" class="btn-table-map" style="margin-right: 5px;">🗺️ Ver mapa</a>
                <button class="btn-danger" onclick="eliminarRegistro(${cliente.id})">❌ Borrar</button>
            </td>
        `;
        tablaBody.appendChild(fila);
    });
}

// === 5. LÓGICA PARA ELIMINAR UN CLIENTE DE LA TABLA ===
function eliminarRegistro(id) {
    if (confirm("¿Estás seguro de que deseas eliminar este registro?")) {
        let listaClientes = JSON.parse(localStorage.getItem('wifi_records')) || [];
        
        // Filtrar y remover el elemento que coincida con el ID
        listaClientes = listaClientes.filter(cliente => cliente.id !== id);
        
        // Guardar la nueva lista limpia
        localStorage.setItem('wifi_records', JSON.stringify(listaClientes));
        
        // Refrescar la tabla en tiempo real
        mostrarRegistros();
    }
}
