import { query } from '../utils/database-query.ts';

interface Database {
  query: typeof query;
}

export class Session {
  private readonly db: Database;

  constructor(db = { query }) {
    this.db = db;
  }

  createSessionsTable = async (): Promise<void> => {
    await this.db.query(
      `
      CREATE TABLE IF NOT EXISTS sessions (
          sid VARCHAR(255) PRIMARY KEY,
          sess JSON NOT NULL,
          expire TIMESTAMP NOT NULL
        )
      `,
      [],
    );
  };
}
