import { AuthSession } from "./AuthSession.js";
export class StorageService {
    constructor() {
        this.USER_KEY_ITEM = "users";
        this.AUTH_SESSION_KEY_ITEM = "session";
        this.USER_MEAL_KEY_ITEM = "userMeals_";
        this.USER_WEEKLY_KEY_ITEM = "weeklyPlans_";
        this.USER_CACHE_KEY_ITEM = "userMiniMeal_";
    }
    guardarAgregarUsuario(nuevoUsuario) {
        const users = JSON.parse(localStorage.getItem(this.USER_KEY_ITEM) ?? "[]");
        users.push(nuevoUsuario);
        localStorage.setItem(this.USER_KEY_ITEM, JSON.stringify(users));
        this.setUsuarioActual(nuevoUsuario);
    }
    setUsuarioActual(usuario) {
        const usuarioAGuardar = new AuthSession(usuario.id, usuario.name, new Date());
        localStorage.setItem(this.AUTH_SESSION_KEY_ITEM, JSON.stringify(usuarioAGuardar));
    }
    getUsuarioActual() {
        const usersinProcesar = localStorage.getItem(this.AUTH_SESSION_KEY_ITEM);
        if (usersinProcesar === null)
            return null;
        const usuarioProcesado = AuthSession.fromJSON(usersinProcesar);
        return this.buscarUsuarioPorId(usuarioProcesado.getId());
    }
    removeUsuarioActual() {
        localStorage.removeItem(this.AUTH_SESSION_KEY_ITEM);
    }
    buscarUsuarioPorCorreo(correo) {
        const users = JSON.parse(localStorage.getItem(this.USER_KEY_ITEM) ?? "[]");
        const usuarioEncontrado = users.find((us) => us.email === correo);
        if (usuarioEncontrado === undefined)
            return null;
        return usuarioEncontrado;
    }
    buscarUsuarioPorId(id) {
        const users = JSON.parse(localStorage.getItem(this.USER_KEY_ITEM) ?? "[]");
        const usuarioEncontrado = users.find((us) => us.id === id);
        if (usuarioEncontrado === undefined)
            return null;
        return usuarioEncontrado;
    }
    actualizarDatosUsuario(usuario) {
        const users = JSON.parse(localStorage.getItem(this.USER_KEY_ITEM) ?? "[]");
        const usuarioEncontrado = users.find((us) => us.email === usuario.email);
        if (usuarioEncontrado) {
            usuarioEncontrado.favoriteCategory = usuario.favoriteCategory;
            localStorage.setItem(this.USER_KEY_ITEM, JSON.stringify(users));
        }
        else {
            throw new Error("El usuario no existe");
        }
    }
    obtenerProximoIdUser() {
        const users = JSON.parse(localStorage.getItem(this.USER_KEY_ITEM) ?? "[]");
        let ultimoId = 0;
        users.forEach((us) => {
            if (us.id > ultimoId)
                ultimoId = us.id;
        });
        return ultimoId + 1;
    }
    getPlatosFavoritos(id) {
        const favoritosUserSinProcesar = localStorage.getItem(this.USER_MEAL_KEY_ITEM + id) ?? "[]";
        const favoritosUserProcesados = JSON.parse(favoritosUserSinProcesar);
        return favoritosUserProcesados;
    }
    guardarPlatoFavorito(platoGuardar, id) {
        const favoritosUserProcesados = this.getPlatosFavoritos(id);
        favoritosUserProcesados.push(platoGuardar);
        localStorage.setItem(this.USER_MEAL_KEY_ITEM + id, JSON.stringify(favoritosUserProcesados));
    }
    buscarPlatoFavoritoPorId(platoId, id) {
        const favoritosUserProcesados = this.getPlatosFavoritos(id);
        return favoritosUserProcesados.find((plato) => plato.mealId === platoId);
    }
    quitarPlatoFavorito(platoId, id) {
        const favoritosUserProcesados = this.getPlatosFavoritos(id);
        const indexPlato = favoritosUserProcesados.findIndex((plato) => plato.mealId === platoId);
        favoritosUserProcesados.splice(indexPlato, 1);
        localStorage.setItem(this.USER_MEAL_KEY_ITEM + id, JSON.stringify(favoritosUserProcesados));
    }
    actualizarPlatoFavorito(platoActualizar, id) {
        const favoritosUserProcesados = this.getPlatosFavoritos(id);
        const indexPlato = favoritosUserProcesados.findIndex((plato) => plato.mealId === platoActualizar.mealId);
        favoritosUserProcesados[indexPlato].status = platoActualizar.status;
        favoritosUserProcesados[indexPlato].notes = platoActualizar.notes;
        favoritosUserProcesados[indexPlato].rating = platoActualizar.rating;
        localStorage.setItem(this.USER_MEAL_KEY_ITEM + id, JSON.stringify(favoritosUserProcesados));
    }
}
//# sourceMappingURL=StorageService.js.map