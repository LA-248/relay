import bcrypt from 'bcrypt';
import request from 'supertest';
import { app } from '../../app.ts';
import { createTables, pool } from '../../db/index.ts';

beforeAll(async () => {
  await createTables();
});

beforeEach(async () => {
  // Wipe state so every run starts fresh
  await pool.query('DELETE FROM private_chats');
  await pool.query('DELETE FROM users');
});

afterAll(async () => {
  await pool.end();
});

describe('POST /chats', () => {
  it('should add a chat and return an updated chat list that includes the recipient', async () => {
    const hashed = await bcrypt.hash('secret', 10);

    await pool.query(
      `INSERT INTO users (id, username, hashed_password) VALUES
        (2, 'test2',  $1)`,
      [hashed],
    );

    const agent = request.agent(app);

    // Log in as “test” so req.user is populated
    await agent
      .post('/auth/login/password')
      .send({ username: 'test', password: 'secret' })
      .expect(200);

    // Add chat with “test2”
    const res = await agent
      .post('/chats')
      .send({ recipientName: 'test2', recipientId: 2 })
      .expect(200);

    expect(res.body).toEqual({
      updatedChatList: expect.arrayContaining([
        expect.objectContaining({
          name: 'test2',
          recipient_user_id: 2,
        }),
      ]),
    });

    // Ensure a row was written
    const { rows } = await pool.query('SELECT * FROM private_chats');
    expect(rows).toHaveLength(1);
  });
});
