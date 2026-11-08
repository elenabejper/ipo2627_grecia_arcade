

/**
 * src/js/main.js
 * 
 * PUNTO DE ENTRADA: 
 * Ensambla el patrón MVC y gestiona los eventos de la interfaz HTML externa al Canvas.
 */

import { Modelo } from './modelo.js';
import { Vista } from './vista.js';
import { Controlador } from './controlador.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicialización del Patrón MVC[cite: 43]
    const modelo = new Modelo();
    const vista = new Vista('appCanvas');
    const controlador = new Controlador(modelo, vista);
    
    // Arrancamos el motor del juego
    controlador.iniciar();

    // 2. Gestión de la interfaz HTML y Usabilidad[cite: 67]
    const btnAyuda = document.getElementById('btn-ayuda');
    const btnCerrar = document.getElementById('btn-cerrar-ayuda');
    const modal = document.getElementById('modal-ayuda');

    // Mostramos las reglas del juego al pulsar el botón
    if (btnAyuda && modal) {
        btnAyuda.addEventListener('click', () => {
            modelo.estado = 'pausa'; // Pausamos la física del juego
            modal.showModal();       // Abrimos el componente <dialog> nativo
        });
    }

    // Cerramos las reglas y reanudamos el juego
    if (btnCerrar && modal) {
        btnCerrar.addEventListener('click', () => {
            modal.close();
            modelo.estado = 'jugando'; // Reanudamos la física
        });
    }
});