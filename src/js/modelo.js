/**
 * MODELO (MVC) — Neon Pulse.
 * Guarda exclusivamente los datos y reglas del juego: niveles, vidas, estados,
 * movimientos, saltos, colisiones y progresión. No conoce HTML, CSS ni Canvas.
 * Los métodos públicos (comenzar, pausar, reanudar, finalizar, actualizar)
 * son usados por el Controlador, nunca por los botones directamente.
 */

// Cinco sectores diseñados a mano; el modo infinito conserva el generador original.
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

export const NUM_NIVELES = NIVELES.length;
export const VIDAS_POR_NIVEL = 3;
const PASOS_COYOTE = 6;
const PASOS_BUFFER_SALTO = 6;

export class Jugador {
    constructor() {
        this.radio = 15;
        // Valores por paso fijo de 1/60 s. Inercia gradual y frenado controlado.
        this.aceleracionSuelo = 0.40;
        this.aceleracionAire = 0.25;
        this.velocidadMaxima = 5.2;
        this.friccionSuelo = 0.78;
        this.friccionAire = 0.99;
        this.gravedad = 0.57;
        this.fuerzaSalto = -13.5;
        this.velocidadCaidaMaxima = 13;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.enSuelo = false;
        this.tieneLlave = false;
        this.pasosCoyote = 0;
        this.pasosBufferSalto = 0;
    }
}

export class Modelo {
    constructor() {
        this.jugador = new Jugador();
        this.totalNiveles = NUM_NIVELES;
        this.vidasPorNivel = VIDAS_POR_NIVEL;
        this.vidas = VIDAS_POR_NIVEL;
        this.indiceNivel = 0;
        this.modo = 'campana';
        this.estado = 'inicio'; // inicio | jugando | pausa | victoria | sin_vidas | finalizado
        this.configNivelActual = null;
        this.cargarNivel(0);
    }

    comenzar(indiceInicial = 0) {
        const indice = Math.max(0, Math.min(NUM_NIVELES, Number(indiceInicial) || 0));
        this.modo = indice >= NUM_NIVELES ? 'infinito' : 'campana';
        this.indiceNivel = indice;
        this.vidas = this.vidasPorNivel;
        this.cargarNivel(indice);
        this.estado = 'jugando';
    }

    pausar() {
        if (this.estado === 'jugando') this.estado = 'pausa';
    }

    reanudar() {
        if (this.estado === 'pausa') this.estado = 'jugando';
    }

    finalizar() {
        if (this.estado === 'jugando' || this.estado === 'pausa') {
            this.estado = 'finalizado';
        }
    }

    cargarNivel(indice, { conservarEscenario = false } = {}) {
        const config = conservarEscenario && this.configNivelActual && this.configNivelActual.indice === indice
            ? this.configNivelActual.datos
            : indice < NUM_NIVELES ? NIVELES[indice] : this.generarNivelProcedural();

        // Solo copia de datos, nunca se mutan los niveles base ni el generador.
        this.configNivelActual = { indice, datos: structuredClone(config) };
        this.nivel = {
            plataformas: config.plataformas.map(p => ({ ...p })),
            llave: { ...config.llave, recogida: false },
            puerta: { ...config.puerta, abierta: false }
        };
        Object.assign(this.jugador, {
            x: config.inicioX, y: config.inicioY, vx: 0, vy: 0,
            enSuelo: false, tieneLlave: false, pasosCoyote: 0, pasosBufferSalto: 0
        });
    }

    /** Generador de escenarios extra, usado únicamente en el modo infinito. */
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


    /** Un paso de simulación a 60 Hz. El Controlador regula la frecuencia. */
    actualizar(acciones) {
        if (this.estado !== 'jugando') return;
        const antesY = this.jugador.y;
        const antesX = this.jugador.x;
        this.aplicarFisica(acciones);
        this.resolverColisionesEntorno(antesX, antesY);
        if (this.jugador.y > 620) {
            this.perderVida();
            return;
        }
        this.evaluarReglasDeNegocio();
    }

