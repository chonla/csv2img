import { Application } from "jsr:@oak/oak";
import router from "./router.ts";

const app: Application = new Application();

app.use(router.routes());

await app.listen({ port: 80 });