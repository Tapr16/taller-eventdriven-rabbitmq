// Consumidor de auditoria (Node.js + amqplib).
// Cola 'q.auditoria' enlazada a '#': recibe TODOS los eventos del sistema.
// Ademas sirve una pagina web (puerto 8080) que muestra los eventos en vivo (extension UI del taller).
const amqp = require('amqplib');
const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = process.env.RABBITMQ_HOST || 'localhost';
const PORT = process.env.RABBITMQ_PORT || '5672';
const USER = process.env.RABBITMQ_USER || 'admin';
const PASS = process.env.RABBITMQ_PASS || 'admin123';
const NODO = process.env.NODO || 'nodo-local';
const WEB_PORT = parseInt(process.env.WEB_PORT || '8080', 10);
const EXCHANGE = 'tienda.eventos';
const COLA = 'q.auditoria';
const BINDINGS = ['#'];

const ultimos = [];           // ultimos 200 eventos para clientes nuevos
const conteo = {};            // eventos por tipo
const clientes = new Set();   // conexiones Server-Sent Events abiertas

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function emitir(evento) {
  ultimos.push(evento);
  if (ultimos.length > 200) ultimos.shift();
  conteo[evento.tipo] = (conteo[evento.tipo] || 0) + 1;
  const linea = `data: ${JSON.stringify(evento)}\n\n`;
  for (const res of clientes) res.write(linea);
}

const html = fs.readFileSync(path.join(__dirname, 'index.html'));
http.createServer((req, res) => {
  if (req.url === '/eventos') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    for (const ev of ultimos) res.write(`data: ${JSON.stringify(ev)}\n\n`);
    clientes.add(res);
    req.on('close', () => clientes.delete(res));
  } else if (req.url === '/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(conteo));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
}).listen(WEB_PORT, () => console.log(`[consumidor-node] UI web en http://localhost:${WEB_PORT}`));

async function conectar() {
  const url = `amqp://${encodeURIComponent(USER)}:${encodeURIComponent(PASS)}@${HOST}:${PORT}`;
  while (true) {
    try {
      return await amqp.connect(url, { clientProperties: { connection_name: `consumidor-node@${NODO}` } });
    } catch (err) {
      console.log(`[consumidor-node] RabbitMQ en ${HOST}:${PORT} no disponible, reintentando en 3s...`);
      await sleep(3000);
    }
  }
}

async function main() {
  const conexion = await conectar();
  conexion.on('close', () => { console.log('[consumidor-node] conexion cerrada, saliendo'); process.exit(1); });
  const canal = await conexion.createChannel();
  await canal.assertExchange(EXCHANGE, 'topic', { durable: true });
  await canal.assertQueue(COLA, { durable: true });
  for (const clave of BINDINGS) await canal.bindQueue(COLA, EXCHANGE, clave);
  await canal.prefetch(20);

  console.log(`[consumidor-node] Escuchando '${COLA}' con bindings ${JSON.stringify(BINDINGS)}`);
  await canal.consume(COLA, (msg) => {
    const evento = JSON.parse(msg.content.toString());
    evento.recibido_en = NODO;
    console.log(`[consumidor-node@${NODO}] <- ${evento.tipo} de ${evento.origen}@${evento.nodo} | AUDITORIA id=${evento.id.slice(0, 8)}`);
    emitir(evento);
    canal.ack(msg);
  });
}

main().catch((err) => { console.error(err); process.exit(1); });
