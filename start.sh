#! /usr/bin/env bash
docker stop ketal || true
docker rm ketal || true
docker build -t ketal .
docker run -d -p 8080:80  --name ketal ketal


docker stop ketal-server || true
docker rm ketal-server || true
docker build -t ketal-server ./nodejs
docker run -d -p  3000:3000  --name ketal-server ketal-server
