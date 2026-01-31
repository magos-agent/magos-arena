import { chromium } from 'playwright';

const EMAIL = 'magos@agentmail.to';
const USERNAME = 'magos-agent';
const PASSWORD = 'M@g0s_Ag3nt_2026!Secure';

async function signup() {
  console.log('Launching browser...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1024 }
  });
  const page = await context.newPage();
  
  try {
    console.log('Navigating to GitHub signup...');
    await page.goto('https://github.com/signup', { waitUntil: 'networkidle' });
    
    // Dismiss cookie banner
    await page.click('button:has-text("Reject")').catch(() => {});
    await page.waitForTimeout(500);
    
    // Fill form
    console.log('Filling form...');
    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="password"]', PASSWORD);
    await page.fill('input[name="login"]', USERNAME);
    
    // Wait for validation checkmarks
    await page.waitForTimeout(2000);
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    // Click Create account button specifically (the big green one at bottom)
    console.log('Clicking Create account...');
    await page.locator('button.signup-continue-button, button:has-text("Create account")').last().click();
    
    // Wait for navigation or captcha
    console.log('Waiting for response...');
    await page.waitForTimeout(8000);
    
    // Take multiple screenshots
    await page.screenshot({ path: '/root/clawd/github_result1.png', fullPage: true });
    
    const url = page.url();
    console.log('Current URL:', url);
    
    // Check what page we're on
    const content = await page.content();
    
    if (url.includes('captcha') || content.includes('octocaptcha') || content.includes('puzzle')) {
      console.log('');
      console.log('🛑 CAPTCHA BARRIER');
      console.log('GitHub requires human verification.');
      console.log('');
      console.log('Options:');
      console.log('1. You complete captcha manually');
      console.log('2. Use a captcha solving service');
      console.log('3. Create account manually using these credentials:');
      console.log('');
      console.log('   Email:    magos@agentmail.to');
      console.log('   Username: magos-agent');
      console.log('   Password: M@g0s_Ag3nt_2026!Secure');
      console.log('');
    } else if (url.includes('verify') || content.includes('verification code')) {
      console.log('');
      console.log('✅ PAST CAPTCHA - Email verification needed');
      console.log('Check magos@agentmail.to for verification code');
      console.log('');
    } else if (url.includes('welcome') || content.includes('Welcome')) {
      console.log('');
      console.log('🎉 ACCOUNT CREATED SUCCESSFULLY!');
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: '/root/clawd/github_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

signup();
