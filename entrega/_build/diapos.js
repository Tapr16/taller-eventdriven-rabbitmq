// Genera entrega/Presentacion-Taller-RabbitMQ.pptx
const path = require("path");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require(process.env.PPTX_SKILL + "/scripts/apply_theme.js");

const RAIZ = path.resolve(__dirname, "..", "..");
const DG = (f) => path.join(RAIZ, "entrega", "diagramas", f);
const EV = (f) => path.join(RAIZ, "evidencias", f);
const OUT = path.join(RAIZ, "entrega", "Presentacion-Taller-RabbitMQ.pptx");

const THEME = {
  name: "Event-Driven RabbitMQ",
  headFontFace: "Arial",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1F2A37", lt1: "FFFFFF", dk2: "2B3A4B", lt2: "F3F5F8",
    accent1: "F26B1D", accent2: "2496ED", accent3: "3776AB", accent4: "B07219",
    accent5: "3C873A", accent6: "00ADD8", hlink: "2496ED", folHlink: "6B7280",
  },
};
const HEX = { dark: "1F2A37", orange: "F26B1D", light: "F3F5F8", muted: "5B6675", code: "17202B" };
const LANG = { Python: "3776AB", Java: "B07219", "Node.js": "3C873A", Go: "00ADD8" };

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "Arquitectura Event-Driven multilenguaje con RabbitMQ y Docker";
const C = pres.SchemeColor;

// ---------- Layouts ----------
pres.defineSlideMaster({
  title: "PORTADA",
  background: { color: C.text1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 1.2, w: 8.8, h: 1.9, fontSize: 34, bold: true, color: C.background1, valign: "bottom", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.6, y: 3.3, w: 8.8, h: 0.8, fontSize: 16, color: "F7B38A", valign: "top", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENIDO",
  background: { color: C.background1 },
  slideNumber: { x: 9.2, y: 5.2, w: 0.5, h: 0.3, fontSize: 10, color: "8A94A3" },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.25, w: 9.0, h: 0.75, fontSize: 28, bold: true, color: C.text1, valign: "middle", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CIERRE",
  background: { color: C.text1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.5, y: 0.35, w: 9.0, h: 0.8, fontSize: 32, bold: true, color: C.background1, valign: "middle", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.5, y: 1.4, w: 9.0, h: 3.7, fontSize: 18, color: C.background1, valign: "top" }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "SECCION",
  background: { color: C.accent1 },
  slideNumber: { x: 9.2, y: 5.2, w: 0.5, h: 0.3, fontSize: 10, color: "FFFFFF" },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 1.9, w: 8.8, h: 1.1, fontSize: 40, bold: true, color: C.background1, valign: "middle", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.6, y: 3.0, w: 8.8, h: 0.8, fontSize: 18, color: C.background1, valign: "top", margin: 0 }, text: "" } },
  ],
});

// ---------- helpers ----------
let sec = "";
function slide(master, title, section) {
  if (section && section !== sec) { pres.addSection({ title: section }); sec = section; }
  const s = pres.addSlide({ masterName: master, sectionTitle: sec });
  if (title) s.addText(title, { placeholder: "title" });
  return s;
}
function text(s, t, o) { s.addText(t, { isTextBox: true, fontSize: 14, color: C.text1, valign: "top", ...o }); }
function bullets(s, items, o) {
  s.addText(items.map((it, i) => {
    const runs = typeof it === "string" ? { text: it, options: {} } : it;
    return { text: runs.text, options: { bullet: { indent: 14 }, breakLine: i < items.length - 1, ...runs.options } };
  }), { isTextBox: true, fontSize: 14, color: C.text1, valign: "top", paraSpaceAfter: 6, ...o });
}
function code(s, src, o) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: o.x, y: o.y, w: o.w, h: o.h, fill: { color: HEX.code }, line: { type: "none" }, rectRadius: 0.08, objectName: "fondo-codigo" });
  if (o.label) text(s, o.label, { x: o.x + 0.15, y: o.y + 0.08, w: o.w - 0.3, h: 0.25, fontSize: 10, color: "F7B38A", bold: true, margin: 0 });
  const top = o.label ? 0.35 : 0.12;
  s.addText(src, { isTextBox: true, x: o.x + 0.15, y: o.y + top, w: o.w - 0.3, h: o.h - top - 0.1, fontFace: "Consolas", fontSize: o.fs || 10, color: "E6EDF3", valign: "top", margin: 0, objectName: "codigo" });
}
function card(s, x, y, w, h, fill, opts = {}) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: opts.line ? { color: opts.line, width: 1 } : { type: "none" }, rectRadius: 0.1,
    shadow: opts.shadow ? { type: "outer", color: "000000", opacity: 0.12, blur: 6, offset: 2, angle: 90 } : undefined, objectName: opts.name || "tarjeta" });
}
function badge(s, x, y, n, color = C.accent1) {
  s.addShape(pres.shapes.OVAL, { x, y, w: 0.42, h: 0.42, fill: { color }, line: { type: "none" }, objectName: "numero" });
  s.addText(String(n), { isTextBox: true, x, y, w: 0.42, h: 0.42, fontSize: 14, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0 });
}
function img(s, file, x, y, maxW, maxH, pxW, pxH, alt) {
  const r = Math.min(maxW / pxW, maxH / pxH);
  const w = pxW * r, h = pxH * r;
  s.addImage({ path: file, x: x + (maxW - w) / 2, y: y + (maxH - h) / 2, w, h, altText: alt });
}
function caption(s, t, x, y, w) { text(s, t, { x, y, w, h: 0.3, fontSize: 10, color: HEX.muted, italic: true, align: "center", margin: 0 }); }

