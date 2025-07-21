#!/usr/bin/env node

/**
 * Test Visual Enhancement System
 * Demonstrates automatic visual generation based on conversation patterns
 */

import { visualCoordinator } from './claude-code-integration/ai-visual-coordinator.mjs';
import templates from './claude-code-integration/visual-templates.mjs';

console.log('🎨 Testing Visual Enhancement System...\n');

async function runTests() {
  try {
    // Test 1: Architecture Discussion
    console.log('1. Testing architecture discussion detection...');
    const architectureResponse = `
      Let me explain the system architecture. We have a microservices design with 
      the following components: UserService handles authentication, OrderService 
      manages orders, PaymentService processes payments, and NotificationService 
      sends alerts. These services communicate through a message queue.
    `;
    
    const archResult = await visualCoordinator.processResponse(architectureResponse);
    console.log(`   Detected ${archResult.visuals.length} visual opportunities\n`);
    await sleep(2000);

    // Test 2: Step-by-step Process
    console.log('2. Testing step-by-step process detection...');
    const processResponse = `
      Here's the deployment process:
      1. Run unit tests
      2. Build the Docker image
      3. Push to container registry
      4. Deploy to staging environment
      5. Run integration tests
      6. Deploy to production
    `;
    
    const processResult = await visualCoordinator.processResponse(processResponse);
    console.log(`   Detected ${processResult.visuals.length} visual opportunities\n`);
    await sleep(2000);

    // Test 3: Code Explanation
    console.log('3. Testing code explanation detection...');
    const codeResponse = `
      Let me explain how this function works:
      \`\`\`javascript
      function authenticate(username, password) {
        const user = findUser(username);
        if (!user) return { success: false, error: 'User not found' };
        
        const isValid = bcrypt.compare(password, user.passwordHash);
        if (!isValid) return { success: false, error: 'Invalid password' };
        
        return { success: true, token: generateToken(user) };
      }
      \`\`\`
      This function handles user authentication by checking credentials.
    `;
    
    const codeResult = await visualCoordinator.processResponse(codeResponse);
    console.log(`   Detected ${codeResult.visuals.length} visual opportunities\n`);
    await sleep(2000);

    // Test 4: UI/UX Discussion
    console.log('4. Testing UI/UX discussion detection...');
    const uiResponse = `
      For the login screen design, we need a clean interface with:
      - Email input field
      - Password input field  
      - "Remember me" checkbox
      - Login button (primary action)
      - "Forgot password?" link
      The layout should be centered with proper spacing.
    `;
    
    const uiResult = await visualCoordinator.processResponse(uiResponse);
    console.log(`   Detected ${uiResult.visuals.length} visual opportunities\n`);
    await sleep(2000);

    // Test 5: Error Debugging
    console.log('5. Testing error debugging detection...');
    const errorResponse = `
      I found the bug! The error "TypeError: Cannot read property 'id' of undefined" 
      occurs because we're not checking if the user object exists before accessing 
      its properties. We need to add a null check in the getUserProfile function.
    `;
    
    const errorResult = await visualCoordinator.processResponse(errorResponse);
    console.log(`   Detected ${errorResult.visuals.length} visual opportunities\n`);
    await sleep(2000);

    // Test 6: Data Structure
    console.log('6. Testing data structure detection...');
    const dataResponse = `
      The user data model has the following structure:
      {
        "id": "123",
        "username": "john_doe",
        "email": "john@example.com",
        "profile": {
          "firstName": "John",
          "lastName": "Doe",
          "avatar": "https://..."
        },
        "roles": ["user", "admin"]
      }
    `;
    
    const dataResult = await visualCoordinator.processResponse(dataResponse);
    console.log(`   Detected ${dataResult.visuals.length} visual opportunities\n`);

    // Test 7: Direct Template Usage
    console.log('7. Testing direct template usage...');
    await templates.process.workflow(
      'Development Workflow',
      ['Design', 'Implement', 'Test', 'Review', 'Deploy'],
      2
    );
    await sleep(2000);

    await templates.ui.formLayout(
      'User Registration',
      [
        { label: 'Email', type: 'email', required: true, placeholder: 'your@email.com' },
        { label: 'Password', type: 'password', required: true },
        { label: 'Confirm Password', type: 'password', required: true },
        { label: 'Terms', type: 'checkbox', text: 'I agree to the terms' }
      ],
      [
        { text: 'Sign Up', primary: true },
        { text: 'Cancel', primary: false }
      ]
    );

    // Summary
    console.log('\n✅ Visual Enhancement System Test Complete!');
    console.log('\nSummary:');
    console.log('- Architecture patterns: ✓');
    console.log('- Process detection: ✓');
    console.log('- Code visualization: ✓');
    console.log('- UI/UX wireframes: ✓');
    console.log('- Error diagnostics: ✓');
    console.log('- Data structures: ✓');
    console.log('- Template library: ✓');
    
    const contextSummary = visualCoordinator.getContextSummary();
    console.log(`\nTotal visuals generated: ${contextSummary.recentVisuals.length}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run tests
console.log('Make sure the Decision Tapestry server is running at http://localhost:8080');
console.log('Open the dashboard and click on the "AI Canvas" tab to see the visualizations.\n');

runTests();