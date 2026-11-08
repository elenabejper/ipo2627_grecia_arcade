/**
 * src/js/controlador.js
 * 
 * CAPA CONTROLADOR (MVC): 
 * Actúa como intermediario: traduce las peticiones del usuario (teclado) 
 * en acciones para el Modelo y selecciona la Vista para mostrar el resultado.
 */

export class Controlador {
    constructor(modelo, vista) {
        this.modelo = modelo;
        this.vista = vista;
        
        // Diccionario para registrar qué teclas están pulsadas en cada momento
        this.teclas = {};

        // Vinculamos el contexto de 'this' para que no se pierda al pasarlo como callback
        this.buclePrincipal = this.buclePrincipal.bind(this);
    }

    iniciar() {
        this.inicializarEventos();
        
        // Solicitamos al navegador que inicie el bucle de animación[cite: 8]
        requestAnimationFrame(this.buclePrincipal);
    }

    inicializarEventos() {
        // La ventana se encarga de atender a la pulsación de las teclas[cite: 7]
        window.addEventListener('keydown', (evento) => {
            this.teclas[evento.code] = true;
        });

        window.addEventListener('keyup', (evento) => {
            this.teclas[evento.code] = false;
        });
    }

    buclePrincipal() {
        // Traducción de teclas a acciones lógicas (Patrón MVC estricto)
        const acciones = {
            izquierda: this.teclas['ArrowLeft'] || this.teclas['KeyA'],
            derecha:   this.teclas['ArrowRight'] || this.teclas['KeyD'],
            saltar:    this.teclas['ArrowUp'] || this.teclas['KeyW'],
            abajo:     this.teclas['ArrowDown'] || this.teclas['KeyS'] // Por si decides usarla luego
        };

        // 1. Enviamos acciones lógicas limpias, no los códigos crudos del teclado
        this.modelo.actualizar(acciones);

        // 2. Ordenamos a la vista que dibuje el nuevo fotograma
        this.vista.dibujar(this.modelo);

        // 3. Sincronizamos con el refresco de pantalla
        requestAnimationFrame(this.buclePrincipal);
    }
}