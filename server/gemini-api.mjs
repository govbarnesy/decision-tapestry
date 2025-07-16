/**
 * Gemini API Module
 * Handles Google OAuth and Gemini API integration
 */

// Simple API key approach - much easier!
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_FREE_API_KEY_HERE';

// Simple session storage for demo
const sessions = new Map();

/**
 * Initialize Gemini API routes
 */
export function initializeGeminiRoutes(app) {
  // Simple auth status check - just check if API key is available
  app.get('/api/gemini/auth/status', (req, res) => {
    const hasApiKey = GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_FREE_API_KEY_HERE';
    
    if (hasApiKey) {
      res.json({
        authenticated: true,
        user: { email: 'gemini-user@example.com' }
      });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Simple setup instructions
  app.get('/api/gemini/auth/google', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>Gemini API Setup</title>
          <style>
            body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; }
            .code { background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; }
            .step { margin: 20px 0; padding: 15px; border-left: 4px solid #4285f4; }
          </style>
        </head>
        <body>
          <h1>🚀 Set up Free Gemini API</h1>
          
          <div class="step">
            <h3>Step 1: Get your free API key</h3>
            <p>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a></p>
            <p>Sign in with your Google account and click "Create API Key"</p>
          </div>
          
          <div class="step">
            <h3>Step 2: Set your API key</h3>
            <p>Copy your API key and run this command:</p>
            <div class="code">export GEMINI_API_KEY="your_api_key_here"</div>
            <p>Then restart the server:</p>
            <div class="code">npm start</div>
          </div>
          
          <div class="step">
            <h3>Step 3: That's it!</h3>
            <p>Refresh this page and you'll see the Gemini interface</p>
          </div>
          
          <script>
            setTimeout(() => {
              window.close();
            }, 10000);
          </script>
        </body>
      </html>
    `);
  });

  // Simple logout (just for demo)
  app.post('/api/gemini/auth/logout', (req, res) => {
    res.json({ success: true });
  });

  // Gemini prompt endpoint
  app.post('/api/gemini/prompt', async (req, res) => {
    const sessionId = req.headers.cookie?.match(/gemini_session=([^;]+)/)?.[1];
    const session = sessions.get(sessionId);
    
    if (!session?.authenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { prompt, context } = req.body;
    
    try {
      // Set up SSE for streaming
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      
      // For free API key approach, we don't need tokens
      // In production, this would use the actual Gemini API with the API key
      
      // For now, simulate Gemini response
      // In production, use the actual Gemini API with the access token
      const response = await simulateGeminiResponse(prompt);
      
      // Stream the response
      for (const chunk of response) {
        res.write(chunk);
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate streaming delay
      }
      
      res.end();
    } catch (error) {
      console.error('Gemini prompt error:', error);
      res.write(`Error: ${error.message}`);
      res.end();
    }
  });
}

/**
 * Simulate Gemini response for testing
 * In production, this would call the actual Gemini API
 */
async function simulateGeminiResponse(prompt) {
  const responses = {
    'authentication': 'Based on your decisions, here are the authentication-related items:\n\n• Decision #12: Implement OAuth2 authentication\n• Decision #23: Add two-factor authentication\n• Decision #45: Create session management system\n\nWould you like me to create a new decision or explore these in more detail?',
    'create': 'I\'ll help you create a new decision. Based on your request for user notifications, here\'s a draft:\n\n**Title**: Implement Real-time User Notifications\n**Rationale**:\n- Users need timely updates about system events\n- Improve user engagement and awareness\n- Support both in-app and email notifications\n\n**Tasks**:\n1. Design notification schema and storage\n2. Implement WebSocket notification delivery\n3. Create notification preferences UI\n4. Add email notification service\n\nShall I add this to your decisions?',
    'ui/ux': 'Here are your recent UI/UX decisions:\n\n• Decision #78: Dashboard redesign with dark mode\n• Decision #82: Improve mobile responsiveness\n• Decision #85: Add activity visualization\n\nEach focuses on enhancing user experience. Would you like details on any of these?',
    'pending': 'You have 23 pending tasks across 8 decisions:\n\n**High Priority**:\n• Decision #86: Complete Gemini integration (3 tasks)\n• Decision #87: Finish DOM editor (4 tasks)\n\n**Medium Priority**:\n• Decision #73: GitHub webhook implementation (2 tasks)\n• Decision #81: Performance optimization (5 tasks)\n\nWould you like me to help prioritize these?'
  };
  
  // Simple keyword matching for demo
  const lowercasePrompt = prompt.toLowerCase();
  let response = 'I understand you\'re asking about: "' + prompt + '"\n\n';
  
  if (lowercasePrompt.includes('authentication') || lowercasePrompt.includes('auth')) {
    response = responses.authentication;
  } else if (lowercasePrompt.includes('create')) {
    response = responses.create;
  } else if (lowercasePrompt.includes('ui') || lowercasePrompt.includes('ux')) {
    response = responses['ui/ux'];
  } else if (lowercasePrompt.includes('pending')) {
    response = responses.pending;
  } else {
    response += 'I can help you with:\n• Finding related decisions\n• Creating new decisions\n• Analyzing decision patterns\n• Managing tasks and priorities\n\nWhat would you like to explore?';
  }
  
  // Convert response to chunks for streaming
  const chunks = response.match(/.{1,20}/g) || [];
  return chunks;
}

export default { initializeGeminiRoutes };