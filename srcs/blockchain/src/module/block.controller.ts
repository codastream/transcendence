// import { db } from "../core/database.js";
import * as db from "../core/database.js";
import { RecordNotFoundError } from "../core/error.js";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Blockchain } from "./block.schema.js";

export async function listMatchView(_request: FastifyRequest, reply: FastifyReply) {
  const snapshots = db.listSnap();
  return reply.view('index', {
    title: 'Blockchain Service',
    message: 'Hello from Fastify + EJS + TypeScript',
    snapshots,
  })
}

export async function listMatch(_request: FastifyRequest, reply: FastifyReply) {
  const snapshots = db.listSnap();
  return reply.code(200).send(snapshots)
}

export async function getMatchView(
  request: FastifyRequest<{ Params: { tx_id: number } }>,
  reply: FastifyReply,
) {
  const snapshots = db.getSnapMatch(request.params.tx_id)
  if (snapshots === undefined) {
    throw new RecordNotFoundError(`No data with id ${request.params.tx_id}`)
  }
  return reply.view('data', {
    title: 'My data is',
    message: 'My data is',
    snapshots,
  })
}

export async function addMatchForm(this: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
  const { tx_id, tour_id, player1_id, player2_id, player3_id, player4_id } =
    request.body as Blockchain;
  const rowId = db.insertSnapMatch(request.body as Blockchain);
  this.log.info({ event: "register_success", tx_id, tour_id, player1_id, player2_id, player3_id, player4_id, rowId });
  return reply.redirect('/')
}

export async function addMatch(this: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
  const { tx_id, tour_id, player1_id, player2_id, player3_id, player4_id } = request.body as Blockchain;
  this.log.info({ event: "register_attempt", tx_id, tour_id, player1_id, player2_id, player3_id, player4_id});
  try {
    const rowId = db.insertSnapMatch(request.body as Blockchain);
    this.log.info({ event: "register_success", tx_id, tour_id, player1_id, player2_id, player3_id, player4_id, rowId });
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
      .send({ error: { message: err.message, code: err.code } })
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
