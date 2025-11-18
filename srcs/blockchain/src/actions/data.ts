import { db } from "../database.js";
import { RecordNotFoundError } from "../errors/RecordNotFoundError.js";
import { FastifyReply, FastifyRequest } from "fastify";

export const listRows = (_request: FastifyRequest, reply: FastifyReply) => {
  const datadb = db.prepare("SELECT * FROM snapshot").all();
  reply.view("index", {
    title: "Blockchain Service",
    message: "Hello from Fastify + EJS + TypeScript",
    datadb,
  });
};

export const showRow = (
  request: FastifyRequest<{ Params: { id: number } }>,
  reply: FastifyReply,
) => {
  const datadb = db
    .prepare(`SELECT * FROM snapshot WHERE id = ?`)
    .get(request.params.id);
  if (datadb === undefined) {
    throw new RecordNotFoundError(`No data with id ${request.params.id}`);
  }
  reply.view("data", {
    title: "My data is",
    message: "My data is",
    datadb,
  });
};

export const addRow = (
  req: FastifyRequest<{
    Body: {
      id: number;
      first_name: string;
      last_name: string;
    };
  }>,
  res: FastifyReply,
) => {
  const data = req.body;
  db.prepare(
    `INSERT INTO snapshot(id,first_name,last_name) VALUES (?,?,?)`,
  ).run(data.id, data.first_name, data.last_name);
  return res.redirect("/");
};