// =========================================================
// 1. Portada
let s = slide("PORTADA", "Arquitectura Event-Driven multilenguaje con RabbitMQ y Docker", "Inicio");
s.addText("4 productores · 4 consumidores · 4 lenguajes · 3 escenarios de despliegue", { placeholder: "body" });
["Python", "Java", "Node.js", "Go"].forEach((l, i) => {
  card(s, 0.6 + i * 1.25, 4.45, 1.1, 0.4, LANG[l], { name: "chip-lenguaje" });
  text(s, l, { x: 0.6 + i * 1.25, y: 4.45, w: 1.1, h: 0.4, fontSize: 12, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0 });
});
text(s, "Principios de Arquitectura de Software · Taller en grupo", { x: 0.6, y: 0.5, w: 8.8, h: 0.4, fontSize: 13, color: "AAB4C3", margin: 0 });
text(s, [
  { text: "David Esteban Suarez Lozano · 2221909", options: { breakLine: true } },
  { text: "Thomas Alejandro Perez Rojas · 2221906", options: { breakLine: true } },
  { text: "Jesus David Santodomingo Carrascal · 2221922", options: {} },
], { x: 5.6, y: 4.2, w: 3.9, h: 0.9, fontSize: 12, color: "D5DAE1", align: "right", valign: "bottom", margin: 0, objectName: "integrantes" });
s.addNotes("Presentamos el taller: un sistema de eventos de una tienda en línea con 4 productores y 4 consumidores en Python, Java, Node.js y Go, comunicados únicamente a través de RabbitMQ y desplegados con Docker en tres escenarios.");

// 2. Agenda
s = slide("CONTENIDO", "Agenda", "Inicio");
const agenda = [
  ["Arquitectura", "Estilo event-driven y componentes"],
  ["Conexiones", "AMQP: exchange, bindings y colas"],
  ["Docker Compose", "Dockerfiles y un compose por nodo"],
  ["El código", "Productores y consumidores"],
  ["Roles por escenario", "Qué corre en cada nodo"],
  ["Funcionamiento", "Demo y evidencias"],
];
agenda.forEach(([t, d], i) => {
  const col = i % 3, row = Math.floor(i / 3);
  const x = 0.5 + col * 3.05, y = 1.35 + row * 1.85;
  card(s, x, y, 2.85, 1.55, HEX.light, { shadow: true });
  badge(s, x + 0.2, y + 0.22, i + 1);
  text(s, t, { x: x + 0.75, y: y + 0.2, w: 2.0, h: 0.45, fontSize: 17, bold: true, valign: "middle", margin: 0 });
  text(s, d, { x: x + 0.2, y: y + 0.8, w: 2.5, h: 0.6, fontSize: 13, color: HEX.muted, margin: 0 });
});

// =========================================================
// 3. Arquitectura
s = slide("SECCION", "1 · Arquitectura", "Arquitectura");
s.addText("Event-driven con un broker de mensajes", { placeholder: "body" });

