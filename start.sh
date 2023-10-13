#!/bin/bash

docker build -t ketal .
docker run -d -p 8080:80 ketal
