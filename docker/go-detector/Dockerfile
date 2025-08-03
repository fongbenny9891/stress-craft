FROM golang:1.21

WORKDIR /app

COPY . .

RUN go mod init go-detector && \
    go mod tidy && \
    go build -o main .

CMD ["./main"]
