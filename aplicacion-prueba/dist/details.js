import { ApiService } from "./ApiService.js";
import { ViewService } from "./ViewService.js";
import { StorageService } from "./StorageService.js";
import { Estado } from "./UserMeal.js";
console.log("details.ts");
document.addEventListener("DOMContentLoaded", () => {
    cargarDetallesPlato();
    asignarEventos();
    comprobarSesionUsuarioDetalle();
    cargarValidacionDeFormularios();
});
async function cargarDetallesPlato() {
    const id = obtenerId();
    const view = new ViewService();
    const api = new ApiService();
    const plato = await api.pedirPlatoPorId(Number(id));
    view.pintarVistaDetalleProducto(plato);
}
function obtenerId() {
    const urlParams = new URLSearchParams(window.location.search);
    const miId = urlParams.get("id");
    if (!miId)
        throw new Error("No hay ningun producto seleccionado");
    console.log(miId);
    return miId;
}
function comprobarSesionUsuarioDetalle() {
    const view = new ViewService();
    const storage = new StorageService();
    const botnFav = document.querySelector("#platoFavorito");
    const opinionFav = document.querySelector("#detallesForm");
    let sesion = localStorage.getItem("session");
    console.log(sesion);
    if (storage.getUsuarioActual()) {
        view.mostrarElement(botnFav, true);
        view.activarDesactivarBoton(botnFav, platoActualEnFavoritos(Number(obtenerId())));
        cargarValoresOpinion();
    }
    else {
        view.mostrarElement(botnFav, false);
        view.mostrarElement(opinionFav, false);
    }
}
function cargarValoresOpinion() {
    const storage = new StorageService();
    const user = storage.getUsuarioActual()?.id;
    const view = new ViewService();
    if (user && platoActualEnFavoritos(Number(obtenerId()))) {
        const platoActual = storage.buscarPlatoFavoritoPorId(Number(obtenerId()), user);
        document.querySelector("#hecho").checked =
            platoActual?.status === Estado.LA_HE_HECHO ? true : false;
        view.insertarTexto(document.querySelector("#opinion"), platoActual?.notes ?? "");
        const estrellas = document.querySelectorAll(".bi.bi-star");
        if (platoActual?.rating) {
            for (let i = 0; i < platoActual?.rating; i++) {
                view.estrellaPintada(estrellas[i], true);
            }
            document.querySelector("#rating").value =
                platoActual.rating + "";
        }
    }
}
function asignarEventos() {
    document.querySelector("#platoFavorito").addEventListener("click", handleBotonFavoritos);
    cargarEventosRating();
    document.querySelector("#resetearForm").addEventListener("click", resetearFormOpinion);
}
function cargarEventosRating() {
    const estrellas = document.querySelectorAll(".bi.bi-star");
    const view = new ViewService();
    console.log(estrellas);
    const rating = document.querySelector("#rating");
    for (let i = 0; i < estrellas.length; i++) {
        const element = estrellas[i];
        element.addEventListener("click", () => {
            rating.value = i + 1 + "";
            let prev = element;
            let next = element.nextElementSibling;
            while (prev !== null) {
                view.estrellaPintada(prev, true);
                prev = prev.previousElementSibling;
            }
            while (next !== null) {
                view.estrellaPintada(next, false);
                next = next.nextElementSibling;
            }
        });
    }
}
function handleBotonFavoritos(e) {
    const view = new ViewService();
    const storage = new StorageService();
    const boton = e.target;
    const formFavorito = document.querySelector("#detallesForm");
    try {
        const userMeal = transformarMyMealAUserMeal(Number(obtenerId()));
        if (boton?.classList.contains("active")) {
            view.activarDesactivarBoton(boton, false);
            storage.quitarPlatoFavorito(Number(obtenerId()), userMeal.userId);
            resetearFormOpinion();
            view.mostrarElement(formFavorito, false);
        }
        else {
            view.activarDesactivarBoton(boton, true);
            storage.guardarPlatoFavorito(userMeal, userMeal.userId);
            view.mostrarElement(formFavorito, true);
        }
    }
    catch (error) {
        console.log(error);
    }
}
function resetearFormOpinion() {
    const view = new ViewService();
    const form = document.querySelector("#guardarOpinion");
    form.reset();
    form.rating.value = 0;
    const estrellas = document.querySelectorAll(".bi.bi-star-fill");
    for (let i = 0; i < estrellas.length; i++) {
        view.estrellaPintada(estrellas[i], false);
    }
}
function transformarMyMealAUserMeal(platoId) {
    const storage = new StorageService();
    const userId = storage.getUsuarioActual()?.id;
    if (!userId)
        throw new Error("El usuario no existe");
    return {
        userId: userId,
        mealId: platoId,
        saveDate: new Date(),
        status: Estado.QUIERO_HACERLA,
    };
}
function platoActualEnFavoritos(idMeal) {
    const storage = new StorageService();
    const userId = storage.getUsuarioActual()?.id;
    if (!userId)
        throw new Error("El usuario no existe");
    const platoActualFav = storage.buscarPlatoFavoritoPorId(idMeal, userId);
    if (platoActualFav) {
        return true;
    }
    else {
        return false;
    }
}
function cargarValidacionDeFormularios() {
    // TODO: revisar si hace falta o con la de app.ts basta
    (() => {
        const forms = document.querySelectorAll(".needs-validation");
        Array.from(forms).forEach((form) => {
            form.addEventListener("submit", (event) => {
                event.preventDefault();
                event.stopPropagation();
                const esValido = realizarMiValidacion(form);
                if (form.checkValidity() && esValido) {
                    handleOpinionFormulario(form);
                    console.log("es valido");
                }
                else {
                    console.log("no valido");
                    form.classList.add("was-validated");
                }
            }, false);
        });
    })();
}
function realizarMiValidacion(form) {
    const view = new ViewService();
    let isValid = true;
    if (form.estado.value === Estado.LA_HE_HECHO) {
        if (!form.rating || form.rating.value == 0) {
            view.actualizarValidez(form.rating, false, "Ha marcado como Hecha, por favor deje una calificación.");
            form.rating.classList.add("is-invalid");
            isValid && (isValid = false);
        }
        else {
            view.actualizarValidez(form.rating, true, "");
            isValid && (isValid = true);
            form.rating.classList.remove("is-invalid");
        }
    }
    else if (form.estado.value === Estado.QUIERO_HACERLA) {
        view.actualizarValidez(form.rating, true, "");
        isValid && (isValid = true);
        form.rating.classList.remove("is-invalid");
    }
    return isValid;
}
function handleOpinionFormulario(form) {
    const storage = new StorageService();
    const view = new ViewService();
    const userMeal = transformarMyMealAUserMeal(Number(obtenerId()));
    userMeal.status = form.estado.value;
    userMeal.notes = form.opinion.value;
    userMeal.rating = form.rating.value;
    storage.actualizarPlatoFavorito(userMeal, userMeal.userId);
    form.classList.remove("was-validated");
    view.mostrarNotificacionEstado(true, "Se guardo correctamente.");
}
//# sourceMappingURL=details.js.map