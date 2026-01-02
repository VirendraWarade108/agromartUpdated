import bcrypt from 'bcryptjs';

/**
 * Hash a plain text password
 * 
 * Example: "mypassword123" → "$2a$10$N9qo8uLOickgx..."
 * 
 * @param password - Plain text password
 * @returns Hashed password (safe to store in database)
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10; // Higher = more secure but slower
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compare a plain text password with a hashed password
 * 
 * Used during login to check if user entered correct password
 * 
 * @param password - Plain text password (what user entered)
 * @param hashedPassword - Hashed password (from database)
 * @returns true if passwords match, false otherwise
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};