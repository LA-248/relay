/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from 'bcrypt';
import { UsernameTakenError } from '../errors/errors.ts';
import { User } from '../repositories/user.repository.ts';
import { UserEntity, UserProfile } from '../schemas/user.schema.ts';

export async function authenticateUser(
  username: string,
  password: string,
  cb: (err: any, user?: UserEntity | false, info?: { message: string }) => void,
) {
  try {
    const userRepository = new User();
    const user = await userRepository.findUserByUsername(username);
    if (!user) {
      return cb(null, false, {
        message: 'Incorrect username or password',
      });
    }

    verifyPassword(password, user, cb);
  } catch (err) {
    return cb(err);
  }
}

export function verifyPassword(
  password: string,
  user: UserEntity,
  cb: (err: any, user?: UserEntity | false, info?: { message: string }) => void,
) {
  bcrypt.compare(password, user.hashed_password, (err, isMatch) => {
    if (err) {
      return cb(err);
    }

    if (!isMatch) {
      return cb(null, false, {
        message: 'Incorrect username or password',
      });
    }

    return cb(null, user);
  });
}

export async function insertNewUser(
  username: string,
  password: string,
): Promise<UserProfile> {
  const userRepository = new User();

  // Check if username already exists
  const existingUser = await userRepository.findUserByUsername(username);
  if (existingUser) {
    throw new UsernameTakenError();
  }

  const hashedPassword = await bcrypt.hash(password, 14);
  const newUser = await userRepository.insertUser(username, hashedPassword);

  return newUser;
}
