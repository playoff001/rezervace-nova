// Testovací skript pro odeslání e-mailu přes nodemailer
import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { hostname } from 'os';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function getServerIP() {
  return new Promise((resolve) => {
    https.get('https://api.ipify.org?format=json', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.ip);
        } catch {
          resolve('Neznámá');
        }
      });
    }).on('error', () => resolve('Neznámá'));
  });
}

async function main() {
  // Načti konfiguraci
  const configPath = join(__dirname, 'server', 'data', 'config.json');
  let config;
  try {
    const configData = readFileSync(configPath, 'utf-8');
    config = JSON.parse(configData);
  } catch (error) {
    console.error('Chyba při načítání konfigurace:', error);
    process.exit(1);
  }

  const emailConfig = config.email;

  if (!emailConfig.host || !emailConfig.user || !emailConfig.password) {
    console.error('E-mail není nakonfigurovaný v admin nastavení!');
    process.exit(1);
  }

  // Vytvoř transporter
  const transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port || 587,
    secure: emailConfig.secure || false,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.password,
    },
    connectionTimeout: 10000,
    socketTimeout: 10000,
    greetingTimeout: 10000,
  });

  const serverIP = await getServerIP();
  const now = new Date().toLocaleString('cs-CZ');

  // Odesli testovací e-mail
  // Seznam SMTP vyžaduje, aby "from" byla stejná jako přihlašovací e-mail
  const fromAddress = emailConfig.user;
  const fromName = emailConfig.from && emailConfig.from !== emailConfig.user 
    ? emailConfig.from 
    : 'Monitoring systém';
  
  const mailOptions = {
    from: fromName ? `"${fromName}" <${fromAddress}>` : fromAddress,
    to: 'dolezal.jiri@seznam.cz',
    subject: 'TEST: Monitoring systém rezervačního formuláře',
    html: `
      <h2>Testovací e-mail z monitoring systému</h2>
      <p>Toto je testovací e-mail z monitoring systému rezervačního formuláře.</p>
      <p><strong>Monitoring systém je správně nakonfigurovaný a e-maily fungují.</strong></p>
      <hr>
      <p><strong>Čas odeslání:</strong> ${now}</p>
      <p><strong>Server:</strong> ${hostname()}</p>
      <p><strong>IP adresa:</strong> ${serverIP}</p>
      <hr>
      <p>Pokud jsi obdržel tento e-mail, monitoring systém funguje správně!</p>
    `,
    text: `
Testovací e-mail z monitoring systému rezervačního formuláře.

Monitoring systém je správně nakonfigurovaný a e-maily fungují.

Čas odeslání: ${now}
Server: ${hostname()}
IP adresa: ${serverIP}

Pokud jsi obdržel tento e-mail, monitoring systém funguje správně!
    `,
  };

  try {
    console.log('Odesílám testovací e-mail...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Testovací e-mail byl úspěšně odeslán!');
    console.log('Message ID:', info.messageId);
    console.log('Zkontroluj svou e-mailovou schránku: dolezal.jiri@seznam.cz');
  } catch (error) {
    console.error('✗ Chyba při odesílání e-mailu:', error);
    process.exit(1);
  }
}

main();

