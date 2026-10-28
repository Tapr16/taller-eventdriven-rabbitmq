"""Consumidor de notificaciones (Python + pika).

Cola 'q.notificaciones' enlazada a 'orden.creada' y 'envio.*':
simula el envio de correos al cliente.
"""
import json
import os
import time

import pika

HOST = os.getenv("RABBITMQ_HOST", "localhost")
PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
USER = os.getenv("RABBITMQ_USER", "admin")
PASS = os.getenv("RABBITMQ_PASS", "admin123")
NODO = os.getenv("NODO", "nodo-local")
EXCHANGE = "tienda.eventos"
COLA = "q.notificaciones"
BINDINGS = ["orden.creada", "envio.*"]


def conectar():
    credenciales = pika.PlainCredentials(USER, PASS)
    params = pika.ConnectionParameters(
        HOST, PORT, credentials=credenciales, heartbeat=30,
        client_properties={"connection_name": f"consumidor-python@{NODO}"},
    )
    while True:
        try:
            return pika.BlockingConnection(params)
        except pika.exceptions.AMQPConnectionError:
            print(f"[consumidor-python] RabbitMQ en {HOST}:{PORT} no disponible, reintentando en 3s...", flush=True)
            time.sleep(3)


def procesar(canal, metodo, propiedades, cuerpo):
    evento = json.loads(cuerpo)
    d = evento["datos"]
    if evento["tipo"] == "orden.creada":
        msg = f"Correo a {d['cliente']}: tu orden #{d['orden_id']} ({d['cantidad']}x {d['producto']}) fue recibida"
    else:
        estado = "va en camino" if evento["tipo"] == "envio.despachado" else "fue entregada"
        msg = f"SMS: la orden #{d['orden_id']} {estado} ({d['transportadora']}, {d['ciudad']})"
    print(f"[consumidor-python@{NODO}] <- {evento['tipo']} de {evento['origen']}@{evento['nodo']} | {msg}", flush=True)
    canal.basic_ack(delivery_tag=metodo.delivery_tag)


def main():
    conexion = conectar()
    canal = conexion.channel()
    canal.exchange_declare(exchange=EXCHANGE, exchange_type="topic", durable=True)
    canal.queue_declare(queue=COLA, durable=True)
    for clave in BINDINGS:
        canal.queue_bind(queue=COLA, exchange=EXCHANGE, routing_key=clave)
    canal.basic_qos(prefetch_count=10)
    canal.basic_consume(queue=COLA, on_message_callback=procesar)
    print(f"[consumidor-python] Escuchando '{COLA}' con bindings {BINDINGS}", flush=True)
    canal.start_consuming()


if __name__ == "__main__":
    main()
