
import http from 'http';
import { createHttpServer } from './api/http';
import { createWsServer } from './api/ws';
import { CONFIG } from './config';
import { log } from './utils/logger';

const app = createHttpServer();
const server = http.createServer(app);
createWsServer(server);
server.listen(CONFIG.PORT, () => log.info(`server listening on :${CONFIG.PORT}`));
