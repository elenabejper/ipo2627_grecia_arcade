/**
 * src/js/vista.js
 * 
 * CAPA VISTA (MVC): 
 * Responsable de la presentación e interacción visual mediante la interfaz Canvas API[cite: 43, 67].
 * Ahora incorpora el sistema de cámara (scroll lateral) y un HUD dinámico.
 */

export class Vista {
    constructor(idCanvas) {
        this.canvas = document.getElementById(idCanvas);
        this.ctx = this.canvas.getContext("2d"); // Contexto especializado en dibujos bidimensionales[cite: 3]

        // Recuperar el diseño cromático establecido globalmente en :root[cite: 16, 50, 67]
        const estilosRoot = getComputedStyle(document.documentElement);
        this.colorFondo = estilosRoot.getPropertyValue('--color-fondo')?.trim() || '#f4f4f4';
        this.colorJugador = estilosRoot.getPropertyValue('--color-primario')?.trim() || 'hsl(210, 100%, 50%)';
        this.colorTerreno = estilosRoot.getPropertyValue('--color-secundario')?.trim() || 'hsl(120, 50%, 40%)';
    }

    dibujar(modelo) {
        // 1. Borrar el espacio ocupado en el fotograma anterior
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Fondo estático (opcional)
        this.ctx.fillStyle = this.colorFondo;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. SISTEMA DE CÁMARA (SCROLL BIDIMENSIONAL)
        // Guardamos el estado original del lienzo antes de aplicar transformaciones
        this.ctx.save(); 
        
        // Calculamos el centro de la cámara para que siga al jugador en X e Y
        let camaraX = modelo.jugador.x - (this.canvas.width / 2);
        let camaraY = modelo.jugador.y - (this.canvas.height / 2);

        // Opcional: Evitar que la cámara baje más allá de la zona de muerte (Y > 600)
        if (camaraY > 300) camaraY = 300; 

        // Traslación del contexto de dibujo en ambos ejes
        this.ctx.translate(-camaraX, -camaraY);

        // 3. Dibujar elementos del mundo sobre la cámara desplazada
        this.dibujarTerreno(modelo.nivel.plataformas);
        this.dibujarPuerta(modelo.nivel.puerta);
        this.dibujarLlave(modelo.nivel.llave);
        this.dibujarJugador(modelo.jugador);

        // Restauramos la matriz de transformación para que el HUD quede fijo en pantalla
        this.ctx.restore(); 

        // 4. Dibujar la interfaz
        this.dibujarHUD(modelo);
    }

    dibujarJugador(jugador) {
        this.ctx.beginPath(); // Comienzo de un nuevo camino[cite: 5]
        // Trazo curvo para renderizar al personaje esférico[cite: 6]
        this.ctx.arc(jugador.x, jugador.y, jugador.radio, 0, 2 * Math.PI); 
        this.ctx.fillStyle = this.colorJugador;
        this.ctx.fill(); // Dibuja el interior aplicando el estilo[cite: 5]
        this.ctx.closePath();
    }

    dibujarTerreno(plataformas) {
        this.ctx.fillStyle = this.colorTerreno;
        
        // Renderizado mediante la primitiva básica de dibujo[cite: 4]
        for (let plat of plataformas) {
            this.ctx.fillRect(plat.x, plat.y, plat.ancho, plat.alto);
        }
    }

    dibujarLlave(llave) {
        if (llave.recogida) return; 

        this.ctx.beginPath();
        this.ctx.arc(llave.x, llave.y, llave.radio, 0, 2 * Math.PI);
        this.ctx.fillStyle = 'gold'; 
        this.ctx.fill();
        this.ctx.closePath();
    }

    dibujarPuerta(puerta) {
        this.ctx.fillStyle = puerta.abierta ? 'hsl(120, 80%, 70%)' : 'hsl(0, 80%, 70%)';
        this.ctx.fillRect(puerta.x, puerta.y, puerta.ancho, puerta.alto);
    }

    dibujarHUD(modelo) {
        this.ctx.fillStyle = 'black';
        this.ctx.font = '16px monospace'; // Tipografía monoespaciada para alinear los datos numéricos[cite: 28]
        
        let textoLlave = modelo.jugador.tieneLlave ? "SÍ" : "NO";
        
        // Indicador de progreso con soporte para el nivel procedural infinito[cite: 67]
        let textoNivel = modelo.indiceNivel < 5 ? (modelo.indiceNivel + 1) + "/5" : "Procedural";
        
        this.ctx.fillText(
            `Nivel: ${textoNivel} | Llave: ${textoLlave} | Estado: ${modelo.estado}`, 
            20, 30
        );

        // Mensaje final
        if (modelo.estado === 'victoria') {
            this.ctx.font = '40px monospace';
            this.ctx.fillStyle = 'green';
            this.ctx.fillText("¡JUEGO COMPLETADO!", 200, 200);
        }
    }
}
