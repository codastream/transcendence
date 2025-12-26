import { describe, afterAll, expect, test } from 'vitest'
import supertest from 'supertest'

import { badtournamentData, tournamentData } from './mockData.js'
import app from '../app.js'
import * as db from "../core/database.js";

const blockchainReady = process.env.BLOCKCHAIN_READY === "true";

describe('TEST blockchain without Smart Contract', () => {

  test('Blockchain page respond', async () => {
    await app.ready()

    await supertest(app.server)
      .get('/blockchain')
      .expect(200)
  })

  test('with HTTP injection: GET List', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/list',
    })

    expect(response.statusCode).toBe(200)
  })

  test('with HTTP injection: POST bad data', async () => {
    db.truncateSnapshot();
    const response = await app.inject({
      method: 'POST',
      url: '/register',
      body: badtournamentData,
    })

    expect(response.statusCode).toBe(400)
    const body = response.json() as any
    expect(body.code).toBe('FST_ERR_VALIDATION')
    expect(body.validation?.[0]?.message).toBe("must have required property 'tx_id'")
    expect(body.validationContext).toBe('body')
  })
  // test('with HTTP injection: POST good data', async () => {
  //   const response = await app.inject({
  //     method: 'POST',
  //     url: '/register',
  //     body: tournamentData,
  //   })
  //
  //   expect(response.statusCode).toBe(406)
  //   const body = response.json() as any
  //   expect(body.error.code).toBe('DB_INSERT_TOURNAMENT_ERR')
  //   expect(body.error.message).toContain("UNIQUE constraint failed")
  // })

  test('with HTTP injection: POST duplicate data', async () => {
    db.truncateSnapshot();
    await app.inject({
      method: 'POST',
      url: '/register',
      body: tournamentData,
    })
    const response = await app.inject({
      method: 'POST',
      url: '/register',
      body: tournamentData,
    })

    expect(response.statusCode).toBe(406)
    const body = response.json() as any
    expect(body.error.code).toBe('DB_INSERT_TOURNAMENT_ERR')
    expect(body.error.message).toContain("UNIQUE constraint failed")
  })

  test('with HTTP injection: POST good data without active Smart Contract', async () => {
    db.truncateSnapshot();
    const response = await app.inject({
      method: 'POST',
      url: '/register',
      body: tournamentData,
    })
    if (!blockchainReady)
      expect(response.statusCode).toBe(200)
    else
      expect(response.statusCode).toBe(406)
  })

})


describe.runIf(blockchainReady)('TEST blockchain with Smart Contract', () => {
  test('with HTTP injection: POST good data with active Smart Contract', async () => {
    db.truncateSnapshot();
    const response = await app.inject({
      method: 'POST',
      url: '/register',
      body: tournamentData,
    })

    expect(response.statusCode).toBe(406)
    const body = response.json() as any
    expect(body.error.code).toBe('BLOCKCHAIN_INSERT_TOURNAMENT_ERR')
    expect(body.error.message).toContain("Error during Tournament Blockchain storage: AggregateError")
  })
}) 

afterAll(async () => {
  await app.close()
})
