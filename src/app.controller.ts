import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
	@Get()
	getOk(): string {
		return "OK";
	}
}
