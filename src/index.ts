/**
 * NyayaVighya SDK v3.1 - Main Entry Point
 * Specialized Legal AI Platform for Indian Law
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { enterpriseServicesRouter } from './routes/enterprise-services';
import { agentRouter } from './routes/agents';
import { authRouter } from './routes/auth';
import { healthRouter } from './routes/health';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { initializeServices } from './services';
import { initializeDatabase } from './services/database';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: { error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

app.use('/health', healthRouter);
app.use('/api/v3/auth', authRouter);
app.use('/api/v3', authMiddleware, enterpriseServicesRouter);
app.use('/api/v3/agents', authMiddleware, agentRouter);

app.use(errorHandler);

async function startServer() {
  try {
    console.log('⚖️ NyayaVighya Legal SDK v3.1 Starting...');
    
    await initializeDatabase();
    console.log('✅ Database connected');
    
    await initializeServices();
    console.log('✅ Enterprise services initialized');
    
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                       NyayaVighya Legal SDK v3.1                          ║
║               Specialized Legal AI Platform for Indian Law                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  ⚖️ Server running on port ${PORT}                                          ║
║  📜 275+ Legal Agents (Civil, Criminal, Constitutional, Corporate, Tax)   ║
║  🏛️ 29 Legal Categories (IPC, CrPC, CPC, BNS 2023, BNSS 2023, etc.)       ║
║  🔗 16+ Legal-Optimized LLM Providers integrated                          ║
║  📡 7 Protocols (A2A, MCP, ROMA L1-L4, AG-UI, Parlant, BMAD)              ║
║  📁 645 TypeScript files | 165 Services | 295 Package files               ║
║  📡 API: http://localhost:${PORT}/api/v3                                    ║
║  📖 Health: http://localhost:${PORT}/health                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  📚 Statutes: IPC, CrPC, CPC, BNS 2023, BNSS 2023, Constitution of India  ║
║  🇮🇳 Languages: 22 Indian Languages via Sarvam AI (Hindi, Tamil, etc.)     ║
║  🔍 Legal Research: Case Law, Precedents, Citation Analysis               ║
╚═══════════════════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start NyayaVighya SDK:', error);
    process.exit(1);
  }
}

startServer();

export { app };
