import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.rabbitmq.client.BuiltinExchangeType;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.DeliverCallback;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Consumidor de facturacion (Java + amqp-client).
 * Cola 'q.facturacion' enlazada a 'pago.aprobado' y 'pago.rechazado':
 * emite una factura por cada pago aprobado y anula la orden si el pago falla.
 */
public class ConsumidorFacturacion {

    private static final String EXCHANGE = "tienda.eventos";
    private static final String COLA = "q.facturacion";
    private static final String[] BINDINGS = {"pago.aprobado", "pago.rechazado"};

    private static String env(String key, String def) {
        String v = System.getenv(key);
        return (v == null || v.isBlank()) ? def : v;
    }

    private static Connection conectar(ConnectionFactory factory) throws InterruptedException {
        while (true) {
            try {
                return factory.newConnection("consumidor-java@" + env("NODO", "nodo-local"));
            } catch (Exception e) {
                System.out.printf("[consumidor-java] RabbitMQ en %s:%d no disponible, reintentando en 3s...%n",
                        factory.getHost(), factory.getPort());
                Thread.sleep(3000);
            }
        }
    }

    public static void main(String[] args) throws Exception {
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost(env("RABBITMQ_HOST", "localhost"));
        factory.setPort(Integer.parseInt(env("RABBITMQ_PORT", "5672")));
        factory.setUsername(env("RABBITMQ_USER", "admin"));
        factory.setPassword(env("RABBITMQ_PASS", "admin123"));
        factory.setAutomaticRecoveryEnabled(true);
        String nodo = env("NODO", "nodo-local");

        Connection conexion = conectar(factory);
        Channel canal = conexion.createChannel();
        canal.exchangeDeclare(EXCHANGE, BuiltinExchangeType.TOPIC, true);
        canal.queueDeclare(COLA, true, false, false, null);
        for (String clave : BINDINGS) {
            canal.queueBind(COLA, EXCHANGE, clave);
        }
        canal.basicQos(10);

        AtomicInteger numFactura = new AtomicInteger(1);
        DeliverCallback alRecibir = (tag, entrega) -> {
            JsonObject ev = JsonParser.parseString(new String(entrega.getBody(), StandardCharsets.UTF_8)).getAsJsonObject();
            JsonObject d = ev.getAsJsonObject("datos");
            String tipo = ev.get("tipo").getAsString();
            String detalle;
            if (tipo.equals("pago.aprobado")) {
                double monto = d.get("monto").getAsDouble();
                detalle = String.format(Locale.US, "Factura FV-%05d emitida: orden #%d, subtotal %.2f + IVA %.2f = %.2f",
                        numFactura.getAndIncrement(), d.get("orden_id").getAsInt(), monto, monto * 0.19, monto * 1.19);
            } else {
                detalle = String.format("Orden #%d anulada: pago rechazado (%s)",
                        d.get("orden_id").getAsInt(), d.get("metodo").getAsString());
            }
            System.out.printf("[consumidor-java@%s] <- %s de %s@%s | %s%n",
                    nodo, tipo, ev.get("origen").getAsString(), ev.get("nodo").getAsString(), detalle);
            canal.basicAck(entrega.getEnvelope().getDeliveryTag(), false);
        };

        canal.basicConsume(COLA, false, alRecibir, consumerTag -> { });
        System.out.printf("[consumidor-java] Escuchando '%s' con bindings %s%n", COLA, String.join(", ", BINDINGS));
    }
}
