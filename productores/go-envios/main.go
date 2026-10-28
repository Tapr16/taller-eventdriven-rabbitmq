// Productor de envios (Go + amqp091-go).
// Publica 'envio.despachado' o 'envio.entregado' en el exchange topic 'tienda.eventos'.
package main

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log"
	mrand "math/rand"
	"os"
	"strconv"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

const exchange = "tienda.eventos"

var (
	transportadoras = []string{"Servientrega", "Coordinadora", "InterRapidisimo", "Envia"}
	ciudades        = []string{"Bogota", "Medellin", "Cali", "Barranquilla", "Bucaramanga"}
)

type Evento struct {
	ID        string         `json:"id"`
	Tipo      string         `json:"tipo"`
	Origen    string         `json:"origen"`
	Lenguaje  string         `json:"lenguaje"`
	Nodo      string         `json:"nodo"`
	Timestamp string         `json:"timestamp"`
	Datos     map[string]any `json:"datos"`
}

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func uuid() string {
	b := make([]byte, 16)
	rand.Read(b)
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

func conectar(url, host, port, nombre string) *amqp.Connection {
	cfg := amqp.Config{Properties: amqp.NewConnectionProperties()}
	cfg.Properties.SetClientConnectionName(nombre)
	for {
		conn, err := amqp.DialConfig(url, cfg)
		if err == nil {
			return conn
		}
		log.Printf("[productor-go] RabbitMQ en %s:%s no disponible, reintentando en 3s...", host, port)
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
	segs, _ := strconv.ParseFloat(env("INTERVALO_SEG", "6"), 64)
	intervalo := time.Duration(segs * float64(time.Second))

	url := fmt.Sprintf("amqp://%s:%s@%s:%s/", user, pass, host, port)
	conn := conectar(url, host, port, "productor-go@"+nodo)
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("no se pudo abrir canal: %v", err)
	}
	if err := ch.ExchangeDeclare(exchange, "topic", true, false, false, false, nil); err != nil {
		log.Fatalf("no se pudo declarar exchange: %v", err)
	}
	log.Printf("[productor-go] Conectado a %s:%s, publicando en '%s'", host, port, exchange)

	for {
		tipo := "envio.despachado"
		if mrand.Intn(2) == 0 {
			tipo = "envio.entregado"
		}
		ev := Evento{
			ID:        uuid(),
			Tipo:      tipo,
			Origen:    "productor-go",
			Lenguaje:  "Go",
			Nodo:      nodo,
			Timestamp: time.Now().UTC().Format(time.RFC3339Nano),
			Datos: map[string]any{
				"orden_id":       1000 + mrand.Intn(9000),
				"transportadora": transportadoras[mrand.Intn(len(transportadoras))],
				"ciudad":         ciudades[mrand.Intn(len(ciudades))],
			},
		}
		body, _ := json.Marshal(ev)
		err := ch.PublishWithContext(context.Background(), exchange, tipo, false, false, amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent,
			Body:         body,
		})
		if err != nil {
			log.Fatalf("[productor-go] error publicando: %v", err)
		}
		datos, _ := json.Marshal(ev.Datos)
		log.Printf("[productor-go] -> %s %s", tipo, datos)
		time.Sleep(intervalo)
	}
}
