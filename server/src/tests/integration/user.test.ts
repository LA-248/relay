import bcrypt from 'bcrypt';
import request from 'supertest';
import { app } from '../../app.ts';
import { createTables, pool } from '../../db/index.ts';

beforeAll(async () => {
  await createTables();
});

beforeEach(async () => {
  // Clean up before each test
  await pool.query('DELETE FROM users');

  const hashed = await bcrypt.hash('secret', 10);
  await pool.query(
    `INSERT INTO users (id, username, hashed_password) VALUES 
    ($1, $2, $3)`,
    [1, 'test', hashed],
  );
});

afterAll(async () => {
  await pool.end();
});

describe('GET /users', () => {
  it('should return logged in user data', async () => {
    const agent = request.agent(app);
    await agent
      .post('/auth/login/password')
      .send({ username: 'test', password: 'secret' })
      .expect(200);

    const res = await agent.get('/users').expect(200);
    expect(res.body).toEqual({
      userId: 1,
      username: 'test',
      profilePicture: null,
    });
  });
});
