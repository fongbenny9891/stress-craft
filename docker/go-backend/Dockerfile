FROM golang:1.21

WORKDIR /app

COPY . .

RUN go mod init go-backend && \
    go mod tidy && \
    go build -o main .

CMD ["./main"]