    aplicarFisica(acciones) {
        const j = this.jugador;
        const direccion = Number(Boolean(acciones.derecha)) - Number(Boolean(acciones.izquierda));
        if (direccion) {
            const aceleracion = j.enSuelo ? j.aceleracionSuelo : j.aceleracionAire;
            j.vx = Math.max(-j.velocidadMaxima, Math.min(j.velocidadMaxima, j.vx + direccion * aceleracion));
        } else {
            j.vx *= j.enSuelo ? j.friccionSuelo : j.friccionAire;
            if (Math.abs(j.vx) < 0.035) j.vx = 0;
        }

        if (j.enSuelo) j.pasosCoyote = PASOS_COYOTE;
        else j.pasosCoyote = Math.max(0, j.pasosCoyote - 1);

        if (acciones.saltar) j.pasosBufferSalto = PASOS_BUFFER_SALTO;
        else j.pasosBufferSalto = Math.max(0, j.pasosBufferSalto - 1);

        if (j.pasosBufferSalto > 0 && j.pasosCoyote > 0) {
            j.vy = j.fuerzaSalto;
            j.enSuelo = false;
            j.pasosCoyote = 0;
            j.pasosBufferSalto = 0;
        }

        j.vy = Math.min(j.velocidadCaidaMaxima, j.vy + j.gravedad);
    }

    /**
     * Colisiones por ejes (X primero, Y después) con detección de cara de entrada.
     * El personaje es un círculo; se usa su caja envolvente para paredes/suelos.
     * Evita el antiguo error que teletransportaba al jugador hasta la parte
     * superior de cualquier plataforma al chocar lateralmente sin saltar.
     */
    resolverColisionesEntorno(antesX, antesY) {
        const j = this.jugador;
        const radio = j.radio;
        const margen = 0.001;

        // Eje X: solo se considera pared si existe solapamiento vertical real.
        j.x += j.vx;
        for (const p of this.nivel.plataformas) {
            if (j.y + radio <= p.y + margen || j.y - radio >= p.y + p.alto - margen) continue;
            if (j.vx > 0 && antesX + radio <= p.x + margen && j.x + radio > p.x) {
                j.x = p.x - radio;
                j.vx = 0;
            } else if (j.vx < 0 && antesX - radio >= p.x + p.ancho - margen && j.x - radio < p.x + p.ancho) {
                j.x = p.x + p.ancho + radio;
                j.vx = 0;
            }
        }

        // Eje Y: solo aterriza al cruzar desde ARRIBA; desde abajo golpea el techo.
        j.y += j.vy;
        j.enSuelo = false;
        for (const p of this.nivel.plataformas) {
            if (j.x + radio <= p.x + margen || j.x - radio >= p.x + p.ancho - margen) continue;
            if (j.vy >= 0 && antesY + radio <= p.y + margen && j.y + radio >= p.y) {
                j.y = p.y - radio;
                j.vy = 0;
                j.enSuelo = true;
            } else if (j.vy < 0 && antesY - radio >= p.y + p.alto - margen && j.y - radio <= p.y + p.alto) {
                j.y = p.y + p.alto + radio;
                j.vy = 0;
            }
        }
        if (j.x - radio < -1000) {
            j.x = -1000 + radio;
            j.vx = 0;
        }
    }

    perderVida() {
        this.vidas--;
        if (this.vidas <= 0) {
            // El siguiente intento comienza obligatoriamente en el sector 1.
            this.modo = 'campana';
            this.indiceNivel = 0;
            this.cargarNivel(0);
            this.estado = 'sin_vidas';
            return;
        }
        // Al reaparecer se conserva el mismo nivel procedural, si lo hubiera.
        this.cargarNivel(this.indiceNivel, { conservarEscenario: true });
    }

    evaluarReglasDeNegocio() {
        const j = this.jugador;
        const llave = this.nivel.llave;
        if (!llave.recogida && Math.hypot(j.x - llave.x, j.y - llave.y) < j.radio + llave.radio) {
            llave.recogida = true;
            j.tieneLlave = true;
            this.nivel.puerta.abierta = true;
        }
        const puerta = this.nivel.puerta;
        if (puerta.abierta &&
            j.x + j.radio > puerta.x && j.x - j.radio < puerta.x + puerta.ancho &&
            j.y + j.radio > puerta.y && j.y - j.radio < puerta.y + puerta.alto) {
            this.avanzarNivel();
        }
    }

    avanzarNivel() {
        if (this.modo === 'campana' && this.indiceNivel === NUM_NIVELES - 1) {
            this.estado = 'victoria';
            return;
        }
        this.indiceNivel++;
        this.vidas = this.vidasPorNivel; // Vidas nuevas por cada nivel.
        this.cargarNivel(this.indiceNivel);
    }
}
