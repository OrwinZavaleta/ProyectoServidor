export class Utilities {
    static getISOWeek(date) {
        // Creamos una copia para no modificar la fecha original
        const tempDate = new Date(date.valueOf());
        // El estándar ISO 8601 indica que las semanas empiezan en lunes.
        // Ajustamos al jueves más cercano: fecha actual + 3 - (día de la semana actual)
        // En JS, getDay() devuelve 0 para domingo, lo ajustamos para que lunes sea 0.
        const dayNum = (date.getDay() + 6) % 7;
        tempDate.setDate(tempDate.getDate() - dayNum + 3);
        // La primera semana del año siempre contiene el 4 de enero
        const firstThursday = tempDate.valueOf();
        tempDate.setMonth(0, 4);
        // Ajustamos al jueves de esa primera semana
        const firstThursdayOfYear = (tempDate.getDay() + 6) % 7;
        tempDate.setDate(tempDate.getDate() - firstThursdayOfYear + 3);
        // Diferencia en semanas entre el jueves actual y el primer jueves del año
        const weekNumber = 1 + Math.round((firstThursday - tempDate.valueOf()) / 604800000);
        // Retornamos con relleno de cero si es necesario (ej. "01")
        return weekNumber.toString().padStart(2, "0");
    }
}
//# sourceMappingURL=Utilities.js.map