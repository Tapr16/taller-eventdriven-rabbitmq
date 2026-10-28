# Etapa 1: compilar el binario de Go
FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY *.go ./
RUN go mod tidy && CGO_ENABLED=0 go build -o /app .

# Etapa 2: imagen minima con solo el binario
FROM alpine:3.20
COPY --from=build /app /app
CMD ["/app"]
