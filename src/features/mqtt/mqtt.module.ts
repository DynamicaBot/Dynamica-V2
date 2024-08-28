import { Global, Module } from "@nestjs/common";

import { MqttService } from "./mqtt.service";

@Global()
@Module({
	providers: [MqttService],
	exports: [MqttService],
})
export class MqttModule {}
