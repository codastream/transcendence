// import { db } from "../core/database.js";
import * as db from '../core/database.js';
import { errorEventMap, RecordNotFoundError } from '../core/error.js';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { BlockTournamentInput, BlockTournamentStored } from './block.schema.js';
import {
  addTournamentBlockchain,
  addTournamentSnapDB,
  storeTournament,
  updateTournamentSnapDB,
} from './block.service.js';

export async function listTournamentView(_request: FastifyRequest, reply: FastifyReply) {
  const snapshots = db.listSnap();
  return reply.view('index', {
    title: 'Blockchain Service',
    message: 'Hello from Fastify + EJS + TypeScript',
    snapshots,
  });
}

export async function listTournament(_request: FastifyRequest, reply: FastifyReply) {
  const snapshots = db.listSnap();
  return reply.code(200).send(snapshots);
}

export async function getTournamentView(
  request: FastifyRequest<{ Params: { id: number } }>,
  reply: FastifyReply,
) {
  const snapshots = db.getSnapTournament(request.params.id);
  if (snapshots === undefined) {
    throw new RecordNotFoundError(`No data with id ${request.params.id}`);
  }
  return reply.view('data', {
    title: 'My data is',
    message: 'My data is',
    snapshots,
  });
}

export async function addTournamentForm(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id, tour_id, player1_id, player2_id, player3_id, player4_id } =
    request.body as BlockTournamentInput;
  const rowId = db.insertSnapTournament(request.body as BlockTournamentInput);
  this.log.info({
    event: 'register_success',
    id,
    tour_id,
    player1_id,
    player2_id,
    player3_id,
    player4_id,
    rowId,
  });
  return reply.redirect('/');
}

export async function addTournament(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const data = request.body as BlockTournamentInput;
  try {
    addTournamentSnapDB(this.log, data);
    const blockchainReady = process.env.BLOCKCHAIN_READY === 'true';

    if (blockchainReady) {
      const dataStored = await addTournamentBlockchain(this.log, data);
      updateTournamentSnapDB(this.log, dataStored);
    }
  } catch (err: any) {
    const event = errorEventMap[err.code];
    if (event) {
      this.log.error({ event, err });
    } else {
      this.log.error({ event: 'unknown_error', err });
    }
    this.log.error({ data: data.id, err: err?.message || err });
    return reply.code(406).send({ error: { message: err.message, code: err.code } });
  }
}
