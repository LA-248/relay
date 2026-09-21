declare namespace Express {
  interface Request {
    user?: {
      id: number;
      username: string;
      profile_picture: string;
    };
  }
}
