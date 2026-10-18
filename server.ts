import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

// Track active FFmpeg processes per client
let activeStreamProcess: ChildProcessWithoutNullStreams | null = null;
let activeStreamInfo = {
  isStreaming: false,
  rtmpUrl: '',
  startedAt: null as string | null,
  bytesReceived: 0,
  lastError: null as string | null,
};

// WebSocket server for real-time RTMP stream relay
const wss = new WebSocketServer({ server, path: '/api/stream/ws' });

wss.on('connection', (ws: WebSocket) => {
  console.log('[StreamNet Relay] Client connected to live stream relay');

  ws.on('message', (data: any, isBinary: boolean) => {
    // If text message, treat as stream control command
    if (!isBinary) {
      try {
        const payload = JSON.parse(data.toString());

        if (payload.action === 'start') {
          let rtmpUrl = (payload.rtmpUrl || 'rtmps://a.rtmp.youtube.com:443/live2').trim().replace(/\/+$/, '');
          const streamKey = (payload.streamKey || '').trim();

          if (!streamKey) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Clé de flux YouTube manquante. Veuillez renseigner votre clé de flux sur YouTube Studio.',
            }));
            return;
          }

          // Auto-upgrade unencrypted rtmp:// to rtmps:// on port 443 to bypass container firewall blocks on port 1935
          if (rtmpUrl.startsWith('rtmp://')) {
            rtmpUrl = rtmpUrl.replace(/^rtmp:\/\//, 'rtmps://');
          }
          if (rtmpUrl.includes('youtube.com') && !rtmpUrl.includes(':443')) {
            rtmpUrl = rtmpUrl.replace(/(\.youtube\.com)(\/live2)?$/, '$1:443/live2');
          }
          if (!rtmpUrl.startsWith('rtmps://') && !rtmpUrl.startsWith('rtmp://')) {
            rtmpUrl = `rtmps://${rtmpUrl}`;
          }

          // Kill any existing FFmpeg instance
          if (activeStreamProcess) {
            try {
              activeStreamProcess.stdin.end();
              activeStreamProcess.kill('SIGINT');
            } catch (e) {}
            activeStreamProcess = null;
          }

          const fullRtmpDestination = `${rtmpUrl}/${streamKey}`;
          console.log(`[StreamNet Relay] Spawning RTMPS FFmpeg pipeline to: ${rtmpUrl}/••••••••`);

          // Spawn FFmpeg to ingest WebM from pipe:0 and push FLV H.264/AAC to YouTube RTMPS
          let hasConfirmedConnection = false;
          activeStreamProcess = spawn('ffmpeg', [
            '-f', 'webm',
            '-probesize', '1M',
            '-analyzeduration', '1M',
            '-i', 'pipe:0',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-tune', 'zerolatency',
            '-pix_fmt', 'yuv420p',
            '-g', '60',
            '-keyint_min', '30',
            '-b:v', '3500k',
            '-maxrate', '4000k',
            '-bufsize', '7000k',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-ar', '44100',
            '-ac', '2',
            '-f', 'flv',
            '-flvflags', 'no_duration_filesize',
            fullRtmpDestination,
          ]);

          activeStreamInfo = {
            isStreaming: true,
            rtmpUrl,
            startedAt: new Date().toISOString(),
            bytesReceived: 0,
            lastError: null,
          };

          activeStreamProcess.stderr.on('data', (chunk) => {
            const log = chunk.toString();

            // Check for active transmission frames
            if ((log.includes('Output #0, flv') || log.includes('frame=')) && !hasConfirmedConnection) {
              hasConfirmedConnection = true;
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'relay_status',
                  state: 'connected',
                  message: 'Connexion RTMPS sécurisée établie ! YouTube Studio reçoit le flux en direct.',
                }));
              }
            }

            // Detect YouTube specific authentication/rejection errors
            if (
              log.includes('Error in the pull function') ||
              log.includes('Input/output error') ||
              log.toLowerCase().includes('stream key not found') ||
              log.toLowerCase().includes('connection reset') ||
              log.toLowerCase().includes('handshake failed')
            ) {
              activeStreamInfo.lastError = 'Clé de flux YouTube invalide ou non reconnue par YouTube Studio.';
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'YouTube a refusé la connexion : Vérifiez que votre clé de flux sur YouTube Studio (studio.youtube.com/live) est valide.',
                }));
              }
            } else if (log.toLowerCase().includes('error')) {
              activeStreamInfo.lastError = log.trim();
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'relay_log',
                  log: log.trim(),
                }));
              }
            }
          });

          activeStreamProcess.on('close', (code) => {
            console.log(`[StreamNet Relay] FFmpeg process closed with code ${code}`);
            activeStreamInfo.isStreaming = false;
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'relay_status',
                state: 'closed',
                code,
                message: code === 0 ? 'Diffusion YouTube terminée normalement.' : 'Transmission YouTube arrêtée.',
              }));
            }
            activeStreamProcess = null;
          });

          activeStreamProcess.on('error', (err) => {
            console.error('[StreamNet Relay] FFmpeg spawn error:', err);
            activeStreamInfo.isStreaming = false;
            activeStreamInfo.lastError = err.message;
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'error',
                message: `Erreur encodeur FFmpeg: ${err.message}`,
              }));
            }
            activeStreamProcess = null;
          });

          ws.send(JSON.stringify({
            type: 'relay_status',
            state: 'starting',
            message: 'Encodeur RTMPS engagé vers YouTube Studio. Transmission des paquets en cours...',
          }));
        } else if (payload.action === 'stop') {
          console.log('[StreamNet Relay] Received stop command from client');
          if (activeStreamProcess) {
            const procToKill = activeStreamProcess;
            try {
              if (procToKill.stdin && procToKill.stdin.writable) {
                procToKill.stdin.end();
              }
              procToKill.kill('SIGINT');
              setTimeout(() => {
                try {
                  procToKill.kill('SIGKILL');
                } catch (e) {}
              }, 400);
            } catch (e) {}
            activeStreamProcess = null;
          }
          activeStreamInfo.isStreaming = false;
          try {
            ws.send(JSON.stringify({
              type: 'relay_status',
              state: 'stopped',
              message: 'Diffusion arrêtée avec succès.',
            }));
          } catch (e) {}
        }
      } catch (err: any) {
        console.error('[StreamNet Relay] Error parsing control message:', err);
      }
      return;
    }

    // Binary chunk: Pipe directly to FFmpeg stdin
    if (activeStreamProcess && activeStreamProcess.stdin.writable) {
      try {
        activeStreamProcess.stdin.write(data);
        activeStreamInfo.bytesReceived += data.length || 0;
      } catch (err) {
        console.error('[StreamNet Relay] Error writing binary chunk to FFmpeg stdin:', err);
      }
    }
  });

  ws.on('close', () => {
    console.log('[StreamNet Relay] Client disconnected');
    if (activeStreamProcess) {
      try {
        activeStreamProcess.stdin.end();
        activeStreamProcess.kill('SIGINT');
      } catch (e) {}
      activeStreamProcess = null;
    }
    activeStreamInfo.isStreaming = false;
  });
});

// Stream Status API
app.get('/api/stream/status', (_req, res) => {
  res.json({
    ...activeStreamInfo,
    activeProcess: !!activeStreamProcess,
  });
});

// Vite dev server mounting or static serving
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[StreamNet Server] Broadcast server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[StreamNet Server] Failed to start server:', err);
});