s = slide("CONTENIDO", "Arquitectura event-driven", "Arquitectura");
bullets(s, [
  { text: "Productores publican eventos de dominio sin saber quién los consume", options: {} },
  { text: "RabbitMQ es el único punto de contacto (bus de eventos)", options: {} },
  { text: "Consumidores reaccionan a los eventos que les interesan", options: {} },
  { text: "Comunicación asíncrona y desacoplada: se agregan o mueven servicios sin tocar los demás", options: {} },
], { x: 0.5, y: 1.2, w: 3.6, h: 3.6, fontSize: 15 });
img(s, DG("topologia-amqp.png"), 4.3, 1.15, 5.3, 3.4, 1644, 676, "Topología: productores publican en el exchange topic tienda.eventos, que enruta a 4 colas");
caption(s, "Caso de uso: eventos de una tienda en línea", 4.3, 4.65, 5.3);
s.addNotes("La idea central: nadie llama a nadie directamente. Cada productor publica un evento en RabbitMQ y cada consumidor recibe solo los eventos que le interesan. Eso nos permite tener 4 lenguajes distintos y mover servicios de máquina sin cambiar el código.");

// 4. Servicios
s = slide("CONTENIDO", "Componentes del sistema", "Arquitectura");
const prods = [["Órdenes", "Python · pika", "orden.creada"], ["Pagos", "Java · amqp-client", "pago.aprobado / rechazado"], ["Inventario", "Node.js · amqplib", "inventario.actualizado / agotado"], ["Envíos", "Go · amqp091-go", "envio.despachado / entregado"]];
const conss = [["Notificaciones", "Python", "Correos y SMS al cliente"], ["Facturación", "Java", "Emite facturas o anula órdenes"], ["Auditoría + UI", "Node.js", "Registra todo y lo muestra en web :8080"], ["Analítica", "Go", "Métricas: ventas, pagos, stock"]];
const langs = ["Python", "Java", "Node.js", "Go"];
text(s, "PRODUCTORES", { x: 0.5, y: 1.05, w: 3, h: 0.3, fontSize: 11, bold: true, color: HEX.muted, margin: 0, charSpacing: 2 });
text(s, "CONSUMIDORES", { x: 0.5, y: 3.05, w: 3, h: 0.3, fontSize: 11, bold: true, color: HEX.muted, margin: 0, charSpacing: 2 });
[[prods, 1.4], [conss, 3.4]].forEach(([arr, y]) => arr.forEach(([t, l, d], i) => {
  const x = 0.5 + i * 2.3;
  card(s, x, y, 2.1, 1.5, LANG[langs[i]]);
  text(s, t, { x: x + 0.15, y: y + 0.12, w: 1.8, h: 0.4, fontSize: 16, bold: true, color: C.background1, margin: 0 });
  text(s, l, { x: x + 0.15, y: y + 0.5, w: 1.8, h: 0.3, fontSize: 11, color: C.background1, margin: 0 });
  text(s, d, { x: x + 0.15, y: y + 0.85, w: 1.8, h: 0.55, fontSize: 11, color: C.background1, margin: 0 });
}));
s.addNotes("Tenemos 8 servicios, cada uno en su propio contenedor. Arriba los 4 productores, abajo los 4 consumidores. Cada color es un lenguaje distinto.");

// =========================================================
// 5. Conexiones
s = slide("SECCION", "2 · Conexiones", "Conexiones");
s.addText("AMQP 0-9-1 sobre TCP :5672", { placeholder: "body" });

s = slide("CONTENIDO", "Cómo viaja un evento", "Conexiones");
const pasos = [
  ["Conexión", "TCP al broker :5672, usuario admin, nombre servicio@nodo"],
  ["Publish", "Al exchange tienda.eventos con routing key = tipo de evento"],
  ["Exchange topic", "Compara la routing key con los bindings de cada cola"],
  ["Cola durable", "Guarda el mensaje persistente hasta que se consuma"],
  ["Consume + ack", "El consumidor procesa (prefetch) y confirma con ack manual"],
];
pasos.forEach(([t, d], i) => {
  const x = 0.5 + i * 1.84;
  card(s, x, 1.3, 1.66, 2.0, HEX.light, { shadow: true });
  badge(s, x + 0.62, 1.12, i + 1);
  text(s, t, { x: x + 0.1, y: 1.65, w: 1.46, h: 0.45, fontSize: 14, bold: true, align: "center", margin: 0 });
  text(s, d, { x: x + 0.12, y: 2.1, w: 1.42, h: 1.1, fontSize: 11, color: HEX.muted, align: "center", margin: 0 });
});
s.addTable([
  [{ text: "Cola", options: { bold: true, color: "FFFFFF", fill: { color: HEX.dark } } }, { text: "Bindings (routing keys)", options: { bold: true, color: "FFFFFF", fill: { color: HEX.dark } } }],
  ["q.notificaciones", "orden.creada · envio.*"],
  ["q.facturacion", "pago.aprobado · pago.rechazado"],
  ["q.auditoria", "#  (todos los eventos)"],
  ["q.analitica", "orden.* · inventario.* · pago.*"],
], { x: 0.5, y: 3.55, w: 6.0, colW: [1.9, 4.1], fontSize: 11, color: HEX.dark, border: { type: "solid", color: "D5DAE1", pt: 0.75 }, rowH: 0.29, fontFace: "Calibri" });
card(s, 6.8, 3.55, 2.7, 1.45, "FFE9DC");
text(s, [{ text: "*", options: { bold: true, color: HEX.orange } }, { text: " = exactamente una palabra", options: { breakLine: true } },
  { text: "#", options: { bold: true, color: HEX.orange } }, { text: " = cero o más palabras", options: { breakLine: true } },
  { text: "Un evento puede llegar a varias colas a la vez (pub/sub)", options: { fontSize: 11, color: HEX.muted } }],
  { x: 6.95, y: 3.65, w: 2.45, h: 1.3, fontSize: 13, margin: 0 });
