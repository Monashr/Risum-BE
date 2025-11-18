import { Hono } from "hono";
import { logger } from "hono/logger";
import { productRoute } from "./src/routes/product";
import { materialRoute } from "./src/routes/material";
import { sizeRoute } from "./src/routes/size";
import { variantRoute } from "./src/routes/variant";
import { authRoute } from "./src/routes/auth";
import { cors } from "hono/cors";
import { colorRoute } from "./src/routes/color";
import { borderLengthsRoute } from "./src/routes/borderLength";
import { orderRoute } from "./src/routes/order";
import { customColumnRoute } from "./src/routes/customColumn";
import { env } from "./src/config/env";
import { globalRateLimit } from "./src/middleware/rateLimitter";

const app = new Hono();

app.use(
  "*",
  globalRateLimit,
  logger(),
  cors({
    origin: env.FRONTEND_URL,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app
  .basePath("/api")
  .route("/products", productRoute)
  .route("/materials", materialRoute)
  .route("/sizes", sizeRoute)
  .route("/variants", variantRoute)
  .route("/colors", colorRoute)
  .route("/borderlengths", borderLengthsRoute)
  .route("/customcolumns", customColumnRoute)
  .route("/orders", orderRoute)
  .route("/auth", authRoute);

export default app;
