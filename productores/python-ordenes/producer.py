"""Productor de ordenes (Python + pika).

Publica eventos 'orden.creada' en el exchange topic 'tienda.eventos'.
"""
import json
import os
import random
import time
import uuid
from datetime import datetime, timezone

import pika

HOST = os.getenv("RABBITMQ_HOST", "localhost")
PORT = int(os.getenv("RABBITMQ_PORT", "5672"))
USER = os.getenv("RABBITMQ_USER", "admin")
PASS = os.getenv("RABBITMQ_PASS", "admin123")
NODO = os.getenv("NODO", "nodo-local")
INTERVALO = float(os.getenv("INTERVALO_SEG", "3"))
EXCHANGE = "tienda.eventos"

PRODUCTOS = ["Laptop", "Mouse", "Teclado", "Monitor", "Audifonos", "Webcam"]
CLIENTES = ["ana", "carlos", "luisa", "pedro", "sofia", "juan"]


def conectar():
    credenciales = pika.PlainCredentials(USER, PASS)
    params = pika.ConnectionParameters(
        HOST, PORT, credentials=credenciales, heartbeat=30,
        client_properties={"connection_name": f"productor-python@{NODO}"},
    )
    while True:
        try:
            return pika.BlockingConnection(params)
        except pika.exceptions.AMQPConnectionError:
            print(f"[productor-python] RabbitMQ en {HOST}:{PORT} no disponible, reintentando en 3s...", flush=True)
            time.sleep(3)


def main():
    conexion = conectar()
    canal = conexion.channel()
    canal.exchange_declare(exchange=EXCHANGE, exchange_type="topic", durable=True)
    print(f"[productor-python] Conectado a {HOST}:{PORT}, publicando en '{EXCHANGE}'", flush=True)

    while True:
        evento = {
            "id": str(uuid.uuid4()),
            "tipo": "orden.creada",
            "origen": "productor-python",
            "lenguaje": "Python",
            "nodo": NODO,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "datos": {
                "orden_id": random.randint(1000, 9999),
                "cliente": random.choice(CLIENTES),
                "producto": random.choice(PRODUCTOS),
                "cantidad": random.randint(1, 5),
            },
        }
        canal.basic_publish(
            exchange=EXCHANGE,
            routing_key=evento["tipo"],
            body=json.dumps(evento),
            properties=pika.BasicProperties(content_type="application/json", delivery_mode=2),
        )
        print(f"[productor-python] -> {evento['tipo']} {evento['datos']}", flush=True)
        conexion.sleep(INTERVALO)


if __name__ == "__main__":
    main()
