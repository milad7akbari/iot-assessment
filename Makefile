PROJECT_NAME := iot-assessment
MONGO_CONTAINER := iot-mongo-m7a
RABBIT_CONTAINER := iot-rabbitmq-m7a

.PHONY: stop
stop:
	@echo "Stopping containers..."
	-docker stop $(MONGO_CONTAINER) $(RABBIT_CONTAINER)

.PHONY: rm
rm: stop
	@echo "Removing containers..."
	-docker rm -f $(MONGO_CONTAINER) $(RABBIT_CONTAINER)

.PHONY: rm-volumes
rm-volumes:
	@echo "Removing volumes..."
	-docker volume rm -f $$(docker volume ls -q --filter "name=$(PROJECT_NAME)_")

.PHONY: rm-networks
rm-networks:
	@echo "Removing networks..."
	-docker network rm $$(docker network ls -q --filter "name=$(PROJECT_NAME)_") || true

.PHONY: clean
clean: rm rm-volumes rm-networks
	@echo "Cleanup complete."


#docker exec -it iot-rabbitmq-m7a rabbitmqctl list_queues name
#docker exec -it iot-rabbitmq-m7a rabbitmqctl purge_queue xray
#docker exec -it iot-rabbitmq-m7a rabbitmqctl delete_queue xray
