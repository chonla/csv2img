import { Router } from 'jsr:@oak/oak';
import { getTable } from "./handlers/get-table.ts";

const router: Router = new Router();

router.post('/', getTable);
// router.get("/", (ctx: Context) => {
//     console.log("Hello");
//     ctx.response.body = "Hello";
// });

export default router;