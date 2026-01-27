/**
 * @wai/chat - Central Chat Testing System
 * 
 * Universal chat interface for testing all agents and features:
 * - Multi-agent chat
 * - Multimodal support (images, PDFs, audio, video)
 * - 9 agent groups
 * - 41 language support (22 Indian + 19 Global)
 * - Workflow mode
 * - Voice I/O with 2-way streaming
 * - Super Agentic Platform (Genspark competitor)
 * - CAM 2.0 Monitoring
 * - GRPO Continuous Learning
 */

export * from './chat-service';
export * from './chat-session';
export * from './agent-selector';
export * from './multimodal-handler';
export * from './super-agentic-chat-service';

export const CHAT_PACKAGE_VERSION = '2.0.0';
