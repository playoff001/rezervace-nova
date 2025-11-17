import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
// jsPDF bude importován dynamicky kvůli ES modules

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;
const DATA_DIR = join(__dirname, 'data');

// Middleware
// CORS - v produkci povolíme jen konkrétní domény
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'https://aplikace.eu', 'http://aplikace.eu'];

app.use(cors({
  origin: function (origin, callback) {
    // Povolíme požadavky bez origin (např. Postman) nebo z povolených domén
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Zajištění existence data složky
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Chyba při vytváření data složky:', error);
  }
}

// Načtení dat ze souboru
async function loadData(filename) {
  try {
    const filePath = join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Pokud soubor neexistuje, vrátíme výchozí hodnoty
    if (error.code === 'ENOENT') {
      return getDefaultData(filename);
    }
    throw error;
  }
}

// Uložení dat do souboru
async function saveData(filename, data) {
  const filePath = join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Výchozí data
function getDefaultData(filename) {
  if (filename === 'rooms.json') {
    // Prázdný seznam - defaultní pokoj se vytvoří v GET /api/rooms pokud neexistuje
    return { rooms: [] };
  }
  if (filename === 'reservations.json') {
    return { reservations: [] };
  }
  if (filename === 'blocks.json') {
    return { blocks: [] };
  }
  if (filename === 'admin.json') {
    // Výchozí admin: username: admin, password: admin123
    const passwordHash = bcrypt.hashSync('admin123', 10);
    return {
      admin: {
        id: uuidv4(),
        username: 'admin',
        passwordHash,
        email: 'admin@penzion.cz',
        smsGateway: '',
        createdAt: new Date().toISOString(),
      },
    };
  }
  if (filename === 'config.json') {
    return {
      email: {
        host: '',
        port: 587,
        secure: false,
        user: '',
        password: '',
        from: '',
      },
      sms: {
        apiKey: '',
        apiUrl: '',
        sender: '',
      },
      guesthouse: {
        name: '',
        ico: '',
        dic: '',
        address: {
          street: '',
          city: '',
          zipCode: '',
          country: 'Česká republika',
        },
        bankAccount: {
          accountNumber: '',
          bankCode: '',
        },
        depositPercentage: 50, // Výchozí 50% záloha
      },
      counters: {
        variableSymbol: {}, // { "2025": 1, "2026": 1, ... }
        invoiceNumber: {}, // { "2025": 1, "2026": 1, ... }
      },
    };
  }
  return {};
}

// ==================== POMOCNÉ FUNKCE ====================

// Generování variabilního symbolu (rok + pořadové číslo)
async function generateVariableSymbol() {
  const config = await loadData('config.json');
  const year = new Date().getFullYear().toString();
  
  if (!config.counters) {
    config.counters = { variableSymbol: {}, invoiceNumber: {} };
  }
  if (!config.counters.variableSymbol) {
    config.counters.variableSymbol = {};
  }
  
  if (!config.counters.variableSymbol[year]) {
    config.counters.variableSymbol[year] = 0;
  }
  
  config.counters.variableSymbol[year]++;
  const number = config.counters.variableSymbol[year];
  await saveData('config.json', config);
  
  return `${year}-${String(number).padStart(3, '0')}`;
}

// Generování čísla faktury (rok + pořadové číslo)
async function generateInvoiceNumber() {
  const config = await loadData('config.json');
  const year = new Date().getFullYear().toString();
  
  if (!config.counters) {
    config.counters = { variableSymbol: {}, invoiceNumber: {} };
  }
  if (!config.counters.invoiceNumber) {
    config.counters.invoiceNumber = {};
  }
  
  if (!config.counters.invoiceNumber[year]) {
    config.counters.invoiceNumber[year] = 0;
  }
  
  config.counters.invoiceNumber[year]++;
  const number = config.counters.invoiceNumber[year];
  await saveData('config.json', config);
  
  return `${year}-${String(number).padStart(3, '0')}`;
}

// Konverze čísla účtu do IBAN formátu (pokud není už v IBAN)
function formatAccountToIBAN(accountNumber) {
  if (!accountNumber) return '';
  
  // Pokud už je v IBAN formátu (začíná CZ), vrať jak je
  const cleaned = accountNumber.replace(/\s/g, '').toUpperCase();
  if (cleaned.startsWith('CZ') && cleaned.length === 24) {
    return cleaned;
  }
  
  let prefix = '';
  let account = '';
  let bankCode = '';
  
  // Pokud je ve formátu prefix-číslo/bankovní_kód (např. 000000-6450062003/5500 nebo 19-2000145399/0800)
  const matchWithPrefix = accountNumber.match(/(\d+)-(\d+)\/(\d+)/);
  // Pokud je ve formátu číslo/bankovní_kód (např. 2001756714/2010 nebo 6450062003/5500)
  const matchWithoutPrefix = accountNumber.match(/(\d+)\/(\d+)/);
  
  if (matchWithPrefix) {
    // Formát: prefix-číslo/bankovní_kód
    prefix = matchWithPrefix[1];
    account = matchWithPrefix[2];
    bankCode = matchWithPrefix[3];
  } else if (matchWithoutPrefix) {
    // Formát: číslo/bankovní_kód (prefix je prázdný nebo 0)
    prefix = '';
    account = matchWithoutPrefix[1];
    bankCode = matchWithoutPrefix[2];
  } else {
    // Pokud není ve standardním formátu, zkus to použít jak je
    console.warn('Neznámý formát čísla účtu:', accountNumber);
    return cleaned;
  }
  
  // Vytvoříme IBAN: CZ + 2 kontrolní číslice + 4 bankovní kód + 6 prefix (doplněno nulami) + 10 číslo účtu
  // IBAN pro ČR má 24 znaků: CZ(2) + kontrolní číslice(2) + bankovní kód(4) + prefix(6) + číslo účtu(10)
  const accountPadded = account.padStart(10, '0'); // 10 číslic
  const prefixPadded = prefix.padStart(6, '0'); // 6 číslic (prefix)
  const bankCodePadded = bankCode.padStart(4, '0'); // 4 číslice (bankovní kód)
  const bban = bankCodePadded + prefixPadded + accountPadded; // BBAN = 4 bankovní kód + 6 prefix + 10 číslo účtu
  
  // Výpočet IBAN kontrolních číslic podle ISO 13616
  // 1. Přesuneme první 4 znaky (CZ00) na konec: bban + CZ00
  // 2. Převádíme písmena na čísla (C=12, Z=35)
  // 3. Vypočítáme mod 97
  // 4. Kontrolní číslice = 98 - mod 97
  const rearranged = bban + 'CZ00';
  let numericString = '';
  for (let i = 0; i < rearranged.length; i++) {
    const char = rearranged[i];
    if (char >= '0' && char <= '9') {
      numericString += char;
    } else if (char >= 'A' && char <= 'Z') {
      numericString += (char.charCodeAt(0) - 55).toString();
    }
  }
  
  // Vypočítáme mod 97 pomocí BigInt (protože číslo může být velké)
  let remainder = 0n;
  for (let i = 0; i < numericString.length; i++) {
    remainder = (remainder * 10n + BigInt(numericString[i])) % 97n;
  }
  
  const checkDigits = String(98 - Number(remainder)).padStart(2, '0');
  const iban = `CZ${checkDigits}${bban}`;
  
  console.log('Konverze účtu na IBAN:', { accountNumber, prefix, account, bankCode, iban });
  
  return iban;
}

// Generování QR kódu pro SPD platbu
async function generateQRCodeSPD(accountNumber, amount, variableSymbol, message = '') {
  // Formát SPD: SPD*1.0*ACC:CZ6508000000192000145399*AM:480.50*CC:CZK*MSG:PLATBA ZA ZBOZI*X-VS:1234567890
  // Převedeme číslo účtu do IBAN formátu
  const ibanAccount = formatAccountToIBAN(accountNumber);
  
  if (!ibanAccount) {
    console.error('Nelze převést číslo účtu do IBAN formátu:', accountNumber);
    return null;
  }
  
  // Odstraníme pomlčky a mezery z VS pro QR kód
  const vsClean = variableSymbol ? variableSymbol.replace(/[-\s]/g, '') : '';
  
  // Formát částky - musí být s desetinnou tečkou
  const amountFormatted = parseFloat(amount).toFixed(2);
  
  // IBAN musí být bez mezer
  const ibanClean = ibanAccount.replace(/\s/g, '');
  
  let spdString = `SPD*1.0*ACC:${ibanClean}*AM:${amountFormatted}*CC:CZK`;
  
  if (message) {
    // Omezíme délku zprávy na 60 znaků, odstraníme diakritiku a speciální znaky
    // Odstraníme diakritiku pomocí normalizace
    let msg = message.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Odstraníme speciální znaky, ponecháme jen písmena, čísla a mezery
    msg = msg.replace(/[^\w\s]/g, '').replace(/\*/g, '');
    // Omezíme délku
    msg = msg.substring(0, 60).trim();
    if (msg) {
      spdString += `*MSG:${msg}`;
    }
  }
  
  if (vsClean) {
    spdString += `*X-VS:${vsClean}`;
  }
  
  console.log('Generování QR kódu SPD:', spdString);
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(spdString, {
      errorCorrectionLevel: 'H', // Vyšší error correction pro lepší čitelnost
      type: 'image/png',
      width: 300, // Původní velikost
      margin: 2, // Okraje kolem QR kódu
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Chyba při generování QR kódu:', error);
    return null;
  }
}

// ==================== POKOJE ====================

app.get('/api/rooms', async (req, res) => {
  try {
    let data = await loadData('rooms.json');
    if (!data.rooms) {
      data.rooms = [];
    }
    
    // Zkontrolujeme, jestli už existuje pokoj s názvem "Penzion"
    const penzionExists = data.rooms.some(room => room.name === 'Penzion');
    
    // Pokud neexistuje, vytvoříme defaultní pokoj "Penzion"
    if (!penzionExists) {
      const defaultRoom = {
        id: uuidv4(),
        name: 'Penzion',
        capacity: 12,
        pricePerNight: 1000, // fallback cena
        pricingModel: 'seasonal',
        seasonalPricing: {
          mainSeason: {
            2: 18000,
            3: 25000,
            4: 31000,
            5: 37000,
            6: 43000,
            7: 49000,
          },
          offSeason: {
            2: 16000,
            3: 22000,
            4: 27000,
            5: 33000,
            6: 39000,
            7: 45000,
          },
          holidays: {
            christmas: {
              4: 40000,
              6: 50000,
            },
            newyear: {
              7: 70000,
            },
            easter: {
              5: 45000,
              7: 50000,
            },
          },
        },
        description: 'Celý penzion s kapacitou pro 12 osob. V letních měsících preferujeme týdenní pobyty se střídáním v sobotu, nebo v neděli. V zimních měsících pobyty alespoň na 3 noci.',
        available: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.rooms.push(defaultRoom);
      await saveData('rooms.json', data);
    }
    
    res.json({ rooms: data.rooms || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/rooms/:id', async (req, res) => {
  try {
    const data = await loadData('rooms.json');
    const room = data.rooms.find(r => r.id === req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Pokoj nenalezen' });
    }
    res.json({ room });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const data = await loadData('rooms.json');
    const newRoom = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.rooms.push(newRoom);
    await saveData('rooms.json', data);
    res.json({ room: newRoom });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/rooms/:id', async (req, res) => {
  try {
    const data = await loadData('rooms.json');
    const index = data.rooms.findIndex(r => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Pokoj nenalezen' });
    }
    data.rooms[index] = {
      ...data.rooms[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    await saveData('rooms.json', data);
    res.json({ room: data.rooms[index] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/rooms/:id', async (req, res) => {
  try {
    const data = await loadData('rooms.json');
    data.rooms = data.rooms.filter(r => r.id !== req.params.id);
    await saveData('rooms.json', data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== REZERVACE ====================

app.get('/api/reservations', async (req, res) => {
  try {
    const data = await loadData('reservations.json');
    res.json({ reservations: data.reservations || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Smazání všech rezervací - MUSÍ být před routami s :id
app.post('/api/reservations/delete-all', async (req, res) => {
  try {
    console.log('DELETE ALL RESERVATIONS - Request received');
    const { password } = req.body;
    
    if (!password) {
      console.log('DELETE ALL RESERVATIONS - Password missing');
      return res.status(400).json({ error: 'Heslo je povinné' });
    }
    
    // Ověření hesla
    const adminData = await loadData('admin.json');
    if (!adminData.admin) {
      console.log('DELETE ALL RESERVATIONS - Admin account not found');
      return res.status(500).json({ error: 'Admin účet není nastaven' });
    }
    
    const isValid = await bcrypt.compare(password, adminData.admin.passwordHash);
    if (!isValid) {
      console.log('DELETE ALL RESERVATIONS - Invalid password');
      return res.status(401).json({ error: 'Neplatné heslo' });
    }
    
    // Smazání všech rezervací
    const data = await loadData('reservations.json');
    const deletedCount = data.reservations ? data.reservations.length : 0;
    data.reservations = [];
    await saveData('reservations.json', data);
    
    console.log(`DELETE ALL RESERVATIONS - Successfully deleted ${deletedCount} reservations`);
    const text = deletedCount === 1 ? 'rezervace' : deletedCount < 5 ? 'rezervace' : 'rezervací';
    res.json({ 
      success: true, 
      message: `Smazáno ${deletedCount} ${text}`,
      deletedCount 
    });
  } catch (error) {
    console.error('DELETE ALL RESERVATIONS - Error:', error);
    res.status(500).json({ error: error.message || 'Nepodařilo se smazat rezervace' });
  }
});

app.get('/api/reservations/:id', async (req, res) => {
  try {
    const data = await loadData('reservations.json');
    const reservation = data.reservations.find(r => r.id === req.params.id);
    if (!reservation) {
      return res.status(404).json({ error: 'Rezervace nenalezena' });
    }
    res.json({ reservation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reservations', async (req, res) => {
  try {
    const data = await loadData('reservations.json');
    const roomsData = await loadData('rooms.json');
    const room = roomsData.rooms.find(r => r.id === req.body.roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Pokoj nenalezen' });
    }

    // Generování variabilního symbolu a čísla faktury
    const variableSymbol = await generateVariableSymbol();
    const invoiceNumber = await generateInvoiceNumber();
    
    // Načtení procenta zálohy z konfigurace (výchozí 50%)
    const config = await loadData('config.json');
    const depositPercentage = config.guesthouse?.depositPercentage || 50;
    const depositAmount = Math.round(req.body.totalPrice * (depositPercentage / 100));

    console.log('Vytváření rezervace s platebními údaji:', {
      variableSymbol,
      invoiceNumber,
      depositAmount,
      totalPrice: req.body.totalPrice
    });

    const newReservation = {
      id: uuidv4(),
      ...req.body,
      roomName: room.name,
      status: 'pending',
      variableSymbol,
      invoiceNumber,
      depositAmount,
      depositPaid: false,
      finalPaymentPaid: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    data.reservations.push(newReservation);
    await saveData('reservations.json', data);
    
    console.log('Rezervace vytvořena:', newReservation.id, 'VS:', variableSymbol, 'Faktura:', invoiceNumber);
    
    // Odeslání e-mailu a SMS (pokud je nakonfigurováno) - asynchronně v pozadí, aby neblokovalo odpověď
    sendReservationNotifications(newReservation).catch(err => {
      console.error('Chyba při odesílání notifikací (rezervace byla vytvořena):', err);
    });
    
    res.json({ reservation: newReservation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/reservations/:id', async (req, res) => {
  try {
    const data = await loadData('reservations.json');
    const index = data.reservations.findIndex(r => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Rezervace nenalezena' });
    }
    data.reservations[index] = {
      ...data.reservations[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    await saveData('reservations.json', data);
    res.json({ reservation: data.reservations[index] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reservations/:id/cancel', async (req, res) => {
  try {
    const { refundAmount, refundReason } = req.body;
    const data = await loadData('reservations.json');
    const index = data.reservations.findIndex(r => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Rezervace nenalezena' });
    }
    data.reservations[index].status = 'cancelled';
    if (refundAmount !== undefined) {
      data.reservations[index].refundAmount = refundAmount;
    }
    if (refundReason) {
      data.reservations[index].refundReason = refundReason;
    }
    data.reservations[index].updatedAt = new Date().toISOString();
    await saveData('reservations.json', data);
    res.json({ reservation: data.reservations[index] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reservations/:id/paid', async (req, res) => {
  try {
    const data = await loadData('reservations.json');
    const index = data.reservations.findIndex(r => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Rezervace nenalezena' });
    }
    data.reservations[index].status = 'paid';
    data.reservations[index].depositPaid = true;
    data.reservations[index].finalPaymentPaid = true;
    data.reservations[index].updatedAt = new Date().toISOString();
    await saveData('reservations.json', data);
    res.json({ reservation: data.reservations[index] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reservations/:id/deposit-paid', async (req, res) => {
  try {
    const data = await loadData('reservations.json');
    const index = data.reservations.findIndex(r => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Rezervace nenalezena' });
    }
    data.reservations[index].depositPaid = true;
    // Pokud je záloha i doplatek zaplacen, nastavíme status na paid
    if (data.reservations[index].finalPaymentPaid) {
      data.reservations[index].status = 'paid';
    }
    data.reservations[index].updatedAt = new Date().toISOString();
    await saveData('reservations.json', data);
    res.json({ reservation: data.reservations[index] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reservations/:id/final-payment-paid', async (req, res) => {
  try {
    const data = await loadData('reservations.json');
    const index = data.reservations.findIndex(r => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Rezervace nenalezena' });
    }
    data.reservations[index].finalPaymentPaid = true;
    // Pokud je záloha i doplatek zaplacen, nastavíme status na paid
    if (data.reservations[index].depositPaid) {
      data.reservations[index].status = 'paid';
    }
    data.reservations[index].updatedAt = new Date().toISOString();
    await saveData('reservations.json', data);
    res.json({ reservation: data.reservations[index] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== BLOKACE ====================

app.get('/api/blocks', async (req, res) => {
  try {
    const data = await loadData('blocks.json');
    let blocks = data.blocks || [];
    
    if (req.query.roomId) {
      blocks = blocks.filter(b => b.roomId === req.query.roomId);
    }
    
    res.json({ blocks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/blocks', async (req, res) => {
  try {
    const data = await loadData('blocks.json');
    const newBlock = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString(),
    };
    data.blocks.push(newBlock);
    await saveData('blocks.json', data);
    res.json({ block: newBlock });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/blocks/:id', async (req, res) => {
  try {
    const data = await loadData('blocks.json');
    data.blocks = data.blocks.filter(b => b.id !== req.params.id);
    await saveData('blocks.json', data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== KALENDÁŘ ====================

app.get('/api/calendar/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const reservationsData = await loadData('reservations.json');
    const blocksData = await loadData('blocks.json');
    
    const reservations = (reservationsData.reservations || []).filter(
      r => r.roomId === roomId && r.status !== 'cancelled'
    );
    const blocks = (blocksData.blocks || []).filter(b => b.roomId === roomId);
    
    res.json({ reservations, blocks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMIN ====================

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const data = await loadData('admin.json');
    
    if (!data.admin || data.admin.username !== username) {
      return res.status(401).json({ error: 'Neplatné přihlašovací údaje' });
    }
    
    const isValid = await bcrypt.compare(password, data.admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Neplatné přihlašovací údaje' });
    }
    
    // Jednoduchý token (v produkci použijte JWT)
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    
    res.json({ 
      token,
      admin: {
        id: data.admin.id,
        username: data.admin.username,
        email: data.admin.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/config', async (req, res) => {
  try {
    const config = await loadData('config.json');
    res.json({ config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/config', async (req, res) => {
  try {
    await saveData('config.json', req.body);
    res.json({ config: req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/sms/:reservationId', async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { message } = req.body;
    
    const reservationsData = await loadData('reservations.json');
    const reservation = reservationsData.reservations.find(r => r.id === reservationId);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Rezervace nenalezena' });
    }
    
    // Odeslání SMS (implementace závisí na SMS bráně)
    await sendSMS(reservation.guestPhone, message);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint pro generování QR kódu
app.get('/api/reservations/:id/qrcode', async (req, res) => {
  try {
    const { id } = req.params;
    const reservationsData = await loadData('reservations.json');
    const reservation = reservationsData.reservations.find(r => r.id === id);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Rezervace nenalezena' });
    }
    
    const config = await loadData('config.json');
    const accountNumber = config.guesthouse?.bankAccount?.accountNumber;
    
    if (!accountNumber) {
      return res.status(400).json({ error: 'Číslo účtu není nastaveno' });
    }
    
    // Pro zálohu nebo celkovou částku
    const amount = req.query.type === 'deposit' && reservation.depositAmount 
      ? reservation.depositAmount 
      : reservation.totalPrice;
    
    const qrCode = await generateQRCodeSPD(
      accountNumber,
      amount,
      reservation.variableSymbol || '',
      `Rezervace ${reservation.id}`
    );
    
    if (!qrCode) {
      return res.status(500).json({ error: 'Nepodařilo se vygenerovat QR kód' });
    }
    
    res.json({ qrCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint pro generování PDF faktury
app.get('/api/reservations/:id/invoice', async (req, res) => {
  try {
    const { id } = req.params;
    const reservationsData = await loadData('reservations.json');
    const reservation = reservationsData.reservations.find(r => r.id === id);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Rezervace nenalezena' });
    }
    
    const config = await loadData('config.json');
    const guesthouse = config.guesthouse;
    
    if (!guesthouse || !guesthouse.name || !guesthouse.ico) {
      return res.status(400).json({ error: 'Nastavení penzionu není kompletní. Prosím vyplňte údaje v administraci → Nastavení.' });
    }
    
    // Generování PDF faktury (async funkce)
    const pdfBuffer = await generateInvoicePDF(reservation, guesthouse);
    
    // Nastavení hlaviček pro PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="faktura-${reservation.invoiceNumber || reservation.id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Odeslání PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Chyba při generování faktury:', error);
    res.status(500).json({ error: error.message || 'Nepodařilo se vygenerovat fakturu' });
  }
});

// Funkce pro generování PDF faktury
async function generateInvoicePDF(reservation, guesthouse) {
  console.log('=== GENEROVÁNÍ PDF FAKTURY ===');
  console.log('Rezervace ID:', reservation.id);
  console.log('Invoice number:', reservation.invoiceNumber);
  
  try {
    // Použijeme pdfkit pro generování PDF (HTML šablona je připravena v server/templates/invoice.html pro budoucí použití)
    console.log('Načítám pdfkit...');
    const PDFDocument = (await import('pdfkit')).default;
    console.log('pdfkit načten');
    
    // Vytvoříme PDF dokument
    console.log('Vytvářím PDF dokument...');
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 20, bottom: 20, left: 20, right: 20 }
    });
    console.log('PDF dokument vytvořen');
    
    // Vytvoříme buffer pro PDF
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    console.log('Buffer pro PDF připraven');
    
    // Načteme Noto Sans font pro správné zobrazení českých znaků
    // Nejdřív zkusíme načíst ze souboru, pak z URL
    let fontLoaded = false;
    
    // Zkusíme načíst font ze souboru (pokud existuje)
    // Zkusíme několik možných umístění
    const possibleFontPaths = [
      join(__dirname, 'fonts', 'NotoSans-Regular.ttf'),
      join(__dirname, 'fonts', 'notosans-regular.ttf'),
      join(__dirname, 'fonts', 'NotoSans.ttf'),
      join(__dirname, 'fonts', 'notosans.ttf'),
      join(__dirname, '..', 'fonts', 'NotoSans-Regular.ttf'),
      join(__dirname, '..', 'fonts', 'notosans-regular.ttf'),
    ];
    
    for (const fontPath of possibleFontPaths) {
      try {
        console.log('Zkouším načíst font ze souboru:', fontPath);
        const fontBuffer = await fs.readFile(fontPath);
        if (fontBuffer && fontBuffer.length > 0) {
          doc.registerFont('NotoSans', fontBuffer);
          doc.font('NotoSans');
          fontLoaded = true;
          console.log('✓ Noto Sans font načten ze souboru:', fontPath);
          break;
        }
      } catch (fileError) {
        // Tento soubor neexistuje, zkusíme další
        continue;
      }
    }
    
    if (!fontLoaded) {
      doc.font('Helvetica');
      console.warn('⚠ Používá se standardní Helvetica font (bez podpory české diakritiky)');
    }
    
    // pdfkit používá body (points) a má margins 20
    // A4 = 595.28 x 841.89 points
    // Použijeme body přímo s rozestupy
    
    let y = 20; // Začátek od horního okraje (margins jsou už započítané)
    
    // Hlavička faktury
    doc.fontSize(20).text('FAKTURA', 20, y);
    y += 30;
    
    // Údaje penzionu (levá strana)
    doc.fontSize(12);
    doc.text(guesthouse.name || 'Penzion', 20, y);
    y += 15;
    doc.fontSize(10);
    doc.text(`IČO: ${guesthouse.ico || 'N/A'}`, 20, y);
    y += 12;
    if (guesthouse.dic) {
      doc.text(`DIČ: ${guesthouse.dic}`, 20, y);
      y += 12;
    }
    if (guesthouse.address) {
      if (guesthouse.address.street) {
        doc.text(guesthouse.address.street, 20, y);
        y += 12;
      }
      if (guesthouse.address.zipCode && guesthouse.address.city) {
        doc.text(`${guesthouse.address.zipCode} ${guesthouse.address.city}`, 20, y);
        y += 12;
      }
    }
    
    // Údaje o faktuře (pravá strana)
    y = 20; // Reset na začátek
    doc.fontSize(10);
    doc.text(`Číslo faktury: ${reservation.invoiceNumber || 'N/A'}`, 350, y);
    y += 12;
    doc.text(`Variabilní symbol: ${reservation.variableSymbol || 'N/A'}`, 350, y);
    y += 12;
    doc.text(`Datum vystavení: ${new Date(reservation.createdAt).toLocaleDateString('cs-CZ')}`, 350, y);
    y += 12;
    doc.text(`Datum splatnosti: ${new Date(reservation.checkIn).toLocaleDateString('cs-CZ')}`, 350, y);
    
    // Údaje o zákazníkovi
    y = 120;
    doc.fontSize(12);
    doc.text('Odběratel:', 20, y);
    y += 18;
    doc.fontSize(10);
    doc.text(reservation.guestName || 'N/A', 20, y);
    y += 15;
    doc.text(reservation.guestEmail || 'N/A', 20, y);
    y += 15;
    doc.text(reservation.guestPhone || 'N/A', 20, y);
    y += 25;
    
    // Tabulka položek
    const startY = y;
    doc.fontSize(10);
    doc.text('Položka', 20, y);
    doc.text('Množství', 300, y);
    doc.text('Cena', 400, y);
    doc.text('Celkem', 500, y);
    y += 16; // +4 px dolů
    
    // Čára pod hlavičkou tabulky
    doc.moveTo(20, y).lineTo(575, y).stroke();
    y += 15;
    
    // Položka
    doc.text(`Pobyt: ${reservation.roomName || 'N/A'}`, 20, y);
    y += 15;
    doc.text(`${reservation.checkIn} - ${reservation.checkOut}`, 20, y);
    // Množství, cena, celkem na stejné řádce (o 6 bodů výš, aby byly zarovnané)
    doc.text(`${reservation.nights} nocí`, 300, y - 6);
    doc.text(`${Math.round(reservation.totalPrice / reservation.nights)} Kč/noc`, 400, y - 6);
    doc.text(`${reservation.totalPrice} Kč`, 500, y - 6);
    y += 16; // +4 px dolů (z 12 na 16)
    
    // Celkem
    doc.moveTo(20, y).lineTo(575, y).stroke();
    y += 8; // +4 px dolů (z 4 na 8)
    doc.fontSize(12);
    doc.text('Celkem k úhradě:', 380, y);
    doc.text(`${reservation.totalPrice} Kč`, 500, y);
    y += 25;
    
    // Záloha a doplatek
    if (reservation.depositAmount) {
      // Vypočítáme procento zálohy (zaokrouhlíme na celé číslo)
      const depositPercent = Math.round((reservation.depositAmount / reservation.totalPrice) * 100);
      const finalPaymentPercent = 100 - depositPercent;
      doc.fontSize(10);
      doc.text(`Záloha (${depositPercent}%): ${reservation.depositAmount} Kč`, 20, y);
      y += 15;
      doc.text(`Doplatek (${finalPaymentPercent}%): ${reservation.totalPrice - reservation.depositAmount} Kč`, 20, y);
      y += 25;
    }
    
    // Platební údaje
    doc.fontSize(10);
    doc.text('Platební údaje:', 20, y);
    y += 15;
    if (guesthouse.bankAccount && guesthouse.bankAccount.accountNumber) {
      doc.text(`Číslo účtu: ${guesthouse.bankAccount.accountNumber}`, 20, y);
      y += 15;
    }
    doc.text(`Variabilní symbol: ${reservation.variableSymbol || 'N/A'}`, 20, y);
    
    // Dokončíme PDF a vrátíme buffer
    doc.end();
    
    // Počkáme na dokončení PDF
    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
      doc.on('error', reject);
    });
  } catch (error) {
    console.error('Chyba při generování PDF:', error);
    throw new Error(`Nepodařilo se vygenerovat PDF: ${error.message}`);
  }
}

// ==================== NOTIFIKACE ====================

async function sendReservationNotifications(reservation) {
  try {
    await sendReservationEmail(reservation);
    await sendReservationSMS(reservation);
  } catch (error) {
    console.error('Chyba při odesílání notifikací:', error);
  }
}

async function sendReservationEmail(reservation) {
  try {
    const config = await loadData('config.json');
    const emailConfig = config.email;
    
    if (!emailConfig.host || !emailConfig.user || !emailConfig.password) {
      console.log('E-mail není nakonfigurován, přeskočeno');
      return;
    }
    
    const transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.password,
      },
      connectionTimeout: 60000, // 60 sekund pro navázání spojení
      socketTimeout: 60000, // 60 sekund pro socket timeout
      greetingTimeout: 30000, // 30 sekund pro greeting timeout
    });
    
    // Generování QR kódu pro zálohu
    const guesthouse = config.guesthouse;
    let qrCodeDeposit = null;
    let qrCodeFull = null;
    
    if (guesthouse?.bankAccount?.accountNumber && reservation.variableSymbol) {
      if (reservation.depositAmount) {
        qrCodeDeposit = await generateQRCodeSPD(
          guesthouse.bankAccount.accountNumber,
          reservation.depositAmount,
          reservation.variableSymbol,
          `Zaloha rezervace ${reservation.id}`
        );
      }
      qrCodeFull = await generateQRCodeSPD(
        guesthouse.bankAccount.accountNumber,
        reservation.totalPrice,
        reservation.variableSymbol,
        `Rezervace ${reservation.id}`
      );
    }
    
    // Generování PDF faktury jako přílohy
    let pdfAttachment = null;
    try {
      const pdfBuffer = await generateInvoicePDF(reservation, guesthouse);
      pdfAttachment = {
        filename: `faktura-${reservation.invoiceNumber || reservation.id}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      };
      console.log('PDF faktura vygenerována pro email');
    } catch (error) {
      console.error('Chyba při generování PDF faktury pro email:', error);
      // Pokračujeme i bez PDF - email se pošle bez přílohy
    }
    
    // Formátování pole "from" - pokud je vyplněné jméno, zkombinujeme ho s emailem
    let fromAddress = emailConfig.user;
    if (emailConfig.from && emailConfig.from.trim()) {
      // Pokud from obsahuje <, je to už ve správném formátu "Jméno <email>"
      if (emailConfig.from.includes('<')) {
        fromAddress = emailConfig.from;
      } else {
        // Jinak zkombinujeme jméno s emailem
        fromAddress = `${emailConfig.from} <${emailConfig.user}>`;
      }
    }
    
    const mailOptions = {
      from: fromAddress,
      to: reservation.guestEmail,
      subject: `Potvrzení rezervace #${reservation.id}`,
      html: `
        <h2>Děkujeme za vaši rezervaci!</h2>
        <p>Vaše rezervace byla úspěšně vytvořena.</p>
        <h3>Detaily rezervace:</h3>
        <ul>
          <li><strong>ID rezervace:</strong> ${reservation.id}</li>
          <li><strong>Pokoj:</strong> ${reservation.roomName}</li>
          <li><strong>Příjezd:</strong> ${new Date(reservation.checkIn).toLocaleDateString('cs-CZ')}</li>
          <li><strong>Odjezd:</strong> ${new Date(reservation.checkOut).toLocaleDateString('cs-CZ')}</li>
          <li><strong>Počet nocí:</strong> ${reservation.nights}</li>
          <li><strong>Celková cena:</strong> ${reservation.totalPrice} Kč</li>
          <li><strong>Počet osob:</strong> ${reservation.numberOfGuests}</li>
        </ul>
        ${reservation.note ? `<p><strong>Poznámka:</strong> ${reservation.note}</p>` : ''}
        
        <h3>Platební údaje:</h3>
        ${guesthouse?.bankAccount?.accountNumber ? `<p><strong>Číslo účtu:</strong> ${guesthouse.bankAccount.accountNumber}</p>` : ''}
        ${reservation.variableSymbol ? `<p><strong>Variabilní symbol:</strong> ${reservation.variableSymbol}</p>` : ''}
        ${reservation.depositAmount ? (() => {
          const depositPercent = Math.round((reservation.depositAmount / reservation.totalPrice) * 100);
          const finalPaymentPercent = 100 - depositPercent;
          return `<p><strong>Záloha (${depositPercent}%):</strong> ${reservation.depositAmount} Kč</p>
        <p><strong>Doplatek (${finalPaymentPercent}%):</strong> ${reservation.totalPrice - reservation.depositAmount} Kč</p>`;
        })() : ''}
        
        ${qrCodeDeposit ? `
          <h4>QR kód pro platbu zálohy:</h4>
          <img src="${qrCodeDeposit}" alt="QR kód pro zálohu" style="max-width: 300px;" />
        ` : ''}
        
        ${qrCodeFull ? `
          <h4>QR kód pro platbu celé částky:</h4>
          <img src="${qrCodeFull}" alt="QR kód pro celou částku" style="max-width: 300px;" />
        ` : ''}
        
        ${pdfAttachment ? `<p><strong>Faktura je přiložena k tomuto e-mailu.</strong></p>` : ''}
        
        <p>Brzy se na vás těšíme!</p>
      `,
      attachments: pdfAttachment ? [pdfAttachment] : [],
    };
    
    await transporter.sendMail(mailOptions);
    console.log('E-mail odeslán:', reservation.guestEmail);
  } catch (error) {
    console.error('Chyba při odesílání e-mailu:', error);
  }
}

async function sendReservationSMS(reservation) {
  try {
    const config = await loadData('config.json');
    const smsConfig = config.sms;
    const adminData = await loadData('admin.json');
    
    if (!smsConfig.apiKey || !smsConfig.apiUrl) {
      console.log('SMS není nakonfigurováno, přeskočeno');
      return;
    }
    
    const message = `Děkujeme za rezervaci! ID: ${reservation.id}, Pokoj: ${reservation.roomName}, ${reservation.checkIn} - ${reservation.checkOut}`;
    
    await sendSMS(reservation.guestPhone, message);
    console.log('SMS odeslána:', reservation.guestPhone);
  } catch (error) {
    console.error('Chyba při odesílání SMS:', error);
  }
}

async function sendSMS(phone, message) {
  try {
    const config = await loadData('config.json');
    const smsConfig = config.sms;
    
    if (!smsConfig.apiKey || !smsConfig.apiUrl) {
      throw new Error('SMS není nakonfigurováno');
    }
    
    // Implementace závisí na konkrétní SMS bráně
    // Příklad pro obecné REST API:
    const response = await fetch(smsConfig.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${smsConfig.apiKey}`,
      },
      body: JSON.stringify({
        to: phone,
        message: message,
        from: smsConfig.sender,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`SMS API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Chyba při odesílání SMS:', error);
    throw error;
  }
}

// Servování statických souborů frontendu (v produkci) - MUSÍ BÝT NA KONCI, PO VŠECH API ROUTÁCH
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '..', 'dist');
  
  // Servuj statické soubory (CSS, JS, obrázky)
  app.use(express.static(distPath));
  
  // Všechny ostatní routy (kromě API) servuj index.html (pro React Router)
  app.get('*', (req, res, next) => {
    // Pokud je to API route, přeskočíme
    if (req.path.startsWith('/api')) {
      return next();
    }
    // Jinak servuj index.html
    res.sendFile(join(distPath, 'index.html'), (err) => {
      if (err) {
        res.status(500).send('Chyba při načítání stránky');
      }
    });
  });
}

// Spuštění serveru
async function startServer() {
  await ensureDataDir();
  
  app.listen(PORT, () => {
    console.log(`Server běží na http://localhost:${PORT}`);
    console.log(`Data ukládána do: ${DATA_DIR}`);
    if (process.env.NODE_ENV === 'production') {
      console.log('Produkční režim - frontend servován ze složky dist/');
    }
  });
}

startServer().catch(console.error);


