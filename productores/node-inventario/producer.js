// Productor de inventario (Node.js + amqplib).
// Publica 'inventario.actualizado' o 'inventario.agotado' en el exchange topic 'tienda.eventos'.
const amqp = require('amqplib');
const crypto = require('crypto');

const HOST = process.env.RABBITMQ_HOST || 'localhost';
const PORT = process.env.RABBITMQ_PORT || '5672';
const USER = process.env.RABBITMQ_USER || 'admin';
const PASS = process.env.RABBITMQ_PASS || 'admin123';
const NODO = process.env.NODO || 'nodo-local';
const INTERVALO_MS = parseFloat(process.env.INTERVALO_SEG || '5') * 1000;
const EXCHANGE = 'tienda.eventos';

const PRODUCTOS = ['Laptop', 'Mouse', 'Teclado', 'Monitor', 'Audifonos', 'Webcam'];
const BODEGAS = ['bodega-norte', 'bodega-sur', 'bodega-centro'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function conectar() {
  const url = `amqp://${encodeURIComponent(USER)}:${encodeURIComponent(PASS)}@${HOST}:${PORT}`;
  while (true) {
    try {
      return await amqp.connect(url, { clientProperties: { connection_name: `productor-node@${NODO}` } });
    } catch (err) {
      console.log(`[productor-node] RabbitMQ en ${HOST}:${PORT} no disponible, reintentando en 3s...`);
      await sleep(3000);
    }
  }
}

async function main() {
  const conexion = await conectar();
  conexion.on('close', () => { console.log('[productor-node] conexion cerrada, saliendo'); process.exit(1); });
  const canal = await conexion.createChannel();
  await canal.assertExchange(EXCHANGE, 'topic', { durable: true });
  console.log(`[productor-node] Conectado a ${HOST}:${PORT}, publicando en '${EXCHANGE}'`);

  while (true) {
    const stock = Math.floor(Math.random() * 50);
    const tipo = stock === 0 || stock < 5 ? 'inventario.agotado' : 'inventario.actualizado';
    const evento = {
      id: crypto.randomUUID(),
      tipo,
      origen: 'productor-node',
      lenguaje: 'JavaScript (Node.js)',
      nodo: NODO,
      timestamp: new Date().toISOString(),
      datos: { producto: pick(PRODUCTOS), bodega: pick(BODEGAS), stock },
    };
    canal.publish(EXCHANGE, tipo, Buffer.from(JSON.stringify(evento)), {
      contentType: 'application/json',
      persistent: true,
    });
    console.log(`[productor-node] -> ${tipo} ${JSON.stringify(evento.datos)}`);
    await sleep(INTERVALO_MS);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