s.addNotes("Cada servicio abre una conexión TCP al puerto 5672. El productor publica en el exchange tienda.eventos usando como routing key el tipo de evento. El exchange es de tipo topic: compara la routing key con los patrones de cada cola. Por ejemplo orden.creada llega a notificaciones, auditoría y analítica al mismo tiempo.");

s = slide("CONTENIDO", "El evento: un contrato JSON común", "Conexiones");
code(s, `{
  "id": "6f1c…-uuid",
  "tipo": "pago.aprobado",   ← routing key
  "origen": "productor-java",
  "lenguaje": "Java",
  "nodo": "esc3-nodo1",      ← nodo origen
  "timestamp": "2026-10-28T14:31:56Z",
  "datos": { "orden_id": 4576,
             "monto": 1498.11,
             "metodo": "pse" }
}`, { x: 0.5, y: 1.2, w: 4.9, h: 3.6, fs: 12, label: "Mensaje (application/json, delivery_mode=2)" });
bullets(s, [
  "JSON es el idioma común: Python, Java, Node.js y Go lo leen sin acoplarse entre sí",
  "Mensajes persistentes en colas durables: sobreviven a un reinicio del broker",
  "El campo nodo y el nombre de la conexión (servicio@nodo) permiten rastrear de qué máquina viene cada evento",
], { x: 5.7, y: 1.3, w: 3.8, h: 3.5, fontSize: 14 });

// =========================================================
// 6. Docker
s = slide("SECCION", "3 · Docker Compose", "Docker Compose");
s.addText("Un contenedor por servicio · un compose por nodo", { placeholder: "body" });

s = slide("CONTENIDO", "Dockerfiles multi-stage", "Docker Compose");
code(s, `# Etapa 1: compilar el binario de Go
FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY *.go ./
RUN go mod tidy && CGO_ENABLED=0 go build -o /app .

# Etapa 2: imagen mínima con solo el binario
FROM alpine:3.20
COPY --from=build /app /app
CMD ["/app"]`, { x: 0.5, y: 1.2, w: 5.2, h: 3.6, fs: 11, label: "productores/go-envios/Dockerfile" });
bullets(s, [
  "Cada servicio se compila dentro de Docker: en los PCs solo hace falta Docker Desktop",
  "Java (Maven → JRE) y Go (golang → alpine) usan multi-stage: imágenes livianas",
  "Python y Node.js: imagen slim + dependencias (pika, amqplib)",
], { x: 6.0, y: 1.3, w: 3.5, h: 3.5, fontSize: 14 });

s = slide("CONTENIDO", "Escenario 1: un solo docker-compose.yml", "Docker Compose");
code(s, `services:
  rabbitmq:
    image: rabbitmq:3-management
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin123
    ports: ["5672:5672", "15672:15672"]
    healthcheck:
      test: ["CMD","rabbitmq-diagnostics","-q",
             "check_port_connectivity"]

  productor-python:
    build: ../productores/python-ordenes
    environment: *rabbit-env   # RABBITMQ_HOST: rabbitmq
    depends_on:
      rabbitmq: { condition: service_healthy }
  # … 3 productores y 4 consumidores más`, { x: 0.5, y: 1.2, w: 5.6, h: 3.75, fs: 10.5, label: "escenario1-centralizado/docker-compose.yml" });
