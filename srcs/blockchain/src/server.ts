import Fastify from "fastify";
import fastifyView from "@fastify/view";
import fastifyStatic from "@fastify/static";
import fastifyFormbody from "@fastify/formbody";
import ejs from "ejs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { addRow, listRows, showRow } from "./actions/data.js";
import { RecordNotFoundError } from "./errors/RecordNotFoundError.js";
import { rowIdSchema, bodySchema } from "./schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const viewsPath = join(__dirname, "../src/views");
const publicPath = join(__dirname, "../src/public");

const app = Fastify({
  logger: true,
});

// Plugin de templating
app.register(fastifyView, {
  engine: { ejs },
  root: viewsPath,
  viewExt: "ejs",
});

app.register(fastifyStatic, {
  root: publicPath,
  // prefix: "/public",
});

app.register(fastifyFormbody);

// Route de test
app.get("/", listRows);
app.post("/", { schema: { body: bodySchema } }, addRow);
app.get("/row/:id", { schema: { params: rowIdSchema } }, showRow);

app.setErrorHandler((error, _req, res) => {
  if (error instanceof RecordNotFoundError) {
    res.statusCode = 404;
    return res.view("404", { error: error.message });
  }
  console.error(error);
  res.statusCode = 500;
  return {
    error: error.message,
  };
});

// Fonction de démarrage
const start = async () => {
  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });
    app.log.info("Blockchain service running on http://localhost:3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
