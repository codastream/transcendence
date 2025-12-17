import { db, insertSnapMatch } from "../core/database.js";
import * as ndb from "../core/database.js";
import { RecordNotFoundError } from "../core/error.js";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Blockchain } from "./block.schema.js";

export async function listRows(_request: FastifyRequest, reply: FastifyReply) {
  const datadb = db.prepare('SELECT * FROM snapshot').all()
  return reply.view('index', {
    title: 'Blockchain Service',
    message: 'Hello from Fastify + EJS + TypeScript',
    datadb,
  })
}

export async function listRowsJSON(_request: FastifyRequest, reply: FastifyReply) {
  const datadb = db.prepare('SELECT * FROM snapshot').all()
  return reply.code(200).send(datadb)
}

export async function showRow(
  request: FastifyRequest<{ Params: { tx_id: number } }>,
  reply: FastifyReply,
) {
  const datadb = db.prepare(`SELECT * FROM snapshot WHERE tx_id = ?`).get(request.params.tx_id)
  if (datadb === undefined) {
    throw new RecordNotFoundError(`No data with id ${request.params.tx_id}`)
  }
  return reply.view('data', {
    title: 'My data is',
    message: 'My data is',
    datadb,
  })
}

export async function addRow(request: FastifyRequest, reply: FastifyReply) {
  const { tx_id, tour_id, player1_id, player2_id, player3_id, player4_id } =
    request.body as Blockchain
  const id = db
    .prepare(
      `INSERT INTO snapshot(tx_id,match_id,player1_id,player2_id,player1_score,player2_score,winner_id) VALUES (?,?,?,?,?,?,?)`,
    )
    .run(tx_id, tour_id, player1_id, player2_id, player3_id, player4_id)
  // this.log.info({ event: "register_success", tx_id, match_id, player1_id, player2_id, player1_score, player2_score, winner_id, id });
  return reply.redirect('/')
}

export async function addRowJSON(this: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
  const { tx_id, tour_id, player1_id, player2_id, player3_id, player4_id } = request.body as Blockchain;
  this.log.info({ event: "register_attempt", tx_id, tour_id, player1_id, player2_id, player3_id, player4_id });
  try {
    const iddb = db
      .prepare(`INSERT INTO snapshot(tx_id,tour_id, player1_id, player2_id, player3_id, player4_id) VALUES (?,?,?,?,?,?)`)
      .run(tx_id, tour_id, player1_id, player2_id, player3_id, player4_id);
    this.log.info({ event: "register_success", tx_id, tour_id, player1_id, player2_id, player3_id, player4_id, iddb });
  } catch (err: any) {
    this.log.error({ event: "register_error", tx_id, tour_id, player1_id, player2_id, player3_id, player4_id, err: err?.message || err });
    return reply.code(406).send({ error: { message: "Internal server error", code: "INSERT FAILED" } });
  }
}

export async function addBlock(this: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
  const { tx_id, tour_id, player1_id, player2_id, player3_id, player4_id } = request.body as Blockchain;
  this.log.info({ event: "register_attempt", tx_id, tour_id, player1_id, player2_id, player3_id, player4_id});
  try {
    ndb.insertSnapMatch(request.body as Blockchain);
    this.log.info({ event: "register_success", tx_id, tour_id, player1_id, player2_id, player3_id, player4_id, ndb });
  } catch (err: any) {
    this.log.error({
      event: 'register_error',
      tx_id,
      tour_id,
      player1_id,
      player2_id,
      player3_id,
      player4_id,
      err: err?.message || err,
    })
    return reply
      .code(406)
      .send({ error: { message: 'Internal server error', code: 'INSERT FAILED' } })
  }
}

// app.post("/api/tournament/result", async (req, res) => {
//   const { id, players } = req.body;
//
//   try {
//     const tx = await gameStorage.storeTournament(
//       id,
//       players[0],
//       players[1],
//       players[2],
//       players[3]
//     );
//
//     // ⚠️ attendre la confirmation
//     const receipt = await tx.wait();
//
//     res.json({
//       status: "stored",
//       txHash: receipt.hash,
//     });
//
//   } catch (err) {
//     res.status(400).json({
//       error: "Blockchain write failed",
//       details: err.message,
//     });
//   }
// });
//
