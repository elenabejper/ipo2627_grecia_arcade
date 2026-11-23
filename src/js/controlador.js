/**
 * CONTROLADOR (MVC) — Neon Pulse.
 * Punto único donde se registran los eventos del teclado y de la interfaz.
 * Traduce entradas a acciones lógicas, ordena al Modelo cambiar su estado
 * y solicita a la Vista que lo represente. No calcula física ni pinta Canvas.
 */
export class Controlador {
    constructor(modelo, vista) {
        this.modelo = modelo;
        this.vista = vista;
        this.teclas = new Set();
        this.saltoPendiente = false;
        this.ayudaPauso = false;
        this.ultimoTiempo = null;
        this.acumulado = 0;
        this.intervalo = 1000 / 60; // Simulación independiente de los Hz de la pantalla.
        this.estadoDibujado = null;
        this.buclePrincipal = this.buclePrincipal.bind(this);
    }

    iniciar() {
        this.inicializarEventos();
        this.vista.dibujar(this.modelo);
        this.estadoDibujado = this.modelo.estado;
        requestAnimationFrame(this.buclePrincipal);
    }

    /** Eventos localizados aquí; la Vista únicamente proporciona los nodos DOM. */
    inicializarEventos() {
        const e = this.vista.elementos;
        const teclasJuego = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD']);
        window.addEventListener('keydown', (evento) => {
            if (e.modalAyuda.open) return;
            if (['KeyP', 'Escape'].includes(evento.code) && !evento.repeat) {
                if (this.modelo.estado === 'jugando' || this.modelo.estado === 'pausa') {
                    this.alternarPausa();
                    evento.preventDefault();
                }
                return;
            }
            // No interceptar el teclado al interactuar con selectores o botones.
            if (evento.target.closest?.('button, select, input, textarea')) return;
            if (!teclasJuego.has(evento.code)) return;
            if (this.modelo.estado === 'jugando') evento.preventDefault();
            if (['ArrowUp', 'KeyW', 'Space'].includes(evento.code) && !this.teclas.has(evento.code)) {
                this.saltoPendiente = true;
            }
            this.teclas.add(evento.code);
        });
        window.addEventListener('keyup', (evento) => this.teclas.delete(evento.code));
        window.addEventListener('blur', () => this.limpiarTeclas());
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.limpiarTeclas();
                this.modelo.pausar();
            }
        });
        e.btnComenzar.addEventListener('click', () => {
            this.limpiarTeclas();
            this.modelo.comenzar(this.vista.obtenerNivelSeleccionado());
            this.vista.enfocarJuego();
        });
        e.btnReiniciar.addEventListener('click', () => {
            this.limpiarTeclas();
            this.modelo.comenzar(0);
            this.vista.enfocarJuego();
        });
        e.btnPausar.addEventListener('click', () => this.alternarPausa());
        e.btnReanudar.addEventListener('click', () => this.alternarPausa());
        e.btnFinalizar.addEventListener('click', () => {
            this.limpiarTeclas();
            this.modelo.finalizar();
        });
        e.btnAyuda.addEventListener('click', () => {
            this.ayudaPauso = this.modelo.estado === 'jugando';
            if (this.ayudaPauso) this.modelo.pausar();
            this.limpiarTeclas();
            this.vista.mostrarAyuda();
        });
        e.btnCerrarAyuda.addEventListener('click', () => this.vista.cerrarAyuda());
        // Incluye el cierre nativo con Esc, sin reanudar si ya estaba en pausa.
        e.modalAyuda.addEventListener('close', () => {
            if (this.ayudaPauso) {
                this.modelo.reanudar();
                this.vista.enfocarJuego();
            }
            this.ayudaPauso = false;
        });
    }

    limpiarTeclas() {
        this.teclas.clear();
        this.saltoPendiente = false;
    }

    alternarPausa() {
        if (this.modelo.estado === 'jugando') this.modelo.pausar();
        else if (this.modelo.estado === 'pausa') {
            this.modelo.reanudar();
            this.vista.enfocarJuego();
        }
        this.limpiarTeclas();
    }

    /** Bucle fijo: corrige velocidades distintas según pantalla (60/120/144 Hz). */
    buclePrincipal(ahora) {
        if (this.ultimoTiempo === null) this.ultimoTiempo = ahora;
        const transcurrido = Math.min(100, Math.max(0, ahora - this.ultimoTiempo));
        this.ultimoTiempo = ahora;
        if (this.modelo.estado === 'jugando') {
            this.acumulado += transcurrido;
            let pasos = 0;
            while (this.acumulado >= this.intervalo && pasos < 6 && this.modelo.estado === 'jugando') {
                this.modelo.actualizar({
                    izquierda: this.teclas.has('ArrowLeft') || this.teclas.has('KeyA'),
                    derecha: this.teclas.has('ArrowRight') || this.teclas.has('KeyD'),
                    saltar: this.saltoPendiente
                });
                this.saltoPendiente = false;
                this.acumulado -= this.intervalo;
                pasos++;
            }
        } else {
            this.acumulado = 0;
        }
        this.vista.dibujar(this.modelo);
        this.estadoDibujado = this.modelo.estado;
        requestAnimationFrame(this.buclePrincipal);
    }
}
