// Consumidor de analitica (Go + amqp091-go).
// Cola 'q.analitica' enlazada a 'orden.*', 'inventario.*' y 'pago.*':
// acumula metricas de negocio y las imprime en cada evento.
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

const (
	exchange = "tienda.eventos"
	cola     = "q.analitica"
)

var bindings = []string{"orden.*", "inventario.*", "pago.*"}

type Evento struct {
	ID     string         `json:"id"`
	Tipo   string         `json:"tipo"`
	Origen string         `json:"origen"`
	Nodo   string         `json:"nodo"`
	Datos  map[string]any `json:"datos"`
}

type Metricas struct {
	Ordenes         int
	PagosAprobados  int
	PagosRechazados int
	Ventas          float64
	AlertasStock    int
}

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func conectar(url, host, port, nombre string) *amqp.Connection {
	cfg := amqp.Config{Properties: amqp.NewConnectionProperties()}
	cfg.Properties.SetClientConnectionName(nombre)
	for {
		conn, err := amqp.DialConfig(url, cfg)
		if err == nil {
			return conn
		}
		log.Printf("[consumidor-go] RabbitMQ en %s:%s no disponible, reintentando en 3s...", host, port)
		time.Sleep(3 * time.Second)
	}
}

func main() {
	log.SetFlags(0)
	host := env("RABBITMQ_HOST", "localhost")
	port := env("RABBITMQ_PORT", "5672")
	user := env("RABBITMQ_USER", "admin")
	pass := env("RABBITMQ_PASS", "admin123")
	nodo := env("NODO", "nodo-local")

	conn := conectar(fmt.Sprintf("amqp://%s:%s@%s:%s/", user, pass, host, port), host, port, "consumidor-go@"+nodo)
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("no se pudo abrir canal: %v", err)
	}
	if err := ch.ExchangeDeclare(exchange, "topic", true, false, false, false, nil); err != nil {
		log.Fatalf("no se pudo declarar exchange: %v", err)
	}
	if _, err := ch.QueueDeclare(cola, true, false, false, false, nil); err != nil {
		log.Fatalf("no se pudo declarar cola: %v", err)
	}
	for _, clave := range bindings {
		if err := ch.QueueBind(cola, clave, exchange, false, nil); err != nil {
			log.Fatalf("no se pudo enlazar %s: %v", clave, err)
		}
	}
	ch.Qos(10, 0, false)

	msgs, err := ch.Consume(cola, "consumidor-go", false, false, false, false, nil)
	if err != nil {
		log.Fatalf("no se pudo consumir: %v", err)
	}
	log.Printf("[consumidor-go] Escuchando '%s' con bindings %v", cola, bindings)

	var m Metricas
	for msg := range msgs {
		var ev Evento
		if err := json.Unmarshal(msg.Body, &ev); err != nil {
			log.Printf("[consumidor-go] mensaje invalido: %v", err)
			msg.Nack(false, false)
			continue
		}
		switch ev.Tipo {
		case "orden.creada":
			m.Ordenes++
		case "pago.aprobado":
			m.PagosAprobados++
			if monto, ok := ev.Datos["monto"].(float64); ok {
				m.Ventas += monto
			}
		case "pago.rechazado":
			m.PagosRechazados++
		case "inventario.agotado":
			m.AlertasStock++
		}
		log.Printf("[consumidor-go@%s] <- %s de %s@%s | ordenes=%d pagos_ok=%d pagos_fail=%d ventas=%.2f alertas_stock=%d",
			nodo, ev.Tipo, ev.Origen, ev.Nodo, m.Ordenes, m.PagosAprobados, m.PagosRechazados, m.Ventas, m.AlertasStock)
		msg.Ack(false)
	}
	log.Printf("[consumidor-go] canal cerrado, saliendo")
	os.Exit(1)
}
