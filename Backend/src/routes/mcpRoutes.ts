import { Router } from 'express';

import { handleMcpRequest, mcpMethodNotAllowed } from '../controllers/mcpController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// The MCP server over HTTP — logged-in users only (send the same Bearer token)
router.post('/', authMiddleware, handleMcpRequest);

router.get('/', mcpMethodNotAllowed);
router.delete('/', mcpMethodNotAllowed);

export default router;
