import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Log all requests to terminal
app.use((req, res, next) => {
  console.log(`[Mock] ${req.method} ${req.url}`);
  next();
});

const PORT = 8081;

let logs = [
  "[NextMenu] Mock Server initialized",
  "[NextMenu] System ready",
  "[NextMenu] Found 3 payloads on storage"
];

let autoloadStatus = {
  remaining: 10,
  total: 2,
  done: 0,
  current: "IDLE",
  list: "goldhen_v2.4b17.elf,etaHEN_1.8.elf"
};

const autoloadList = autoloadStatus.list.split(',');
let simulationTicks = 0;

setInterval(() => {
  if (autoloadStatus.remaining > 0) {
    autoloadStatus.remaining--;
    if (autoloadStatus.remaining === 0) {
      autoloadStatus.current = autoloadList[0];
      logs.push(`[NextMenu] Autoload sequence started: ${autoloadList[0]}`);
    }
  } else if (autoloadStatus.remaining === 0 && autoloadStatus.current !== "DONE" && autoloadStatus.current !== "IDLE") {
    simulationTicks++;
    if (simulationTicks >= 3) { // 3 seconds per payload simulation
      simulationTicks = 0;
      autoloadStatus.done++;
      if (autoloadStatus.done < autoloadStatus.total) {
        autoloadStatus.current = autoloadList[autoloadStatus.done];
        logs.push(`[NextMenu] Autoloading: ${autoloadStatus.current}`);
      } else {
        autoloadStatus.current = "DONE";
        logs.push(`[NextMenu] Autoload sequence complete`);
      }
    }
  }
}, 1000);

// --- API Routes ---

app.get('/getip', (req, res) => {
  res.send('127.0.0.1');
});

app.get('/version', (req, res) => {
  res.send('1.0.2-mock');
});

app.get('/list_payloads', (req, res) => {
  res.json({
    payloads: [
      "/data/next_menu/goldhen_v2.4b17.elf",
      "/data/next_menu/etaHEN_1.8.elf",
      "/data/next_menu/kstuff.elf",
      "/mnt/usb0/next_menu/linux_loader.elf"
    ]
  });
});

app.get('/autoload_status', (req, res) => {
  res.json(autoloadStatus);
});

app.get('/get_config', (req, res) => {
  res.json({
    AUTOLOAD_ENABLED: true,
    AUTOLOAD_LIST: "goldhen_v2.4b17.elf,etaHEN_1.8.elf"
  });
});

app.post('/set_config', (req, res) => {
  console.log('Received Config:', req.body);
  logs.push(`[NextMenu] Config updated: ${JSON.stringify(req.body)}`);
  res.send('OK');
});

app.get(/^\/loadpayload:(.*)/, (req, res) => {
  const path = req.params[0];
  logs.push(`[NextMenu] Executing payload: ${path}`);
  res.send('OK');
});

app.get('/manage\\:delete', (req, res) => {
  const filename = req.query.filename;
  logs.push(`[NextMenu] Deleted payload: ${filename}`);
  res.send('OK');
});

app.post('/manage\\:upload', (req, res) => {
  const filename = req.query.filename;
  logs.push(`[NextMenu] Uploaded payload: ${filename}`);
  res.send('OK');
});

app.get('/abort', (req, res) => {
  logs.push(`[NextMenu] Autoload sequence aborted by user`);
  autoloadStatus.remaining = -1;
  autoloadStatus.current = "IDLE";
  res.send('OK');
});

app.get('/autoload_clear', (req, res) => {
  logs.push(`[NextMenu] Autoload status cleared`);
  autoloadStatus.done = 0;
  autoloadStatus.current = "IDLE";
  autoloadStatus.remaining = -1;
  res.send('OK');
});

app.get('/shutdown', (req, res) => {
  logs.push(`[NextMenu] System shutdown requested`);
  res.send('Shutting down...');
  process.exit(0);
});

// SSE for logs
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendLog = (data) => {
    res.write(`data: ${data}\n\n`);
  };

  // Send history
  logs.forEach(sendLog);

  // Poll for new logs
  let lastCount = logs.length;
  const interval = setInterval(() => {
    if (logs.length > lastCount) {
      for (let i = lastCount; i < logs.length; i++) {
        sendLog(logs[i]);
      }
      lastCount = logs.length;
    }
  }, 500);

  req.on('close', () => {
    clearInterval(interval);
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`\x1b[36m%s\x1b[0m`, `--- Next Menu Mock Backend ---`);
  console.log(`Running at http://localhost:${PORT}`);
  console.log(`Proxy your Vite requests to this port to test the frontend locally.`);
});
