import { StorageService } from "./StorageService.js";
//TODO: alert de success o error
export class ViewService {
    insertarTexto(element, mensaje) {
        element.textContent = mensaje;
    }
    insertarTextoFormato(element, mensaje) {
        element.innerHTML = mensaje;
    }
    apendizarTexto(element, mensaje) {
        element.textContent += mensaje;
    }
    apendizarTextoFormato(element, mensaje) {
        element.innerHTML += mensaje;
    }
    pintarPlatos(platos, element, CANTIDAD_PLATOS_ALEATORIAS, botonCategoria, buttonState) {
        this.insertarTextoFormato(element, "");
        for (let i = 0; i < platos.length && i < CANTIDAD_PLATOS_ALEATORIAS; i++) {
            const plato = platos[i];
            this.apendizarTextoFormato(element, `
                <a href="detalles.html?id=${plato.idMeal}" class="text-decoration-none text-reset col">
                    <div class="card">
                        <img src="${plato.strMealThumb}/small" class="card-img-top" alt="...">
                        <div class="card-body">
                            <h5 class="card-title">${plato.strMeal}</h5>
                            <p class="card-text">${plato.strCategory}</p>
                            <p class="card-text">${plato.strArea}</p>
                            <p class="card-text">${plato.ingredients.length} ingredientes requeridos </p> 
                        </div>
                    </div>
                </a>
                `);
            if (botonCategoria && buttonState) {
                this.activarDesactivarBoton(botonCategoria, buttonState);
            }
        }
    }
    pintarCategorias(categorias, select) {
        const favorito = this.getFavUsuarioActual();
        if (select !== null) {
            this.insertarTextoFormato(select, "<option value=''>Todas las categorías</option>");
            categorias.forEach((categoria) => {
                this.apendizarTextoFormato(select, `<option value="${categoria.strCategory}">${categoria.strCategory}</option>`);
            });
        }
        if (favorito && favorito !== "") {
            select.value = favorito;
            this.activarDesactivarBoton(document.querySelector("#fijarCategoria"), true);
        }
        document
            .querySelector("#fijarCategoria")
            ?.addEventListener("click", () => this.fijarDesfijarCategoria()); // Se usa flecha para que no pierda el puntero this y este siga apuntando al objeto ViewService
    }
    fijarDesfijarCategoria() {
        const storage = new StorageService();
        const usuarioActual = storage.getUsuarioActual();
        const boton = document.querySelector("#fijarCategoria");
        if (usuarioActual) {
            if (boton?.classList.contains("active")) {
                usuarioActual.favoriteCategory = undefined;
                this.activarDesactivarBoton(boton, false);
                storage.actualizarDatosUsuario(usuarioActual);
            }
            else {
                const categoriaAAsignar = document.querySelector("#categories").value;
                if (categoriaAAsignar &&
                    categoriaAAsignar !== null &&
                    categoriaAAsignar !== undefined) {
                    usuarioActual.favoriteCategory = categoriaAAsignar;
                    storage.actualizarDatosUsuario(usuarioActual);
                    this.activarDesactivarBoton(boton, true);
                }
            }
        }
    }
    activarDesactivarBoton(button, active) {
        if (active) {
            button.classList.add("active");
        }
        else {
            button.classList.remove("active");
        }
    }
    actualizarValidez(element, valido, mensaje) {
        const hermanoContenedorError = element.nextElementSibling;
        if (hermanoContenedorError instanceof HTMLElement) {
            this.insertarTexto(hermanoContenedorError, mensaje);
        }
        if (valido) {
            element.setCustomValidity("");
        }
        else {
            element.setCustomValidity(mensaje);
        }
    }
    getFavUsuarioActual() {
        const storage = new StorageService();
        const usuarioActual = storage.getUsuarioActual();
        if (usuarioActual?.favoriteCategory) {
            return usuarioActual.favoriteCategory;
        }
        else {
            return null;
        }
    }
    ocultarModal(modal) {
        if (modal) {
            const modalInstance = bootstrap.Modal.getOrCreateInstance(modal);
            modalInstance.hide();
        }
    }
    seleccionarTab(tab) {
        const tabBoot = new bootstrap.Tab(tab);
        tabBoot.show();
    }
    pintarVistaDetalleProducto(platoDetalle) {
        const imagenHTML = document.querySelector("#imagenPlato");
        const nombreHTML = document.querySelector("#nombrePlato");
        const ingredientesHTML = document.querySelector("#ingredientes");
        const opinionHTML = document.querySelector("#detallesForm");
        const descripcionHTML = document.querySelector("#descripcion");
        imagenHTML.src = platoDetalle.strMealThumb + "/medium";
        imagenHTML.alt = platoDetalle.strMeal;
        this.insertarTexto(nombreHTML, platoDetalle.strMeal);
        platoDetalle.ingredients.forEach((ingrediente) => {
            this.apendizarTextoFormato(ingredientesHTML, `<li class="list-group-item">${ingrediente.measure} de ${ingrediente.name}</li>`);
        });
        this.insertarTextoFormato(descripcionHTML, `<p>Categoria: ${platoDetalle.strCategory}</p>
            <p>País: ${platoDetalle.strArea}</p>`);
        const botonFav = document.querySelector("#platoFavorito");
        this.mostrarElement(opinionHTML, botonFav?.classList.contains("active"));
    }
    mostrarElement(div, condition) {
        if (condition) {
            div.classList.remove("d-none");
        }
        else {
            div.classList.add("d-none");
        }
    }
    estrellaPintada(es, pintada) {
        if (pintada) {
            es.classList.remove("bi-star");
            es.classList.add("bi-star-fill");
        }
        else {
            es.classList.add("bi-star");
            es.classList.remove("bi-star-fill");
        }
    }
    mostrarNotificacionEstado(estado, mensaje) {
        const status = document.querySelector("#pageStatus");
        this.mostrarElement(status, true);
        this.insertarTextoFormato(status, `
                <div class="alert alert-${estado ? "success" : "danger"} alert-dismissible fade show" role="alert">
                    ${mensaje}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `);
        setTimeout(() => {
            this.mostrarElement(status, false);
        }, 3000);
    }
}
//# sourceMappingURL=ViewService.js.map