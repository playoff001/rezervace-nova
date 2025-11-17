import { useEffect, useState } from 'react';
import { adminAPI, reservationsAPI } from '../../api/api';
import type { GuesthouseSettings, EmailConfig, SMSConfig } from '../../types';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [guesthouse, setGuesthouse] = useState<GuesthouseSettings>({
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
  });
  const [email, setEmail] = useState<EmailConfig>({
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    from: '',
  });
  const [sms, setSms] = useState<SMSConfig>({
    apiKey: '',
    apiUrl: '',
    sender: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      setLoading(true);
      const response = await adminAPI.getConfig();
      if (response.config?.guesthouse) {
        setGuesthouse({
          name: response.config.guesthouse.name || '',
          ico: response.config.guesthouse.ico || '',
          dic: response.config.guesthouse.dic || '',
          address: {
            street: response.config.guesthouse.address?.street || '',
            city: response.config.guesthouse.address?.city || '',
            zipCode: response.config.guesthouse.address?.zipCode || '',
            country: response.config.guesthouse.address?.country || 'Česká republika',
          },
          bankAccount: {
            accountNumber: response.config.guesthouse.bankAccount?.accountNumber || '',
            bankCode: response.config.guesthouse.bankAccount?.bankCode || '',
          },
        });
      }
      if (response.config?.email) {
        setEmail({
          host: response.config.email.host || '',
          port: response.config.email.port || 587,
          secure: response.config.email.secure || false,
          user: response.config.email.user || '',
          password: response.config.email.password || '',
          from: response.config.email.from || '',
        });
      }
      if (response.config?.sms) {
        setSms({
          apiKey: response.config.sms.apiKey || '',
          apiUrl: response.config.sms.apiUrl || '',
          sender: response.config.sms.sender || '',
        });
      }
    } catch (error) {
      console.error('Chyba při načítání nastavení:', error);
      alert('Nepodařilo se načíst nastavení');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      const response = await adminAPI.getConfig();
      const currentConfig = response.config || {};
      
      // Sloučíme existující config s novými údaji
      const updatedConfig = {
        ...currentConfig,
        guesthouse: {
          ...currentConfig.guesthouse,
          ...guesthouse,
        },
        email: {
          ...currentConfig.email,
          ...email,
        },
        sms: {
          ...currentConfig.sms,
          ...sms,
        },
      };
      
      await adminAPI.updateConfig(updatedConfig);
      
      alert('Nastavení bylo uloženo');
    } catch (error) {
      console.error('Chyba při ukládání nastavení:', error);
      alert('Nepodařilo se uložit nastavení');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAllReservations() {
    if (!deletePassword) {
      alert('Zadejte prosím heslo');
      return;
    }

    try {
      setDeleting(true);
      console.log('Attempting to delete all reservations...');
      const response = await reservationsAPI.deleteAll(deletePassword);
      console.log('Delete response:', response);
      const count = response.deletedCount;
      const text = count === 1 ? 'rezervace' : count < 5 ? 'rezervace' : 'rezervací';
      alert(`Úspěšně smazáno ${count} ${text}`);
      setShowDeleteConfirm(false);
      setDeletePassword('');
    } catch (error: any) {
      console.error('Error deleting reservations:', error);
      alert(error.message || 'Nepodařilo se smazat rezervace. Zkontroluj konzoli prohlížeče (F12) pro více informací.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Načítání...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Nastavení</h1>

      <div className="space-y-6">
        {/* Údaje penzionu */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Údaje penzionu</h2>

        <div className="space-y-6">
          {/* Název penzionu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Název penzionu *
            </label>
            <input
              type="text"
              value={guesthouse.name}
              onChange={(e) => setGuesthouse({ ...guesthouse, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Např. Penzion U Zlatého slunce"
            />
          </div>

          {/* IČO a DIČ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IČO *
              </label>
              <input
                type="text"
                value={guesthouse.ico}
                onChange={(e) => setGuesthouse({ ...guesthouse, ico: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="12345678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DIČ
              </label>
              <input
                type="text"
                value={guesthouse.dic}
                onChange={(e) => setGuesthouse({ ...guesthouse, dic: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="CZ12345678"
              />
            </div>
          </div>

          {/* Adresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresa
            </label>
            <div className="space-y-4">
              <input
                type="text"
                value={guesthouse.address.street}
                onChange={(e) =>
                  setGuesthouse({
                    ...guesthouse,
                    address: { ...guesthouse.address, street: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ulice a číslo popisné"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  value={guesthouse.address.zipCode}
                  onChange={(e) =>
                    setGuesthouse({
                      ...guesthouse,
                      address: { ...guesthouse.address, zipCode: e.target.value },
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="PSČ"
                />
                <input
                  type="text"
                  value={guesthouse.address.city}
                  onChange={(e) =>
                    setGuesthouse({
                      ...guesthouse,
                      address: { ...guesthouse.address, city: e.target.value },
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Město"
                />
                <input
                  type="text"
                  value={guesthouse.address.country}
                  onChange={(e) =>
                    setGuesthouse({
                      ...guesthouse,
                      address: { ...guesthouse.address, country: e.target.value },
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Země"
                />
              </div>
            </div>
          </div>

          {/* Bankovní účet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bankovní účet *
            </label>
            <div className="space-y-4">
              <input
                type="text"
                value={guesthouse.bankAccount.accountNumber}
                onChange={(e) =>
                  setGuesthouse({
                    ...guesthouse,
                    bankAccount: {
                      ...guesthouse.bankAccount,
                      accountNumber: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Číslo účtu (např. CZ6508000000192000145399 nebo 19-2000145399/0800)"
              />
              <input
                type="text"
                value={guesthouse.bankAccount.bankCode || ''}
                onChange={(e) =>
                  setGuesthouse({
                    ...guesthouse,
                    bankAccount: {
                      ...guesthouse.bankAccount,
                      bankCode: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Kód banky (volitelné, pokud není v čísle účtu)"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              * Číslo účtu je nutné pro generování QR kódů a faktur
            </p>
          </div>

          {/* Tlačítko uložit */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving || !guesthouse.name || !guesthouse.ico || !guesthouse.bankAccount.accountNumber}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Ukládání...' : 'Uložit nastavení'}
            </button>
          </div>
        </div>
      </div>

      {/* Nastavení e-mailu */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Nastavení e-mailu (volitelné)</h2>
        <p className="text-sm text-gray-600 mb-6">
          E-mail se automaticky odesílá hostovi při vytvoření rezervace. <strong>E-mail je volitelný</strong> - pokud není nakonfigurován, e-mail se neodešle a systém funguje normálně.
        </p>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP server (host) *
              </label>
              <input
                type="text"
                value={email.host}
                onChange={(e) => setEmail({ ...email, host: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="např. smtp.gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port *
              </label>
              <input
                type="number"
                value={email.port}
                onChange={(e) => setEmail({ ...email, port: parseInt(e.target.value) || 587 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="587 nebo 465"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="secure"
              checked={email.secure}
              onChange={(e) => setEmail({ ...email, secure: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="secure" className="ml-2 block text-sm text-gray-700">
              Použít SSL/TLS (secure) - zaškrtněte pro port 465, nezaškrtávejte pro port 587
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uživatelské jméno (e-mail) *
              </label>
              <input
                type="email"
                value={email.user}
                onChange={(e) => setEmail({ ...email, user: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="vas@email.cz"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heslo *
              </label>
              <input
                type="password"
                value={email.password}
                onChange={(e) => setEmail({ ...email, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Heslo k e-mailovému účtu"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Odesílatel (from) - volitelné
            </label>
            <input
              type="text"
              value={email.from}
              onChange={(e) => setEmail({ ...email, from: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Penzion U Zlatého slunce <vas@email.cz>"
            />
            <p className="mt-2 text-sm text-gray-500">
              Pokud není vyplněno, použije se uživatelské jméno jako odesílatel
            </p>
          </div>
        </div>
      </div>

      {/* Nastavení SMS */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Nastavení SMS (volitelné)</h2>
        <p className="text-sm text-gray-600 mb-4">
          SMS se automaticky odesílá hostovi při vytvoření rezervace. <strong>SMS jsou volitelné</strong> - pokud není nakonfigurováno, SMS se neodešle a systém funguje normálně.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Pro odesílání SMS potřebujete účet u SMS poskytovatele s API přístupem. 
            Běžní poskytovatelé v ČR: <strong>SMS.cz</strong>, <strong>SMSbrana.cz</strong>, <strong>SMS API</strong>, 
            nebo mezinárodní služby jako <strong>Twilio</strong> či <strong>MessageBird</strong>.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API URL
            </label>
            <input
              type="text"
              value={sms.apiUrl}
              onChange={(e) => setSms({ ...sms, apiUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://api.sms-provider.com/send"
            />
            <p className="mt-1 text-xs text-gray-500">
              Např. pro SMS.cz: https://api.sms.cz/v1/send
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API klíč
              </label>
              <input
                type="password"
                value={sms.apiKey}
                onChange={(e) => setSms({ ...sms, apiKey: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="API klíč od SMS poskytovatele"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Odesílatel (sender)
              </label>
              <input
                type="text"
                value={sms.sender}
                onChange={(e) => setSms({ ...sms, sender: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Penzion nebo číslo"
              />
              <p className="mt-1 text-xs text-gray-500">
                Může být text (např. "Penzion") nebo telefonní číslo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Smazání všech rezervací - Nebezpečná zóna */}
      <div className="bg-white rounded-lg shadow p-6 border-2 border-red-200">
        <h2 className="text-xl font-bold text-red-900 mb-2">Nebezpečná zóna</h2>
        <p className="text-sm text-gray-600 mb-4">
          Tato akce je nevratná. Všechny rezervace budou trvale smazány.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Smazat všechny rezervace
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zadejte admin heslo pro potvrzení:
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Admin heslo"
                autoFocus
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleDeleteAllReservations}
                disabled={deleting || !deletePassword}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? 'Mazání...' : 'Potvrdit smazání'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                }}
                disabled={deleting}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"
              >
                Zrušit
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

