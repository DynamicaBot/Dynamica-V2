import { Get } from "@nestjs/common";
import { AppService } from "./app.service";

export class AppController {
	@Get()
	getOk(): string {
		return "OK";
	}
}