bullets(s, [
  "9 contenedores en la misma red Docker",
  "Los servicios encuentran al broker por nombre: rabbitmq",
  "healthcheck + depends_on: los servicios esperan a que el broker esté listo",
  "Anclas YAML (x-rabbit-env) para no repetir la configuración",
], { x: 6.4, y: 1.3, w: 3.1, h: 3.6, fontSize: 13 });

s = slide("CONTENIDO", "Escenarios 2 y 3: un compose por nodo", "Docker Compose");
const H = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: HEX.dark } } });
s.addTable([
  [H("Escenario"), H("Archivo"), H("Contenido")],
  ["2", "nodo1-servicios/docker-compose.yml", "4 productores + 4 consumidores"],
  ["2", "nodo2-broker/docker-compose.yml", "RabbitMQ"],
  ["3", "nodo1/docker-compose.yml", "Python + Java (prod. y cons.)"],
  ["3", "nodo2/docker-compose.yml", "Node.js + Go (prod. y cons.)"],
  ["3", "nodo3-broker/docker-compose.yml", "RabbitMQ"],
], { x: 0.5, y: 1.2, w: 5.6, colW: [0.8, 2.75, 2.05], fontSize: 10.5, color: HEX.dark, border: { type: "solid", color: "D5DAE1", pt: 0.75 }, rowH: 0.36, fontFace: "Calibri" });
code(s, `# .env del nodo de servicios
BROKER_IP=10.6.62.18
BROKER_PORT=5672
RABBITMQ_USER=admin
RABBITMQ_PASS=admin123

# docker-compose.yml
RABBITMQ_HOST: \${BROKER_IP}
NODO: esc3-nodo1`, { x: 6.4, y: 1.2, w: 3.1, h: 2.8, fs: 10, label: ".env → variables" });
text(s, "Mismas imágenes y mismo código en los 3 escenarios: solo cambia dónde corre cada contenedor y la IP del broker", { x: 0.5, y: 4.15, w: 5.6, h: 0.8, fontSize: 14, bold: true, color: HEX.orange, margin: 0 });
text(s, "El broker expone 5672 (AMQP) y 15672 (panel) a la LAN", { x: 6.4, y: 4.15, w: 3.1, h: 0.6, fontSize: 12, color: HEX.muted, margin: 0 });

// =========================================================
// 7. Código
s = slide("SECCION", "4 · El código", "El código");
s.addText("El mismo patrón en 4 lenguajes", { placeholder: "body" });

s = slide("CONTENIDO", "Productor (Python + pika)", "El código");
code(s, `canal.exchange_declare(exchange="tienda.eventos",
                       exchange_type="topic", durable=True)
while True:
    evento = {"id": str(uuid.uuid4()),
              "tipo": "orden.creada",
              "origen": "productor-python",
              "nodo": NODO,
              "datos": {...}}
    canal.basic_publish(
        exchange="tienda.eventos",
        routing_key=evento["tipo"],
        body=json.dumps(evento),
        properties=pika.BasicProperties(
            content_type="application/json",
            delivery_mode=2))          # persistente
    conexion.sleep(INTERVALO)`, { x: 0.5, y: 1.2, w: 5.6, h: 3.75, fs: 11, label: "productores/python-ordenes/producer.py" });
[["1", "Conecta con reintento", "Si el broker no está listo, reintenta cada 3 s"], ["2", "Declara el exchange", "Idempotente: todos lo declaran igual"], ["3", "Publica cada 3 s", "routing key = tipo del evento"]].forEach(([n, t, d], i) => {
  const y = 1.3 + i * 1.2;
  badge(s, 6.4, y, n);
  text(s, t, { x: 6.95, y: y - 0.02, w: 2.6, h: 0.35, fontSize: 14, bold: true, margin: 0 });
  text(s, d, { x: 6.95, y: y + 0.33, w: 2.6, h: 0.6, fontSize: 12, color: HEX.muted, margin: 0 });
});
s.addNotes("Todos los productores siguen el mismo patrón: conectarse con reintento, declarar el exchange topic y publicar periódicamente un evento JSON con la routing key igual a su tipo. Java, Node y Go hacen exactamente lo mismo con su librería AMQP.");

