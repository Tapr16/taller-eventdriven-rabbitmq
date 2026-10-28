# Etapa 1: compilar con Maven (no hace falta tener Java/Maven en el PC)
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

# Etapa 2: imagen liviana solo con el JRE
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /src/target/app.jar app.jar
CMD ["java", "-jar", "app.jar"]
