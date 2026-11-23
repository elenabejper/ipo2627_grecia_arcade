/**
 * COMPOSICIÓN MVC — Neon Pulse.
 * Punto de entrada: únicamente instancia y conecta las tres capas.
 * Eventos, presentación y reglas están en sus módulos correspondientes.
 */
import { Modelo } from './modelo.js';
import { Vista } from './vista.js';
import { Controlador } from './controlador.js';

new Controlador(new Modelo(), new Vista()).iniciar();
