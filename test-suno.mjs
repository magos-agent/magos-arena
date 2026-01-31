import pkg from 'suno-ai';
const { SunoAI } = pkg;
import fs from 'fs';

const creds = JSON.parse(fs.readFileSync('/root/.config/suno/credentials.json', 'utf8'));
const suno = new SunoAI(creds.cookie);

try {
  await suno.init();
  console.log('✓ Suno connected!');
  
  // Check credits/limits
  const info = await suno.getLimitLeft();
  console.log('Credits remaining:', info);
} catch (err) {
  console.error('Error:', err.message);
}
