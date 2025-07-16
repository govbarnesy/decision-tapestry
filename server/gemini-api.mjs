/**
 * Gemini API Module
 * Handles Google OAuth and Gemini API integration
 */

import crypto from 'crypto';

// OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:8080/api/gemini/auth/callback';

// Session storage (in production, use Redis or similar)
const sessions = new Map();
const authTokens = new Map();

/**
 * Initialize Gemini API routes
 */
export function initializeGeminiRoutes(app) {
  // Auth status check
  app.get('/api/gemini/auth/status', (req, res) => {
    const sessionId = req.headers.cookie?.match(/gemini_session=([^;]+)/)?.[1];
    const session = sessions.get(sessionId);
    
    if (session && session.authenticated) {
      res.json({
        authenticated: true,
        user: { email: session.email }
      });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Google OAuth login
  app.get('/api/gemini/auth/google', (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    const sessionId = crypto.randomBytes(16).toString('hex');
    
    sessions.set(sessionId, { state, authenticated: false });
    
    res.cookie('gemini_session', sessionId, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production' 
    });
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'email profile https://www.googleapis.com/auth/generative-language.retriever');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    
    res.redirect(authUrl.toString());
  });

  // OAuth callback
  app.get('/api/gemini/auth/callback', async (req, res) => {
    const { code, state } = req.query;
    const sessionId = req.headers.cookie?.match(/gemini_session=([^;]+)/)?.[1];
    const session = sessions.get(sessionId);
    
    if (!session || session.state !== state) {
      return res.status(400).send('Invalid state parameter');
    }
    
    try {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code'
        })
      });
      
      const tokens = await tokenResponse.json();
      
      if (!tokens.access_token) {
        throw new Error('Failed to get access token');
      }
      
      // Get user info
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      
      const userInfo = await userResponse.json();
      
      // Store tokens and user info
      session.authenticated = true;
      session.email = userInfo.email;
      session.tokens = tokens;
      sessions.set(sessionId, session);
      
      // Store tokens for Gemini API use
      authTokens.set(userInfo.email, tokens);
      
      // Close the popup and refresh parent
      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'auth-success' }, '*');
              window.close();
            </script>
            <p>Authentication successful! You can close this window.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).send('Authentication failed');
    }
  });

  // Logout
  app.post('/api/gemini/auth/logout', (req, res) => {
    const sessionId = req.headers.cookie?.match(/gemini_session=([^;]+)/)?.[1];
    if (sessionId) {
      const session = sessions.get(sessionId);
      if (session?.email) {
        authTokens.delete(session.email);
      }
      sessions.delete(sessionId);
    }
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
      
      // Get the user's access token
      const tokens = authTokens.get(session.email);
      if (!tokens) {
        throw new Error('No tokens found for user');
      }
      
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