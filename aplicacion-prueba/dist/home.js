import { ApiService } from "./ApiService.js";
import { ViewService } from "./ViewService.js";
import { StorageService } from "./StorageService.js";
console.log("home.ts");
const CANTIDAD_PLATOS_ALEATORIAS = 8;
const CANTIDAD_PLATOS_FAVORITOS = 4;
document.addEventListener("DOMContentLoaded", () => {
    cargarCategorias();
    comprobarSesionUsuarioHome();
    cargarPlatosHome();
});
function comprobarSesionUsuarioHome() {
    let sesion = localStorage.getItem("session");
    const view = new ViewService();
    const storage = new StorageService();
    console.log(sesion);
    if (storage.getUsuarioActual()) {
        view.mostrarElement(document.querySelector("#botonFavoritos"), true);
        view.mostrarElement(document.querySelector("#contenedorFavoritos"), true);
        comprobarCategoriaFavorita();
        cargarFavoritos();
    }
    else {
        view.mostrarElement(document.querySelector("#botonFavoritos"), false);
        view.mostrarElement(document.querySelector("#contenedorFavoritos"), false);
    }
}
async function cargarFavoritos() {
    const view = new ViewService();
    const storage = new StorageService();
    const api = new ApiService();
    const usuario = storage.getUsuarioActual();
    const platosFavoritosSinProcesar = [];
    const platosFavoritos = [];
    if (usuario) {
        platosFavoritosSinProcesar.push(...storage.getPlatosFavoritos(usuario.id));
    }
    console.log("Aqui");
    console.log(platosFavoritosSinProcesar);
    for (let i = platosFavoritosSinProcesar.length - 1; i >= 0 &&
        i >= platosFavoritosSinProcesar.length - CANTIDAD_PLATOS_FAVORITOS; i--) {
        console.log(i);
        platosFavoritos.push(await api.pedirPlatoPorId(platosFavoritosSinProcesar[i].mealId));
    }
    view.pintarPlatos(platosFavoritos, document.querySelector("#platosFavoritos"), CANTIDAD_PLATOS_FAVORITOS);
}
function comprobarCategoriaFavorita() {
    const storage = new StorageService();
    const usuarioActual = storage.getUsuarioActual();
    if (usuarioActual?.favoriteCategory !== undefined) {
        document.querySelector("#categories").value =
            usuarioActual.favoriteCategory;
    }
}
function pedirNAleatorios(cant, tamArray) {
    let nRandoms = [];
    for (let i = 0; i < tamArray && i < cant; i++) {
        let random = Math.floor(Math.random() * tamArray);
        while (nRandoms.some((n) => n === random)) {
            random = Math.floor(Math.random() * tamArray);
        }
        nRandoms.push(random);
    }
    return nRandoms;
}
export async function cargarPlatosHome(e) {
    const view = new ViewService();
    const storage = new StorageService();
    let favUsuario = undefined;
    let favSelected = false;
    if (storage.getUsuarioActual()?.favoriteCategory) {
        favUsuario = storage.getUsuarioActual()?.favoriteCategory;
    }
    const contenedorAleatorios = document.querySelector("#aleatorioshome");
    if (contenedorAleatorios !== null) {
        const platos = [];
        if (e) {
            const target = e.target;
            const platosPedidos = [];
            if (target.value == "") {
                platosPedidos.push(...(await pedirTodosAleatorio()));
            }
            else {
                platosPedidos.push(...(await pedirPlatosCategoria(target.value)));
                if (favUsuario === target.value)
                    favSelected = true;
            }
            platos.push(...platosPedidos);
        }
        else {
            const platosPedidos = [];
            if (favUsuario) {
                platosPedidos.push(...(await pedirPlatosCategoria(favUsuario)));
                favSelected = true;
            }
            else {
                platosPedidos.push(...(await pedirTodosAleatorio()));
            }
            platos.push(...platosPedidos);
        }
        view.pintarPlatos(platos, contenedorAleatorios, CANTIDAD_PLATOS_ALEATORIAS, document.querySelector("#fijarCategoria"), favSelected);
    }
}
async function pedirPlatosCategoria(categoria) {
    const api = new ApiService();
    const categoriaPlatosSinProcesar = await api.pedirPlatosPorCategoria(categoria);
    const numeros_aleatorios = pedirNAleatorios(CANTIDAD_PLATOS_ALEATORIAS, categoriaPlatosSinProcesar.length);
    const categoriaPlatos = [];
    for (let i = 0; i < categoriaPlatosSinProcesar.length && i < CANTIDAD_PLATOS_ALEATORIAS; i++) {
        const plato = categoriaPlatosSinProcesar[numeros_aleatorios[i]];
        categoriaPlatos.push(await pedirPlatoPorId(plato.idMeal));
    }
    return categoriaPlatos;
}
async function pedirTodosAleatorio() {
    const api = new ApiService();
    const todosAleatorios = [];
    for (let i = 0; i < CANTIDAD_PLATOS_ALEATORIAS; i++) {
        todosAleatorios.push(await api.pedirProductoRandom());
    }
    console.log(todosAleatorios);
    return todosAleatorios;
}
async function cargarCategorias() {
    const api = new ApiService();
    const view = new ViewService();
    const categorias = await api.pedirTodasCategorias();
    const categoriesSelect = document.querySelector("#categories");
    view.pintarCategorias(categorias, categoriesSelect);
    categoriesSelect.addEventListener("change", cargarPlatosHome);
}
async function pedirPlatoPorId(id) {
    const api = new ApiService();
    const plato = await api.pedirPlatoPorId(id);
    return plato;
}
//# sourceMappingURL=home.js.map