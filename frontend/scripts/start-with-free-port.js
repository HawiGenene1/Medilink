const net = require('net');
const { spawn } = require('child_process');
const path = require('path');

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', (err) => {
        // If the port is in use or cannot bind, it's not available
        resolve(false);
      })
      .once('listening', () => {
        server.close(() => resolve(true));
      })
      .listen(port, '0.0.0.0');
  });
}

async function findFreePort(startPort = 3000, maxPort = 65535) {
  let port = startPort;
  while (port <= maxPort) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await checkPort(port);
    if (ok) return port;
    port += 1;
  }
  throw new Error('No free port found');
}

(async () => {
  try {
    const envStart = process.env.PORT ? Number(process.env.PORT) : 3000;
    const port = await findFreePort(envStart);
    const env = Object.assign({}, process.env, { PORT: String(port) });

    console.log(`Starting React dev server on port ${port}`);

    // Resolve path to react-scripts executable in node_modules
    const reactScriptsBin = path.join(__dirname, '..', 'node_modules', '.bin', process.platform === 'win32' ? 'react-scripts.cmd' : 'react-scripts');

    const child = spawn(reactScriptsBin, ['start'], {
      stdio: 'inherit',
      env,
      shell: true,
    });

    child.on('exit', (code) => {
      process.exit(code);
    });
  } catch (err) {
    console.error('Failed to start dev server:', err);
    process.exit(1);
  }
})();
