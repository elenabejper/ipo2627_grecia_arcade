/**
 * src/js/modelo.js
 * 
 * CAPA MODELO (MVC): 
 * Gestiona el estado de la partida, la física, los niveles y las colisiones.
 * Totalmente independiente de la representación visual y del teclado[cite: 43].
 */

// 1. BASE DE DATOS DE NIVELES ESTÁTICOS (Diseño Puzle / Backtracking)
const NIVELES = [
    {
        // NIVEL 1: El dilema de izquierda o derecha
        inicioX: 400, inicioY: 300,
        plataformas: [ { x: 0, y: 350, ancho: 800, alto: 50 } ],
        llave: { x: 50, y: 330, radio: 10 },
        puerta: { x: 700, y: 250, ancho: 40, alto: 100 }
    },
    {
        // NIVEL 2: El pozo
        inicioX: 50, inicioY: 100,
        plataformas: [ 
            { x: 0, y: 150, ancho: 200, alto: 250 },   
            { x: 0, y: 380, ancho: 800, alto: 20 },    
            { x: 400, y: 300, ancho: 100, alto: 20 },  
            { x: 550, y: 220, ancho: 100, alto: 20 },  
            { x: 700, y: 150, ancho: 100, alto: 250 }  
        ],
        llave: { x: 250, y: 360, radio: 10 }, 
        puerta: { x: 730, y: 50, ancho: 40, alto: 100 } 
    },
    {
        // NIVEL 3: Bifurcación
        inicioX: 50, inicioY: 300,
        plataformas: [
            { x: 0, y: 350, ancho: 150, alto: 50 },
            { x: 200, y: 280, ancho: 100, alto: 20 }, 
            { x: 350, y: 200, ancho: 200, alto: 20 }, 
            { x: 350, y: 350, ancho: 200, alto: 50 }, 
            { x: 600, y: 350, ancho: 150, alto: 50 }  
        ],
        llave: { x: 450, y: 180, radio: 10 },
        puerta: { x: 650, y: 250, ancho: 40, alto: 100 }
    },
    {
        // NIVEL 4: Salto de fe invertido
        inicioX: 750, inicioY: 100,
        plataformas: [
            { x: 650, y: 150, ancho: 150, alto: 50 }, 
            { x: 400, y: 250, ancho: 100, alto: 20 }, 
            { x: 100, y: 150, ancho: 150, alto: 50 }, 
            { x: 0, y: 380, ancho: 800, alto: 20 }    
        ],
        llave: { x: 400, y: 360, radio: 10 }, 
        puerta: { x: 150, y: 50, ancho: 40, alto: 100 } 
    },
    {
        // NIVEL 5: Laberinto de inercias
        inicioX: 50, inicioY: 50,
        plataformas: [
            { x: 0, y: 100, ancho: 150, alto: 20 },
            { x: 250, y: 180, ancho: 100, alto: 20 }, 
            { x: 450, y: 260, ancho: 100, alto: 20 }, 
            { x: 0, y: 350, ancho: 300, alto: 50 },   
            { x: 600, y: 350, ancho: 200, alto: 50 }  
        ],
        llave: { x: 50, y: 330, radio: 10 },
        puerta: { x: 700, y: 250, ancho: 40, alto: 100 }
    }
];

// 2. CLASES DE DATOS
export class Jugador {
    constructor() {
        this.radio = 15;
        this.aceleracion = 0.5; 
        this.friccion = 0.92;   
        this.gravedad = 0.6;
        this.fuerzaSalto = -12;
        
        this.x = 0; 
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.enSuelo = false;
        this.tieneLlave = false;
    }
}

// 3. LÓGICA DE NEGOCIO PRINCIPAL
export class Modelo {
    constructor() {
        this.jugador = new Jugador();
        this.indiceNivel = 0; 
        this.estado = 'jugando'; 
        
        this.cargarNivel(this.indiceNivel);
    }

    cargarNivel(indice) {
        let config;

        if (indice < NIVELES.length) {
            config = NIVELES[indice];
        } else {
            config = this.generarNivelProcedural();
        }
        
        this.nivel = {
            plataformas: JSON.parse(JSON.stringify(config.plataformas)),
            llave: { ...config.llave, recogida: false },
            puerta: { ...config.puerta, abierta: false }
        };

        this.jugador.x = config.inicioX;
        this.jugador.y = config.inicioY;
        this.jugador.vx = 0;
        this.jugador.vy = 0;
        this.jugador.tieneLlave = false;
    }

