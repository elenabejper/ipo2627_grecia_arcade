/**
 * RENDERIZADOR DE CANVAS — auxiliar de la VISTA de Neon Pulse.
 * Única responsabilidad: dibujar el mundo, sus entidades y efectos visuales.
 * No conoce el DOM exterior, el teclado ni las reglas del Modelo.
 * No dibuja HUD: los indicadores son elementos HTML de la Vista.
 */
export class RenderizadorCanvas {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.ancho = this.canvas.width;
        this.alto = this.canvas.height;
        this.movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Colores semánticos compartidos por CSS y Canvas.
        const estilos = getComputedStyle(document.documentElement);
        const variable = (nombre, alternativa) => estilos.getPropertyValue(nombre).trim() || alternativa;
        this.colores = {
            fondo: variable('--juego-fondo', 'hsl(232 44% 9%)'),
            fondoMedio: variable('--juego-fondo-medio', 'hsl(245 44% 18%)'),
            superficie: variable('--juego-plataforma', 'hsl(250 34% 31%)'),
            cian: variable('--juego-cian', 'hsl(179 96% 61%)'),
            violeta: variable('--juego-violeta', 'hsl(275 96% 72%)'),
            dorado: variable('--juego-dorado', 'hsl(44 100% 67%)'),
            texto: variable('--juego-texto', 'hsl(220 50% 94%)')
        };