s = slide("CONTENIDO", "Consumidor (Node.js + amqplib)", "El código");
code(s, `const BINDINGS = ['#'];          // auditoría: todo
await canal.assertExchange(EXCHANGE, 'topic', { durable: true });
await canal.assertQueue(COLA, { durable: true });
for (const clave of BINDINGS)
  await canal.bindQueue(COLA, EXCHANGE, clave);
await canal.prefetch(20);

await canal.consume(COLA, (msg) => {
  const evento = JSON.parse(msg.content.toString());
  console.log(\`<- \${evento.tipo} de \${evento.origen}\`);
  emitir(evento);                 // UI web :8080
  canal.ack(msg);                 // ack manual
});`, { x: 0.5, y: 1.2, w: 5.6, h: 3.75, fs: 10.5, label: "consumidores/node-auditoria/consumer.js" });
[["Cola propia", "Cada consumidor declara su cola durable"], ["Bindings", "Define qué eventos le interesan"], ["prefetch + ack", "No se satura y no pierde mensajes"]].forEach(([t, d], i) => {
  const y = 1.3 + i * 1.2;
  badge(s, 6.4, y, i + 1, C.accent2);
  text(s, t, { x: 6.95, y: y - 0.02, w: 2.6, h: 0.35, fontSize: 14, bold: true, margin: 0 });
  text(s, d, { x: 6.95, y: y + 0.33, w: 2.6, h: 0.6, fontSize: 12, color: HEX.muted, margin: 0 });
});
s.addNotes("El consumidor declara su propia cola, la enlaza al exchange con sus bindings y consume con ack manual. Si el consumidor se cae antes del ack, el mensaje vuelve a la cola. El de auditoría además reenvía cada evento a una página web por Server-Sent Events.");

// =========================================================
// 8. Roles por escenario
s = slide("SECCION", "5 · Roles por escenario", "Roles por escenario");
s.addText("Qué corre en cada nodo", { placeholder: "body" });

function escenario(titulo, file, pw, ph, roles, nota) {
  const sl = slide("CONTENIDO", titulo, "Roles por escenario");
  img(sl, DG(file), 0.4, 1.05, 9.2, 3.1, pw, ph, titulo);
  roles.forEach(([n, d, col], i) => {
    const w = (9.0 - (roles.length - 1) * 0.2) / roles.length;
    const x = 0.5 + i * (w + 0.2);
    card(sl, x, 4.25, w, 0.9, HEX.light, { line: col });
    text(sl, n, { x: x + 0.12, y: 4.3, w: w - 0.24, h: 0.32, fontSize: 13, bold: true, color: col, margin: 0 });
    text(sl, d, { x: x + 0.12, y: 4.6, w: w - 0.24, h: 0.5, fontSize: 11, color: HEX.dark, margin: 0 });
  });
  if (nota) sl.addNotes(nota);
  return sl;
}
escenario("Escenario 1 · Centralizado", "escenario1.png", 2225, 945, [
  ["Nodo único", "Broker + 4 productores + 4 consumidores (9 contenedores). Red interna de Docker, broker por nombre", "F26B1D"],
], "Todo en una sola máquina y un solo docker-compose. Es el caso base: la comunicación pasa por la red virtual de Docker.");
escenario("Escenario 2 · Distribuido en 2 nodos", "escenario2.png", 2370, 1053, [
  ["Nodo 1 · PC B (10.6.62.137)", "Servicios: los 4 productores y los 4 consumidores", "2496ED"],
  ["Nodo 2 · PC A (10.6.62.18)", "Broker RabbitMQ: exchange, colas y panel de administración", "F26B1D"],
], "El broker queda aislado en otra máquina. Los servicios se conectan por la LAN usando la IP del broker en el .env. Un evento sale del PC B, va al PC A y vuelve al PC B.");
escenario("Escenario 3 · Distribuido en 3 nodos", "escenario3.png", 2546, 870, [
  ["Nodo 1 · Python + Java", "Prod. órdenes y pagos · Cons. notificaciones y facturación", "3776AB"],
  ["Nodo 3 · Broker", "RabbitMQ: enruta eventos entre los dos nodos de servicios", "F26B1D"],
  ["Nodo 2 · Node.js + Go", "Prod. inventario y envíos · Cons. auditoría (UI) y analítica", "3C873A"],
], "Los servicios se reparten en dos nodos y el broker en un tercero. Los nodos 1 y 2 nunca hablan directamente: todo pasa por el nodo 3. Por disponibilidad de equipos el Nodo 1 y el broker compartieron PC, pero como proyectos compose separados conectados por la IP de red.");