   /**
     * Motor de Generación Procedural Complejo (Zig-Zag y Descenso)
     * Crea rutas bidimensionales (vertical y horizontal) obligando al jugador 
     * a dominar los rebotes, la aceleración y la inercia del Pufflescape.
     */
    /**
     * Motor de Generación Procedural Complejo (Espaciado Vertical Optimizado)
     */
    generarNivelProcedural() {
        const plataformas = [];
        let inicioX = 400; 
        let inicioY = 300; 

        // Plataforma central segura de inicio
        plataformas.push({ x: inicioX, y: inicioY, ancho: 150, alto: 20 });

        // --- RUTA 1: TORRE EN ZIG-ZAG VERTICAL (Busca la Llave) ---
        let cursorX = inicioX;
        let cursorY = inicioY;
        const numPlatLlave = Math.floor(Math.random() * 4) + 4; 

        for (let i = 0; i < numPlatLlave; i++) {
            let dirX = (i % 2 === 0) ? -1 : 1; 
            
            let huecoX = Math.floor(Math.random() * 60) + 40; 
            
            // AJUSTE VERTICAL: Mínimo 70px, máximo 110px de separación hacia arriba
            let desnivelY = Math.floor(Math.random() * 40) + 70; 
            
            cursorX += (dirX * huecoX);
            cursorY -= desnivelY; 

            let anchoPlat = Math.floor(Math.random() * 80) + 60;
            let posX = dirX === -1 ? cursorX - anchoPlat : cursorX;

            plataformas.push({ x: posX, y: cursorY, ancho: anchoPlat, alto: 20 });
            cursorX = dirX === -1 ? posX : posX + anchoPlat; 
        }
        
        let platLlave = plataformas[plataformas.length - 1];
        const llave = { 
            x: platLlave.x + (platLlave.ancho / 2), 
            y: platLlave.y - 20, 
            radio: 10 
        };

        // --- RUTA 2: DESCENSO FRAGMENTADO HACIA LA DERECHA (Busca la Puerta) ---
        cursorX = inicioX + 150; 
        cursorY = inicioY;
        const numPlatPuerta = Math.floor(Math.random() * 4) + 5; 

        for (let i = 0; i < numPlatPuerta; i++) {
            let huecoX = Math.floor(Math.random() * 80) + 60;
            
            // AJUSTE VERTICAL: Desciende siempre entre 30px y 80px por salto
            let desnivelY = Math.floor(Math.random() * 50) + 30; 
            
            cursorX += huecoX;
            cursorY += desnivelY;
            
            if (cursorY > 450) cursorY = 400; 

            let anchoPlat = Math.floor(Math.random() * 100) + 60;
            plataformas.push({ x: cursorX, y: cursorY, ancho: anchoPlat, alto: 20 });
            
            cursorX += anchoPlat;
        }

        let platMeta = plataformas[plataformas.length - 1];
        const puerta = { 
            x: platMeta.x + (platMeta.ancho / 2) - 20, 
            y: platMeta.y - 100, 
            ancho: 40, 
            alto: 100 
        };

        return {
            inicioX: inicioX + 50, 
            inicioY: inicioY - 30, 
            plataformas: plataformas,
            llave: llave,
            puerta: puerta
        };
    }

    /**
     * Bucle de actualización (Tick del motor de juego).
     * @param {Object} acciones - Objeto con booleanos { izquierda, derecha, saltar, abajo }
     */
    actualizar(acciones) {
        if (this.estado !== 'jugando') return;

        this.aplicarFisica(acciones);
        this.resolverColisionesEntorno();
        this.evaluarReglasDeNegocio();
    }

    aplicarFisica(acciones) {
        // Leemos las acciones unificadas enviadas por el controlador (WASD + Flechas)
        if (acciones.izquierda) this.jugador.vx -= this.jugador.aceleracion;
        if (acciones.derecha) this.jugador.vx += this.jugador.aceleracion;

        if (acciones.saltar && this.jugador.enSuelo) {
            this.jugador.vy = this.jugador.fuerzaSalto;
            this.jugador.enSuelo = false;
        }

        this.jugador.vy += this.jugador.gravedad;
        this.jugador.vx *= this.jugador.friccion;
        this.jugador.x += this.jugador.vx;
        this.jugador.y += this.jugador.vy;
    }

    resolverColisionesEntorno() {
        this.jugador.enSuelo = false;

        for (let plat of this.nivel.plataformas) {
            let baseJugador = this.jugador.y + this.jugador.radio;
            
            if (this.jugador.x > plat.x && 
                this.jugador.x < plat.x + plat.ancho &&
                baseJugador > plat.y && 
                this.jugador.y < plat.y + plat.alto) {
                
                this.jugador.y = plat.y - this.jugador.radio;
                this.jugador.vy = 0;
                this.jugador.enSuelo = true;
            }
        }
        
        // Pared invisible izquierda para no escapar del mapa hacia atrás
        if (this.jugador.x - this.jugador.radio < -1000) { // Ampliado para el procedural
            this.jugador.x = -1000 + this.jugador.radio;
            this.jugador.vx = 0;
        }

        // Cae al vacío
        if (this.jugador.y > 600) {
            this.cargarNivel(this.indiceNivel); 
        }
    }

    evaluarReglasDeNegocio() {
        if (!this.nivel.llave.recogida) {
            let dx = this.jugador.x - this.nivel.llave.x;
            let dy = this.jugador.y - this.nivel.llave.y;
            let distancia = Math.sqrt(dx * dx + dy * dy);

            if (distancia < this.jugador.radio + this.nivel.llave.radio) {
                this.nivel.llave.recogida = true;
                this.jugador.tieneLlave = true;
                this.nivel.puerta.abierta = true; 
            }
        }

        if (this.nivel.puerta.abierta) {
            let puerta = this.nivel.puerta;
            if (this.jugador.x > puerta.x && 
                this.jugador.x < puerta.x + puerta.ancho &&
                this.jugador.y > puerta.y && 
                this.jugador.y < puerta.y + puerta.alto) {
                
                this.indiceNivel++;
                this.cargarNivel(this.indiceNivel);
            }
        }
    }
}