/**
 * VISTA (MVC) — Neon Pulse.
 * Se ocupa exclusivamente de la presentación HTML/CSS y de solicitar el
 * dibujo del mundo al RenderizadorCanvas. No cambia el estado del Modelo.
 * JavaScript comunica estilos con CSS mediante classList y [hidden], nunca
 * asignando estilos en línea. Los datos se presentan con textContent.
 */
import { RenderizadorCanvas } from './renderizador-canvas.js';

export class Vista {
    constructor() {
        // Todos los elementos DOM de la aplicación se localizan aquí.
        this.elementos = {
            lienzo: document.getElementById('appCanvas'),
            escenario: document.getElementById('escenario'),
            sector: document.getElementById('hud-sector'),
            vidas: document.getElementById('hud-vidas'),
            llave: document.getElementById('hud-llave'),
            modo: document.getElementById('hud-modo'),
            avance: document.getElementById('hud-avance'),
            pantalla: document.getElementById('pantalla-juego'),
            pantallaTitulo: document.getElementById('pantalla-titulo'),
            pantallaDescripcion: document.getElementById('pantalla-descripcion'),
            pantallaInicio: document.getElementById('pantalla-inicio'),
            pantallaAcciones: document.getElementById('pantalla-acciones'),
            seleccionNivel: document.getElementById('seleccion-nivel'),
            btnComenzar: document.getElementById('btn-comenzar'),
            btnReanudar: document.getElementById('btn-reanudar'),
            btnReiniciar: document.getElementById('btn-reiniciar'),
            btnPausar: document.getElementById('btn-pausar'),
            btnFinalizar: document.getElementById('btn-finalizar'),
            btnAyuda: document.getElementById('btn-ayuda'),
            btnCerrarAyuda: document.getElementById('btn-cerrar-ayuda'),
            modalAyuda: document.getElementById('modal-ayuda')
        };
        this.renderizador = new RenderizadorCanvas(this.elementos.lienzo);
        this.ultimoHUD = '';
        this.ultimoEstado = '';
    }

    /** Datos mostrados en HTML fuera del Canvas. */
    actualizarIndicadores(modelo) {
        const e = this.elementos;
        const sector = `${modelo.indiceNivel + 1}${modelo.modo === 'campana' ? ` / ${modelo.totalNiveles}` : ' · ∞'}`;
        const llave = modelo.jugador.tieneLlave ? '✓ Llave recogida' : '◇ Busca la llave';
        const datos = `${sector}|${modelo.vidas}|${llave}|${modelo.modo}`;
        if (datos === this.ultimoHUD) return;
        e.sector.textContent = sector;
        e.vidas.textContent = `${'♥ '.repeat(Math.max(0, modelo.vidas)).trim()}${modelo.vidas === 0 ? '0' : ''}`;
        e.vidas.setAttribute('aria-label', `${modelo.vidas} de ${modelo.vidasPorNivel} vidas disponibles`);
        e.llave.textContent = llave;
        e.llave.classList.toggle('marcador__valor--conseguido', modelo.jugador.tieneLlave);
        e.modo.textContent = modelo.modo === 'campana' ? 'CAMPAÑA' : 'MODO INFINITO';
        e.avance.hidden = modelo.modo === 'infinito';
        e.avance.value = Math.min(modelo.totalNiveles, modelo.indiceNivel + 1);
        e.avance.max = modelo.totalNiveles;
        this.ultimoHUD = datos;
    }

    /** Pantallas sobre el lienzo (HTML real; no texto pintado sobre Canvas). */
    actualizarPantalla(modelo) {
        const e = this.elementos;
        const estado = modelo.estado;
        if (estado === this.ultimoEstado) return;
        this.ultimoEstado = estado;
        e.escenario.classList.toggle('escenario--detenido', estado !== 'jugando');
        e.pantalla.hidden = estado === 'jugando';
        e.btnPausar.disabled = estado !== 'jugando' && estado !== 'pausa';
        e.btnPausar.textContent = estado === 'pausa' ? '▶ Reanudar' : 'Ⅱ Pausar';
        e.btnFinalizar.disabled = estado === 'inicio' || estado === 'victoria' || estado === 'sin_vidas' || estado === 'finalizado';
        e.pantallaInicio.hidden = estado !== 'inicio';
        e.btnReanudar.hidden = estado !== 'pausa';
        e.btnReiniciar.hidden = estado === 'inicio';
        e.pantallaAcciones.hidden = estado === 'inicio';

        const contenidos = {
            inicio: ['TU MISIÓN COMIENZA AQUÍ', 'Muévete, recoge la llave y alcanza el portal. Elige un sector y comienza.'],
            pausa: ['PARTIDA EN PAUSA', 'Puedes reanudar cuando quieras. Tu progreso sigue guardado.'],
            victoria: ['¡MISIÓN COMPLETADA!', 'Has superado los cinco sectores de Neon Pulse.'],
            sin_vidas: ['SIN VIDAS', 'Has agotado tus tres vidas. Vuelve a intentarlo desde el sector 1.'],
            finalizado: ['PARTIDA FINALIZADA', 'Has terminado esta partida. Puedes comenzar otra desde el principio.']
        };
        const [titulo, descripcion] = contenidos[estado] || contenidos.inicio;
        e.pantallaTitulo.textContent = titulo;
        e.pantallaDescripcion.textContent = descripcion;
        e.btnReiniciar.textContent = estado === 'pausa' ? '↻ Reiniciar desde sector 1' : '↻ Nueva partida';
    }

    /** Dibujo delegado a clase separada; HUD y menús permanecen en el DOM. */
    dibujar(modelo) {
        this.renderizador.dibujar(modelo);
        this.actualizarIndicadores(modelo);
        this.actualizarPantalla(modelo);
    }

    mostrarAyuda() {
        if (!this.elementos.modalAyuda.open) this.elementos.modalAyuda.showModal();
    }

    cerrarAyuda() {
        this.elementos.modalAyuda.close();
    }

    enfocarJuego() {
        this.elementos.lienzo.focus({ preventScroll: true });
    }

    obtenerNivelSeleccionado() {
        return Number(this.elementos.seleccionNivel.value);
    }
}