        // Posiciones reproducibles: no generar aleatoriamente en cada fotograma.
        this.estrellas = Array.from({ length: 70 }, (_, i) => ({
            x: this.ruido(i * 17 + 13) * this.ancho,
            y: this.ruido(i * 43 + 7) * (this.alto - 30),
            radio: 0.5 + this.ruido(i * 11 + 31) * 1.2,
            brillo: 0.25 + this.ruido(i * 19 + 73) * 0.55,
            desfase: this.ruido(i * 41 + 15) * Math.PI * 2
        }));
    }

    // Pseudoaleatoriedad estable para partículas y decoración.
    ruido(semilla) {
        const valor = Math.sin(semilla * 127.1 + 311.7) * 43758.5453123;
        return valor - Math.floor(valor);
    }

    dibujar(modelo) {
        const ctx = this.ctx;
        const tiempo = this.movimientoReducido ? 0 : performance.now() / 1000;
        const jugador = modelo.jugador;

        // Se mantiene el sistema de cámara de la versión original.
        const camaraX = jugador.x - this.ancho / 2;
        const camaraY = Math.min(jugador.y - this.alto / 2, 300);

        ctx.clearRect(0, 0, this.ancho, this.alto);
        this.dibujarFondo(camaraX, camaraY, tiempo);

        ctx.save();
        ctx.translate(-camaraX, -camaraY);
        this.dibujarDecoracionMundo(modelo.nivel.plataformas, tiempo);
        this.dibujarTerreno(modelo.nivel.plataformas);
        this.dibujarPuerta(modelo.nivel.puerta, tiempo);
        this.dibujarLlave(modelo.nivel.llave, tiempo);
        this.dibujarJugador(jugador, tiempo);
        ctx.restore();

    }

    // Fondo de pantalla: degradado, paneles en perspectiva, estrellas y retícula.
    dibujarFondo(camaraX, camaraY, tiempo) {
        const ctx = this.ctx;
        const c = this.colores;
        const fondo = ctx.createLinearGradient(0, 0, 0, this.alto);
        fondo.addColorStop(0, c.fondo);
        fondo.addColorStop(0.65, c.fondoMedio);
        fondo.addColorStop(1, 'hsl(265 57% 13%)');
        ctx.fillStyle = fondo;
        ctx.fillRect(0, 0, this.ancho, this.alto);

        // Mancha de luz ambiental, aplicada solo al fondo.
        const halo = ctx.createRadialGradient(565, 180, 15, 565, 180, 380);
        halo.addColorStop(0, 'hsl(267 90% 58% / 0.19)');
        halo.addColorStop(1, 'hsl(267 90% 58% / 0)');
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, this.ancho, this.alto);

        // Estrellas con desplazamiento lento (parallax), sin parpadeos bruscos.
        for (const estrella of this.estrellas) {
            const x = ((estrella.x - camaraX * 0.035) % this.ancho + this.ancho) % this.ancho;
            const y = ((estrella.y - camaraY * 0.025) % this.alto + this.alto) % this.alto;
            const pulso = 0.9 + Math.sin(tiempo * 0.8 + estrella.desfase) * 0.1;
            ctx.fillStyle = `hsl(189 93% 86% / ${estrella.brillo * pulso})`;
            ctx.beginPath();
            ctx.arc(x, y, estrella.radio, 0, Math.PI * 2);
            ctx.fill();
        }

        // Siluetas de torres futuristas en un segundo plano.
        const paso = 92;
        const offset = ((camaraX * 0.10) % paso + paso) % paso;
        for (let i = -2; i < 12; i++) {
            const x = i * paso - offset;
            const altoTorre = 76 + Math.floor(this.ruido(i + 200) * 78);
            const y = this.alto - altoTorre;
            ctx.fillStyle = 'hsl(244 45% 15% / 0.63)';
            ctx.fillRect(x + 15, y, 57, altoTorre);
            ctx.strokeStyle = 'hsl(269 70% 63% / 0.12)';
            ctx.strokeRect(x + 15.5, y + 0.5, 56, altoTorre);
            ctx.fillStyle = 'hsl(186 96% 72% / 0.17)';
            for (let fila = 0; fila < 4; fila++) {
                ctx.fillRect(x + 28, y + 16 + fila * 18, 8, 2);
                ctx.fillRect(x + 49, y + 16 + fila * 18, 8, 2);
            }
        }

        // Retícula sutil: se dibuja sobre el fondo, nunca sobre las entidades.
        const tam = 40;
        const ox = ((camaraX * 0.23) % tam + tam) % tam;
        const oy = ((camaraY * 0.15) % tam + tam) % tam;
        ctx.strokeStyle = 'hsl(190 91% 75% / 0.055)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = -ox; x < this.ancho; x += tam) {
            ctx.moveTo(Math.round(x) + 0.5, 0);
            ctx.lineTo(Math.round(x) + 0.5, this.alto);
        }
        for (let y = -oy; y < this.alto; y += tam) {
            ctx.moveTo(0, Math.round(y) + 0.5);
            ctx.lineTo(this.ancho, Math.round(y) + 0.5);
        }
        ctx.stroke();

        // Barrido suave en el fondo, sutil y meramente decorativo.
        const yBarrido = (tiempo * 12) % (this.alto + 140) - 70;
        const barrido = ctx.createLinearGradient(0, yBarrido - 35, 0, yBarrido + 35);
        barrido.addColorStop(0, 'hsl(180 100% 70% / 0)');
        barrido.addColorStop(0.5, 'hsl(180 100% 70% / 0.025)');
        barrido.addColorStop(1, 'hsl(180 100% 70% / 0)');
        ctx.fillStyle = barrido;
        ctx.fillRect(0, yBarrido - 35, this.ancho, 70);
    }

    // Pequeños elementos ambientales anclados a las plataformas (sin hitbox).
    dibujarDecoracionMundo(plataformas, tiempo) {
        const ctx = this.ctx;
        for (let i = 0; i < plataformas.length; i++) {
            const p = plataformas[i];
            if (p.ancho < 75) continue;
            const x = p.x + 24 + (p.ancho - 48) * this.ruido(i * 23 + p.x * 0.17);
            const y = p.y - 5;
            const pulso = 0.55 + Math.sin(tiempo * 1.8 + i) * 0.2;
            ctx.save();
            ctx.globalAlpha = pulso;
            ctx.strokeStyle = this.colores.violeta;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x - 5, y);
            ctx.lineTo(x, y - 13);
            ctx.lineTo(x + 5, y);
            ctx.stroke();
            ctx.restore();
        }
    }

    // Conserva EXACTAMENTE las dimensiones de cada plataforma del Modelo.
    dibujarTerreno(plataformas) {
        const ctx = this.ctx;
        const c = this.colores;
        for (const p of plataformas) {
            ctx.save();

            const relleno = ctx.createLinearGradient(p.x, p.y, p.x, p.y + Math.max(20, p.alto));
            relleno.addColorStop(0, 'hsl(251 36% 33%)');
            relleno.addColorStop(0.16, c.superficie);
            relleno.addColorStop(1, 'hsl(243 47% 16%)');
            ctx.fillStyle = relleno;
            ctx.fillRect(p.x, p.y, p.ancho, p.alto);

            // Línea de energía, integrada en el borde superior real de colisión.
            ctx.shadowColor = c.cian;
            ctx.shadowBlur = 12;
            ctx.fillStyle = c.cian;
            ctx.fillRect(p.x + 2, p.y, Math.max(0, p.ancho - 4), 3);
            ctx.shadowBlur = 0;

            ctx.strokeStyle = 'hsl(259 88% 77% / 0.48)';
            ctx.lineWidth = 1;
            ctx.strokeRect(p.x + 0.5, p.y + 4.5, p.ancho - 1, Math.max(0, p.alto - 5));

            // Paneles interiores y marcas de circuito.
            ctx.strokeStyle = 'hsl(189 93% 75% / 0.12)';
            for (let x = p.x + 24; x < p.x + p.ancho - 8; x += 32) {
                ctx.beginPath();
                ctx.moveTo(x, p.y + 8);
                ctx.lineTo(x - 6, p.y + Math.min(p.alto - 5, 18));
                ctx.stroke();
            }
            ctx.fillStyle = 'hsl(184 91% 73% / 0.62)';
            if (p.ancho > 65 && p.alto > 14) {
                ctx.fillRect(p.x + 10, p.y + Math.min(12, p.alto - 5), 3, 3);
                ctx.fillRect(p.x + p.ancho - 13, p.y + Math.min(12, p.alto - 5), 3, 3);
            }
            ctx.restore();
        }
    }

    // Bola luminosa con mirada y rastro en función de la velocidad real.
    dibujarJugador(jugador, tiempo) {
        const ctx = this.ctx;
        const c = this.colores;
        const { x, y, radio, vx, vy } = jugador;
        const movimiento = Math.hypot(vx, vy);

        ctx.save();
        // Estela decorativa; no cambia posición ni tamaño de la hitbox.
        if (movimiento > 0.5) {
            for (let i = 3; i >= 1; i--) {
                const px = x - vx * i * 1.6;
                const py = y - vy * i * 1.0;
                ctx.globalAlpha = 0.07 + (4 - i) * 0.055;
                ctx.fillStyle = c.cian;
                ctx.beginPath();
                ctx.arc(px, py, radio * (0.75 + i * 0.1), 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;

        const aura = ctx.createRadialGradient(x, y, radio * 0.55, x, y, radio * 2.9);
        aura.addColorStop(0, 'hsl(180 100% 66% / 0.22)');
        aura.addColorStop(1, 'hsl(180 100% 66% / 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(x, y, radio * 2.9, 0, Math.PI * 2);
        ctx.fill();

        const cuerpo = ctx.createRadialGradient(x - radio * 0.35, y - radio * 0.4, 2, x, y, radio * 1.2);
        cuerpo.addColorStop(0, 'hsl(174 100% 91%)');
        cuerpo.addColorStop(0.45, c.cian);
        cuerpo.addColorStop(1, 'hsl(192 88% 35%)');
        ctx.shadowColor = c.cian;
        ctx.shadowBlur = 15;
        ctx.fillStyle = cuerpo;
        ctx.beginPath();
        ctx.arc(x, y, radio, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Expresión pequeña y legible; mirada según la dirección.
        const mirada = Math.max(-2, Math.min(2, vx * 0.6));
        ctx.fillStyle = 'hsl(229 50% 15%)';
        ctx.beginPath();
        ctx.arc(x - radio * 0.29 + mirada, y - radio * 0.10, Math.max(1.3, radio * 0.11), 0, Math.PI * 2);
        ctx.arc(x + radio * 0.28 + mirada, y - radio * 0.10, Math.max(1.3, radio * 0.11), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'hsl(229 50% 15% / 0.75)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(x + mirada, y + radio * 0.04, radio * 0.36, 0.19, Math.PI - 0.19);
        ctx.stroke();

        // Chispa alrededor del jugador (puramente decorativa).
        const angulo = tiempo * 1.5;
        ctx.fillStyle = 'hsl(180 100% 90% / 0.78)';
        ctx.beginPath();
        ctx.arc(x + Math.cos(angulo) * radio * 1.65, y + Math.sin(angulo) * radio * 1.5, 1.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    dibujarLlave(llave, tiempo) {
        if (llave.recogida) return;
        const ctx = this.ctx;
        const c = this.colores;
        const { x, y } = llave;
        const oscilacion = Math.sin(tiempo * 2.4) * 3.5;
        const radio = llave.radio;

        ctx.save();
        ctx.translate(x, y + oscilacion);
        ctx.rotate(Math.sin(tiempo * 1.4) * 0.12);

        // Halo que no altera la posición física de la llave.
        const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, 28);
        halo.addColorStop(0, 'hsl(44 100% 68% / 0.36)');
        halo.addColorStop(1, 'hsl(44 100% 68% / 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.fill();

        // El conjunto queda dentro de la antigua zona circular de colisión.
        ctx.shadowColor = c.dorado;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = c.dorado;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(-radio * 0.32, -radio * 0.24, radio * 0.40, 0, Math.PI * 2);
        ctx.moveTo(-radio * 0.03, radio * 0.02);
        ctx.lineTo(radio * 0.73, radio * 0.75);
        ctx.moveTo(radio * 0.44, radio * 0.45);
        ctx.lineTo(radio * 0.15, radio * 0.75);
        ctx.moveTo(radio * 0.64, radio * 0.64);
        ctx.lineTo(radio * 0.42, radio * 0.85);
        ctx.stroke();
        ctx.restore();
    }

    dibujarPuerta(puerta, tiempo) {
        const ctx = this.ctx;
        const c = this.colores;
        const { x, y, ancho, alto, abierta } = puerta;
        const centroX = x + ancho / 2;
        const centroY = y + alto / 2;
        ctx.save();

        // Marco situado dentro del rectángulo del Modelo.
        const marco = ctx.createLinearGradient(x, y, x + ancho, y);
        marco.addColorStop(0, 'hsl(256 31% 38%)');
        marco.addColorStop(0.5, 'hsl(270 42% 53%)');
        marco.addColorStop(1, 'hsl(256 31% 24%)');
        ctx.fillStyle = marco;
        this.rectanguloRedondeado(x, y, ancho, alto, 9);
        ctx.fill();

        const borde = abierta ? c.cian : c.violeta;
        ctx.shadowColor = borde;
        ctx.shadowBlur = abierta ? 21 : 9;
        ctx.strokeStyle = borde;
        ctx.lineWidth = 2.5;
        this.rectanguloRedondeado(x + 3, y + 3, ancho - 6, alto - 6, 7);
        ctx.stroke();
        ctx.shadowBlur = 0;

        const interior = ctx.createLinearGradient(x, y, x + ancho, y + alto);
        interior.addColorStop(0, abierta ? 'hsl(180 90% 28%)' : 'hsl(246 59% 11%)');
        interior.addColorStop(0.5, abierta ? 'hsl(280 80% 43%)' : 'hsl(267 52% 25%)');
        interior.addColorStop(1, abierta ? 'hsl(190 99% 38%)' : 'hsl(245 50% 12%)');
        ctx.fillStyle = interior;
        this.rectanguloRedondeado(x + 7, y + 8, ancho - 14, alto - 15, 5);
        ctx.fill();

        // Óvalo energético en la parte central, animado cuando la puerta está abierta.
        ctx.save();
        ctx.translate(centroX, centroY);
        ctx.scale(0.7, 1);
        for (let i = 2; i >= 0; i--) {
            const pulso = abierta ? Math.sin(tiempo * 3.1 - i * 0.8) * 2.5 : 0;
            ctx.beginPath();
            ctx.ellipse(0, 0, 12 + i * 3 + pulso, Math.max(10, alto * 0.29 + i * 7), 0, 0, Math.PI * 2);
            ctx.strokeStyle = abierta
                ? `hsl(183 100% 72% / ${0.9 - i * 0.25})`
                : `hsl(281 95% 76% / ${0.32 - i * 0.09})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();

        // Punto de estado, visible además de por el color.
        ctx.fillStyle = abierta ? c.cian : c.dorado;
        ctx.beginPath();
        ctx.arc(centroX, y + 10, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Camino reutilizable: evita depender de ctx.roundRect() para navegadores antiguos.
    rectanguloRedondeado(x, y, ancho, alto, radio) {
        const ctx = this.ctx;
        const r = Math.max(0, Math.min(radio, ancho / 2, alto / 2));
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + ancho - r, y);
        ctx.quadraticCurveTo(x + ancho, y, x + ancho, y + r);
        ctx.lineTo(x + ancho, y + alto - r);
        ctx.quadraticCurveTo(x + ancho, y + alto, x + ancho - r, y + alto);
        ctx.lineTo(x + r, y + alto);
        ctx.quadraticCurveTo(x, y + alto, x, y + alto - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}