s = slide("CONTENIDO", "Resumen de roles", "Roles por escenario");
s.addTable([
  [H(""), H("Broker"), H("Productores"), H("Consumidores"), H("Archivos compose")],
  [{ text: "Escenario 1", options: { bold: true } }, "Nodo único", "Nodo único (4)", "Nodo único (4)", "1"],
  [{ text: "Escenario 2", options: { bold: true } }, "Nodo 2 (PC A)", "Nodo 1 (4)", "Nodo 1 (4)", "2"],
  [{ text: "Escenario 3", options: { bold: true } }, "Nodo 3", "Nodo 1: Python, Java\nNodo 2: Node.js, Go", "Nodo 1: Python, Java\nNodo 2: Node.js, Go", "3"],
], { x: 0.5, y: 1.25, w: 9.0, colW: [1.5, 1.6, 2.3, 2.3, 1.3], fontSize: 13, color: HEX.dark, border: { type: "solid", color: "D5DAE1", pt: 0.75 }, rowH: [0.42, 0.5, 0.5, 0.75], fontFace: "Calibri", valign: "middle" });
card(s, 0.5, 3.75, 9.0, 1.0, "FFE9DC");
text(s, "En los tres escenarios el broker es el único servicio al que todos se conectan: los productores y consumidores nunca se conocen entre sí.", { x: 0.7, y: 3.8, w: 8.6, h: 0.9, fontSize: 15, bold: true, color: HEX.dark, valign: "middle", margin: 0 });

// =========================================================
// 9. Funcionamiento
s = slide("SECCION", "6 · Funcionamiento", "Funcionamiento");
s.addText("Demo en vivo y evidencias", { placeholder: "body" });

s = slide("CONTENIDO", "Demo: cómo se levanta", "Funcionamiento");
code(s, `# Escenario 1 (un PC)
cd escenario1-centralizado
docker compose up --build

# Escenarios 2 y 3
# 1) PC broker
cd escenario3-tres-nodos/nodo3-broker
docker compose up -d
# 2) PCs de servicios: poner BROKER_IP en .env
cd escenario3-tres-nodos/nodo2
docker compose up --build`, { x: 0.5, y: 1.2, w: 4.6, h: 3.75, fs: 11, label: "Terminal" });
[["Panel RabbitMQ", "http://<broker>:15672 → Connections, Exchanges, Queues"], ["UI de eventos", "http://<nodo>:8080 → eventos en vivo"], ["Logs", "docker compose logs -f consumidor-go"]].forEach(([t, d], i) => {
  const y = 1.25 + i * 1.25;
  card(s, 5.4, y, 4.1, 1.05, HEX.light, { shadow: true });
  text(s, t, { x: 5.6, y: y + 0.1, w: 3.7, h: 0.35, fontSize: 15, bold: true, margin: 0 });
  text(s, d, { x: 5.6, y: y + 0.48, w: 3.7, h: 0.5, fontSize: 12, color: HEX.muted, margin: 0 });
});
s.addNotes("Aquí hacemos la demo en vivo: levantar el escenario, mostrar el panel de RabbitMQ (conexiones, exchange con bindings y colas), los logs de los consumidores y la UI web.");

s = slide("CONTENIDO", "Evidencia: panel de RabbitMQ", "Funcionamiento");
img(s, EV("escenario1/07-rabbitmq-exchange-bindings.jpg"), 0.5, 1.1, 2.9, 3.4, 800, 953, "Exchange tienda.eventos con sus bindings");
img(s, EV("escenario3/pcA-04-rabbitmq-connections.jpg"), 3.55, 1.1, 2.9, 3.4, 800, 693, "Conexiones desde esc3-nodo1 y esc3-nodo2");
img(s, EV("escenario1/08-rabbitmq-queues.jpg"), 6.6, 1.1, 2.9, 3.4, 800, 692, "4 colas con 1 consumidor");
caption(s, "Exchange topic + 8 bindings", 0.5, 4.6, 2.9);
caption(s, "Esc. 3: 4 conexiones @nodo1 y 4 @nodo2", 3.55, 4.6, 2.9);
caption(s, "4 colas durables, 1 consumidor c/u", 6.6, 4.6, 2.9);

s = slide("CONTENIDO", "Evidencia: eventos cruzando nodos", "Funcionamiento");
img(s, EV("escenario2/04-logs-consumidores.jpg"), 0.5, 1.1, 9.0, 1.7, 1713, 519, "Logs de los 4 consumidores en el escenario 2");
caption(s, "Escenario 2: los 4 consumidores del PC B procesan eventos vía el broker del PC A", 0.5, 2.85, 9.0);
code(s, `[consumidor-go@esc3-nodo2] <- pago.aprobado de productor-java@esc3-nodo1
[consumidor-python@esc3-nodo1] <- envio.entregado de productor-go@esc3-nodo2`,
  { x: 0.5, y: 3.3, w: 9.0, h: 0.85, fs: 11, label: "Escenario 3: tráfico cruzado Nodo 1 ↔ Nodo 2" });
