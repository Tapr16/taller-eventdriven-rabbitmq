# Taller Event-Driven multilenguaje con RabbitMQ y Docker

**Integrantes:** David Esteban Suarez Lozano (2221909) · Thomas Alejandro Perez Rojas (2221906) ·
Jesus David Santodomingo Carrascal (2221922)

Sistema de eventos de una **tienda en línea**. 4 productores y 4 consumidores escritos en
**Python, Java, JavaScript (Node.js) y Go**, cada uno en su propio contenedor, comunicados solo a
través de un broker RabbitMQ (AMQP 0-9-1).

> No hace falta instalar Python, Java, Maven, Node ni Go en el PC: cada `Dockerfile` compila el
> servicio dentro de un contenedor. Solo se necesita **Docker Desktop**.

## Estructura

```
taller-rabbitmq/
├── productores/
│   ├── python-ordenes/       orden.creada
│   ├── java-pagos/           pago.aprobado | pago.rechazado
│   ├── node-inventario/      inventario.actualizado | inventario.agotado
│   └── go-envios/            envio.despachado | envio.entregado
├── consumidores/
│   ├── python-notificaciones/  cola q.notificaciones  ← orden.creada, envio.*
│   ├── java-facturacion/       cola q.facturacion     ← pago.aprobado, pago.rechazado
│   ├── node-auditoria/         cola q.auditoria       ← #  (todo) + UI web :8080
│   └── go-analitica/           cola q.analitica       ← orden.*, inventario.*, pago.*
├── escenario1-centralizado/docker-compose.yml
├── escenario2-dos-nodos/
│   ├── nodo1-servicios/docker-compose.yml (+ .env)
│   └── nodo2-broker/docker-compose.yml
├── escenario3-tres-nodos/
│   ├── nodo1/docker-compose.yml (+ .env)     Python + Java
│   ├── nodo2/docker-compose.yml (+ .env)     Node.js + Go
│   └── nodo3-broker/docker-compose.yml
├── entrega/
│   ├── Informe-Taller-RabbitMQ.docx / .pdf        informe final (4 páginas)
│   ├── Presentacion-Taller-RabbitMQ.pptx / .pdf   diapositivas
│   ├── diagramas/           diagramas de arquitectura (Graphviz)
│   └── _build/              scripts que generan informe, diapos y diagramas
├── evidencias/              capturas y logs de los 3 escenarios
├── arreglar-docker.ps1      arranca Docker en los PCs de la U si falla
└── INFORME-base.md          borrador del informe
```

## Topología AMQP

- **Exchange**: `tienda.eventos`, tipo `topic`, durable.
- **Routing key** = tipo de evento (`dominio.accion`).
- **Colas** durables, una por consumidor, con *bindings* que usan comodines `*` y `#`.
- Mensajes persistentes (`delivery_mode=2`), ack manual y `prefetch` en los consumidores.
- Credenciales: `admin` / `admin123` (el usuario `guest` de RabbitMQ solo acepta conexiones desde
  localhost, por eso no sirve en los escenarios distribuidos).

Cada evento es un JSON:

```json
{ "id": "…uuid…", "tipo": "pago.aprobado", "origen": "productor-java", "lenguaje": "Java",
  "nodo": "esc3-nodo1", "timestamp": "2026-10-28T13:20:00Z",
  "datos": { "orden_id": 4576, "monto": 1498.11, "metodo": "pse" } }
```

El campo `nodo` permite ver en los logs desde qué máquina salió cada evento.

---

## 0. Antes de empezar (PCs de la universidad)

Abre Docker Desktop. Si muestra *"rename …sock …sock.stale: El sistema no tiene acceso al archivo"*,
ciérralo y ejecuta en PowerShell, dentro de esta carpeta:

```bash
powershell -ExecutionPolicy Bypass -File .\arreglar-docker.ps1
```

## 1. Escenario 1 — Centralizado (1 nodo)

```bash
cd escenario1-centralizado
docker compose up --build
```

- Panel RabbitMQ: <http://localhost:15672> (admin / admin123) → pestañas **Exchanges** (`tienda.eventos` → Bindings) y **Queues**.
- UI de eventos en vivo: <http://localhost:8080>
- Detener: `Ctrl+C` y luego `docker compose down`.

## 2. Escenario 2 — Distribuido en 2 nodos

| PC | Carpeta | Comando |
|----|---------|---------|
| Nodo 2 (broker) | `escenario2-dos-nodos/nodo2-broker` | `docker compose up -d` |
| Nodo 1 (servicios) | `escenario2-dos-nodos/nodo1-servicios` | editar `.env` → `docker compose up --build` |

1. En el **Nodo 2** levanta el broker y averigua su IP con `ipconfig` (p. ej. `10.6.62.18`).
2. En el **Nodo 1** edita `.env` y pon `BROKER_IP=10.6.62.18`.
3. Levanta los servicios en el Nodo 1.

## 3. Escenario 3 — Distribuido en 3 nodos

| PC | Carpeta | Servicios |
|----|---------|-----------|
| Nodo 3 | `escenario3-tres-nodos/nodo3-broker` | RabbitMQ |
| Nodo 1 | `escenario3-tres-nodos/nodo1` | productores Python + Java, consumidores Python + Java |
| Nodo 2 | `escenario3-tres-nodos/nodo2` | productores Node + Go, consumidores Node (UI) + Go |

Igual que el escenario 2: broker primero, luego en Nodos 1 y 2 poner la IP del Nodo 3 en `.env`
y ejecutar `docker compose up --build`.

En los logs verás eventos cruzando máquinas, por ejemplo en el Nodo 2:

```
[consumidor-go@esc3-nodo2] <- pago.aprobado de productor-java@esc3-nodo1 | ordenes=9 pagos_ok=7 ...
```

## Probar los escenarios 2 y 3 en un solo PC

Los `.env` traen `BROKER_IP=host.docker.internal`, así que puedes levantar todos los nodos en el
mismo PC (cada uno desde su carpeta) y los servicios se conectan al broker por la red del host, no
por la red interna de Docker — igual que desde otra máquina. Útil para ensayar antes de la clase.

## Si un nodo no se conecta al broker

En el log aparece `RabbitMQ en X:5672 no disponible, reintentando en 3s...` (todos los servicios
reintentan solos). Revisa:

1. Desde el nodo cliente: `Test-NetConnection 10.6.62.18 -Port 5672` → debe decir `TcpTestSucceeded : True`.
2. Que ambos PCs estén en la misma red/subred.
3. **Firewall de Windows** en el PC broker: debe permitir la entrada por 5672 y 15672. Docker Desktop
   normalmente crea la regla al instalarse; si no, se necesita una cuenta de administrador
   (pídelo al monitor de la sala) o usar un portátil propio como broker.

## Comandos útiles

```bash
docker compose ps                       # estado de los contenedores
docker compose logs -f consumidor-go    # seguir el log de un servicio
docker compose down                     # apagar y borrar contenedores
docker compose down -v                  # además borra volúmenes
```
