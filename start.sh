#! /usr/bin/env bash
docker stop ketal || true
docker rm ketal || true
docker build -t ketal .
docker run -d -p 4211:80  --name ketal ketal


docker stop ketal-server || true
docker rm ketal-server || true
docker build -t ketal-server ./nodejs
docker run -d -p  3000:3000  -e SOCKET_IO_URL="http://79.137.35.181:3000"  --name ketal-server ketal-server
