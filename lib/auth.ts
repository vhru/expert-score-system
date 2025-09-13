import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { dbOperations } from './database-adapter';

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'expert';
  encrypted_info?: string;
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  try {
    const user = await dbOperations.users.findByUsername(username);

    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      encrypted_info: user.encrypted_info
    };
  } catch (error) {
    console.error('Authentication failed:', error);
    return null;
  }
}

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

export async function createExpert(username: string, password: string, encryptedInfo: string, expertType: string = 'team'): Promise<boolean> {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await dbOperations.users.create(username, hashedPassword, 'expert', encryptedInfo, expertType);
    
    return result.changes > 0;
  } catch (error) {
    console.error('Failed to create expert:', error);
    return false;
  }
}
