import http from 'http';
import app from './app';
import dotenv from 'dotenv';
import { initSocketServer } from './socket'; // <-- 1. Importar nuestro inicializador

dotenv.config();

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// --- INICIO DE LA MODIFICACIÓN ---
// 2. Inicializamos el servidor de sockets y le pasamos nuestro servidor HTTP
const io = initSocketServer(server); 
// --- FIN DE LA MODIFICACIÓN ---

server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo y escuchando en el puerto ${PORT}`);
  console.log(`🔗 Accede en http://localhost:${PORT}`);
});
