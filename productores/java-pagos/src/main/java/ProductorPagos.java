import com.rabbitmq.client.AMQP;
import com.rabbitmq.client.BuiltinExchangeType;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Random;
import java.util.UUID;

/**
 * Productor de pagos (Java + amqp-client).
 * Publica 'pago.aprobado' o 'pago.rechazado' en el exchange topic 'tienda.eventos'.
 */
public class ProductorPagos {

    private static final String EXCHANGE = "tienda.eventos";
    private static final String[] METODOS = {"tarjeta", "pse", "nequi", "efectivo"};

    private static String env(String key, String def) {
        String v = System.getenv(key);
        return (v == null || v.isBlank()) ? def : v;
    }

    private static Connection conectar(ConnectionFactory factory) throws InterruptedException {
        while (true) {
            try {
                return factory.newConnection("productor-java@" + env("NODO", "nodo-local"));
            } catch (Exception e) {
                System.out.printf("[productor-java] RabbitMQ en %s:%d no disponible, reintentando en 3s...%n",
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
        long intervaloMs = (long) (Double.parseDouble(env("INTERVALO_SEG", "4")) * 1000);
        Random rnd = new Random();

        Connection conexion = conectar(factory);
        Channel canal = conexion.createChannel();
        canal.exchangeDeclare(EXCHANGE, BuiltinExchangeType.TOPIC, true);
        System.out.printf("[productor-java] Conectado a %s:%d, publicando en '%s'%n",
                factory.getHost(), factory.getPort(), EXCHANGE);

        AMQP.BasicProperties props = new AMQP.BasicProperties.Builder()
                .contentType("application/json").deliveryMode(2).build();

        while (true) {
            String tipo = rnd.nextInt(10) < 8 ? "pago.aprobado" : "pago.rechazado";
            int ordenId = 1000 + rnd.nextInt(9000);
            double monto = Math.round((20 + rnd.nextDouble() * 2000) * 100.0) / 100.0;
            String metodo = METODOS[rnd.nextInt(METODOS.length)];

            String json = String.format(java.util.Locale.US,
                    "{\"id\":\"%s\",\"tipo\":\"%s\",\"origen\":\"productor-java\",\"lenguaje\":\"Java\","
                            + "\"nodo\":\"%s\",\"timestamp\":\"%s\","
                            + "\"datos\":{\"orden_id\":%d,\"monto\":%.2f,\"metodo\":\"%s\"}}",
                    UUID.randomUUID(), tipo, nodo, Instant.now(), ordenId, monto, metodo);

            canal.basicPublish(EXCHANGE, tipo, props, json.getBytes(StandardCharsets.UTF_8));
            System.out.printf("[productor-java] -> %s orden=%d monto=%.2f metodo=%s%n", tipo, ordenId, monto, metodo);
            Thread.sleep(intervaloMs);
        }
    }
}