text(s, "Un evento publicado en Java (Nodo 1) lo consume Go (Nodo 2), y viceversa, sin conexión directa entre ellos", { x: 0.5, y: 4.3, w: 9.0, h: 0.5, fontSize: 14, bold: true, color: HEX.orange, margin: 0 });

s = slide("CONTENIDO", "Evidencia: UI web de auditoría", "Funcionamiento");
img(s, EV("escenario3/02-ui-web-eventos.png"), 0.5, 1.1, 5.6, 4.0, 1400, 1000, "UI web con eventos de ambos nodos del escenario 3");
bullets(s, [
  "Consumidor Node.js con binding # recibe todos los eventos",
  "Los reenvía al navegador en tiempo real",
  "Columna «Nodo origen»: eventos de esc3-nodo1 y esc3-nodo2 en la misma vista",
], { x: 6.4, y: 1.3, w: 3.1, h: 3.5, fontSize: 14 });

// =========================================================
// 10. Cierre
s = slide("CONTENIDO", "Comparación entre escenarios", "Cierre");
[["Centralizado", "F26B1D", ["Configuración mínima", "Latencia muy baja", "Logs en un solo lugar"], ["Cae el nodo → cae todo", "Limitado a una máquina"]],
 ["2 nodos", "2496ED", ["Broker aislado, sin competir por recursos", "Si cae Nodo 1, los mensajes esperan en cola"], ["Requiere IP, puertos y firewall", "Un salto de red más"]],
 ["3 nodos", "3C873A", ["Carga repartida", "Si cae un nodo de servicios, el otro sigue"], ["Más coordinación y logs repartidos", "Broker = punto único de falla"]]].forEach(([t, col, pros, cons], i) => {
  const x = 0.5 + i * 3.05;
  card(s, x, 1.15, 2.85, 3.85, HEX.light, { line: col });
  text(s, t, { x: x + 0.2, y: 1.25, w: 2.45, h: 0.45, fontSize: 18, bold: true, color: col, margin: 0 });
  bullets(s, pros.map((p) => ({ text: "+ " + p, options: { bullet: false } })), { x: x + 0.2, y: 1.85, w: 2.5, h: 1.6, fontSize: 14, paraSpaceAfter: 4, margin: 0 });
  bullets(s, cons.map((p) => ({ text: "– " + p, options: { bullet: false, color: "9B2C2C" } })), { x: x + 0.2, y: 3.45, w: 2.5, h: 1.45, fontSize: 14, paraSpaceAfter: 4, margin: 0 });
});

s = slide("CONTENIDO", "Retos técnicos", "Cierre");
[["guest solo es local", "Usuario admin propio para conexiones remotas"],
 ["Arranque antes que el broker", "Reintento de conexión + healthcheck/depends_on"],
 ["NAT de Docker Desktop", "Conexiones nombradas servicio@nodo e IP real con Get-NetTCPConnection"],
 ["Firewall y PCs compartidos", "Puerto 5672 en la LAN y script arreglar-docker.ps1"]].forEach(([t, d], i) => {
  const col = i % 2, row = Math.floor(i / 2);
  const x = 0.5 + col * 4.6, y = 1.2 + row * 1.85;
  card(s, x, y, 4.4, 1.6, HEX.light, { shadow: true });
  badge(s, x + 0.2, y + 0.2, i + 1);
  text(s, t, { x: x + 0.8, y: y + 0.18, w: 3.45, h: 0.45, fontSize: 16, bold: true, valign: "middle", margin: 0 });
  text(s, d, { x: x + 0.8, y: y + 0.7, w: 3.45, h: 0.8, fontSize: 13, color: HEX.muted, margin: 0 });
});

s = slide("CIERRE", "Conclusiones", "Cierre");
s.addText([
  { text: "El mismo código funcionó en los 3 escenarios: la topología física queda fuera del código", options: { bullet: true, breakLine: true } },
  { text: "El exchange topic entrega un evento a varios consumidores sin que el productor los conozca", options: { bullet: true, breakLine: true } },
  { text: "Distribuir aísla recursos y tolera caídas de nodos, a cambio de más configuración de red", options: { bullet: true, breakLine: true } },
  { text: "El broker es el punto crítico: en producción se usaría un clúster RabbitMQ", options: { bullet: true } },
], { placeholder: "body", paraSpaceAfter: 14 });

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log(OUT);
})();
