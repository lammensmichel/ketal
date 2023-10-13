#! /usr/bin/env bash
docker stop ketal || true
docker rm ketal || true
docker build -t ketal .
docker run -d -p 8080:80 ketal
