import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { generateToken } from '../middleware/auth';

const router = Router();

const users = new Map<string, { id: string; email: string; password: string; role: string }>();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    if (users.has(email)) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = `user_${Date.now()}`;

    users.set(email, {
      id: userId,
      email,
      password: hashedPassword,
      role: 'user'
    });

    const token = generateToken({ id: userId, email, role: 'user' });

    res.status(201).json({
      success: true,
      user: { id: userId, email, name },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const user = users.get(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/api-key', async (req: Request, res: Response) => {
  try {
    const { name, permissions } = req.body;
    const apiKey = `wai_${Buffer.from(Date.now().toString()).toString('base64').replace(/=/g, '')}`;

    res.json({
      success: true,
      apiKey,
      name: name || 'Default API Key',
      permissions: permissions || ['read', 'write'],
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'API key generation failed' });
  }
});

export { router as authRouter };
