sudo docker rm -f antidote
sudo docker run -d --name antidote --restart always -p "4368:4368" -p "8085:8085" -p "8087:8087" -p "8099:8099" -p "9100:9100" -e NODE_NAME=antidote@127.0.0.1 mweber/antidotedb
