// Pomocný skript pro odesílání alert e-mailů z monitoring.sh
import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Načti argumenty z příkazové řádky
const subject = process.argv[2];
const message = process.argv[3];
const toEmail = process.argv[4] || 'dolezal.jiri@seznam.cz';

if (!subject || !message) {
  console.error('Použití: node send-alert-email.js "Subject" "Message" [email]');
  process.exit(1);
}

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

// Seznam SMTP vyžaduje, aby "from" byla stejná jako přihlašovací e-mail
const fromAddress = emailConfig.user;
const fromName = emailConfig.from && emailConfig.from !== emailConfig.user 
  ? emailConfig.from 
  : 'Monitoring systém';

// Odesli e-mail
const mailOptions = {
  from: fromName ? `"${fromName}" <${fromAddress}>` : fromAddress,
  to: toEmail,
  subject: subject,
  text: message,
  html: message.replace(/\n/g, '<br>'),
};

try {
  const info = await transporter.sendMail(mailOptions);
  console.log('OK');
  process.exit(0);
} catch (error) {
  console.error('CHYBA:', error.message);
  process.exit(1);
}


