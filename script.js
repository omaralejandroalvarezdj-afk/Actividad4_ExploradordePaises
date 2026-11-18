const FUENTES = [
    "https://restcountries.com/v3.1/all?fields=name,capital,region,population,flags",
    "https://restcountries.conventus.de/v3.1/all?fields=name,capital,region,population,flags",
    "https://raw.githubusercontent.com/mledoze/countries/master/countries.json"
];

async function obtenerPaises() {
    let ultimoError;
    for (const url of FUENTES) {
        try {
            const respuesta = await fetch(url);
            if (!respuesta.ok) throw new Error("HTTP " + respuesta.status + " en " + url);
            const datos = await respuesta.json();
            if (!Array.isArray(datos) || !datos.length) throw new Error("Respuesta JSON inválida");
            const lista = datos.filter(pais => pais.name && pais.name.common);
            if (!lista.length) throw new Error("No se encontraron países");
            console.info("Datos cargados desde:", url);
            return lista;
        } catch (error) {
            console.warn("No se pudo usar la fuente:", url, error);
            ultimoError = error;
        }
    }
    throw ultimoError || new Error("No hay fuentes disponibles");
}

const busqueda = document.getElementById("busqueda");
const continente = document.getElementById("continente");
const limpiar = document.getElementById("limpiar");
const tarjetas = document.getElementById("tarjetas");
const estado = document.getElementById("estado");
const contador = document.getElementById("contador");
const paginacion = document.getElementById("paginacion");
const anterior = document.getElementById("anterior");
const siguiente = document.getElementById("siguiente");
const paginaActual = document.getElementById("paginaActual");

let paises = [];
let filtrados = [];
let pagina = 1;
const porPagina = 12;


async function cargarPaises() {
    mostrarEstado("Cargando países desde la API...");
    tarjetas.innerHTML = "";
    paginacion.hidden = true;
    contador.textContent = "Cargando...";

    try {
        const datos = await obtenerPaises();

        paises = datos;
        paises.sort((a, b) => a.name.common.localeCompare(b.name.common));
        filtrarPaises();
    } catch (error) {
        console.error("Error al consultar la API:", error);
        contador.textContent = "No se pudieron cargar los datos";
        mostrarEstado("No se pudieron obtener los países. Verifica tu conexión y revisa la consola (F12) para conocer el error.", true);

        const botonReintentar = document.createElement("button");
        botonReintentar.textContent = "Reintentar";
        botonReintentar.addEventListener("click", cargarPaises);
        estado.appendChild(document.createElement("br"));
        estado.appendChild(botonReintentar);
    }
}

// Mostrar mensajes de carga, vacío o error.
function mostrarEstado(mensaje, esError = false) {
    estado.hidden = false;
    estado.className = esError ? "estado error" : "estado";
    estado.textContent = mensaje;
}

// Filtramos los países obtenidos de la API sin hacer otra petición.
function filtrarPaises() {
    const texto = busqueda.value.trim().toLowerCase();
    const region = continente.value;

    filtrados = paises.filter(pais => {
        const coincideNombre = pais.name.common.toLowerCase().includes(texto);
        const coincideRegion = region === "" || pais.region === region;
        return coincideNombre && coincideRegion;
    });

    pagina = 1;
    mostrarPaises();
}

// Se crean las tarjetas HTML dinámicamente usando el DOM.
function mostrarPaises() {
    tarjetas.innerHTML = "";
    contador.textContent = filtrados.length + " países encontrados";

    if (filtrados.length === 0) {
        mostrarEstado("No se encontraron países con esos filtros. Intenta otra búsqueda.");
        paginacion.hidden = true;
        return;
    }

    estado.hidden = true;
    const inicio = (pagina - 1) * porPagina;
    const lista = filtrados.slice(inicio, inicio + porPagina);

    for (const pais of lista) {
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta";

        const imagen = document.createElement("img");
        imagen.className = "bandera";
        imagen.src = pais.flags?.svg || pais.flags?.png || "";
        imagen.alt = "Bandera de " + pais.name.common;
        imagen.loading = "lazy";

        const detalles = document.createElement("div");
        detalles.className = "detalles";

        const titulo = document.createElement("h3");
        titulo.textContent = pais.name.common;
        detalles.appendChild(titulo);

        // textContent evita insertar los datos de la API como HTML peligroso.
        agregarDato(detalles, "Capital", pais.capital?.[0] || "No disponible");
        agregarDato(detalles, "Región", traducirRegion(pais.region));
        agregarDato(detalles, "Población", Number(pais.population || 0).toLocaleString("es-MX"));

        tarjeta.appendChild(imagen);
        tarjeta.appendChild(detalles);
        tarjetas.appendChild(tarjeta);
    }

    const totalPaginas = Math.ceil(filtrados.length / porPagina);
    paginacion.hidden = totalPaginas <= 1;
    paginaActual.textContent = "Página " + pagina + " de " + totalPaginas;
    anterior.disabled = pagina === 1;
    siguiente.disabled = pagina === totalPaginas;
}

function agregarDato(contenedor, etiqueta, valor) {
    const parrafo = document.createElement("p");
    const negrita = document.createElement("strong");
    negrita.textContent = etiqueta + ": ";
    parrafo.appendChild(negrita);
    parrafo.appendChild(document.createTextNode(valor));
    contenedor.appendChild(parrafo);
}

function traducirRegion(region) {
    const nombres = {
        Africa: "África", Americas: "América", Asia: "Asia",
        Europe: "Europa", Oceania: "Oceanía", Antarctic: "Antártida"
    };
    return nombres[region] || region || "No disponible";
}

// Eventos del usuario.
busqueda.addEventListener("input", filtrarPaises);
continente.addEventListener("change", filtrarPaises);
limpiar.addEventListener("click", () => {
    busqueda.value = "";
    continente.value = "";
    filtrarPaises();
});
anterior.addEventListener("click", () => {
    if (pagina > 1) { pagina--; mostrarPaises(); window.scrollTo(0, 0); }
});
siguiente.addEventListener("click", () => {
    if (pagina < Math.ceil(filtrados.length / porPagina)) {
        pagina++;
        mostrarPaises();
        window.scrollTo(0, 0);
    }
});

cargarPaises();
