import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('Connected\!');
  
  // Send a canvas update message
  const message = {
    type: 'canvas-update',
    data: {
      type: 'html',
      content: '<div style="padding: 30px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); color: white; text-align: center; border-radius: 4px;"><h1>🎨 AI Canvas Test</h1><p>If you see this, the canvas is working\!</p></div>'
    }
  };
  
  ws.send(JSON.stringify(message));
  console.log('Message sent\!');
  
  setTimeout(() => {
    ws.close();
    process.exit(0);
  }, 1000);
});

ws.on('error', (err) => {
  console.error('Error:', err);
});
