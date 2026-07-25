import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Languages } from 'lucide-react';
import { GithubIcon } from '../components/GithubIcon';
import { CustomSelect } from '../components/CustomSelect';
import { languageOptions, resolveSupportedLanguage, type SupportedLanguage } from '../i18n';
import { API_BASE_URL, authHeadersForCredential } from '../services/api';
import './Login.css';

interface LoginProps {
  /** Called with the session token (JWT) or raw API key after successful auth. */
  onLogin: (token: string, role?: string) => void;
}

type LoginMode = 'password' | 'apikey';

/** Nest ValidationPipe often returns `message` as a string[] — normalize for the UI. */
function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const message = (payload as { message?: unknown }).message;
  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message)) {
    const parts = message.filter((m): m is string => typeof m === 'string' && m.trim().length > 0);
    if (parts.length) return parts.join('. ');
  }
  return fallback;
}

export function Login({ onLogin }: LoginProps) {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<LoginMode>('password');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const currentLang = resolveSupportedLanguage(i18n.resolvedLanguage || i18n.language);

  const changeLanguage = (language: SupportedLanguage) => {
    void i18n.changeLanguage(language);
  };

  const handlePasswordLogin = async () => {
    if (!username.trim() || !password) {
      setError(t('login.credentialsRequired'));
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (response.ok) {
        const data = (await response.json()) as { accessToken: string; role?: string };
        onLogin(data.accessToken, data.role);
        return;
      }
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        setError(t('login.rateLimited'));
      } else if (response.status === 401) {
        setError(extractErrorMessage(errorData, t('login.invalidCredentials')));
      } else {
        setError(extractErrorMessage(errorData, t('login.invalidCredentials')));
      }
    } catch {
      setError(t('login.connectionError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeyLogin = async () => {
    if (!apiKey.trim()) {
      setError(t('login.apiKeyRequired'));
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeadersForCredential(apiKey.trim()),
        },
      });
      if (response.ok) {
        const data = (await response.json()) as { role?: string };
        onLogin(apiKey.trim(), data.role);
        return;
      }
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        setError(t('login.rateLimited'));
      } else {
        setError(extractErrorMessage(errorData, t('login.invalidKey')));
      }
    } catch {
      setError(t('login.connectionError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (mode === 'password') {
      await handlePasswordLogin();
    } else {
      await handleApiKeyLogin();
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <img src="/openwa_logo.webp" alt="OpenWA" className="logo-icon" />
          <span className="version-info">
            {t('login.version', {
              version: __APP_VERSION__,
              date: new Date(__BUILD_TIME__).toISOString().slice(0, 10).replace(/-/g, ''),
            })}
          </span>
        </div>

        <div className="login-language">
          <Languages size={18} />
          <CustomSelect
            value={currentLang}
            onChange={value => changeLanguage(value as SupportedLanguage)}
            options={languageOptions.map(opt => ({ value: opt.value, label: opt.label }))}
            ariaLabel={t('common.language')}
          />
        </div>

        <div className="login-mode-tabs" role="tablist" aria-label={t('login.tabPassword')}>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'password'}
            className={mode === 'password' ? 'active' : ''}
            onClick={() => {
              setMode('password');
              setError('');
              setShowSecret(false);
            }}
          >
            {t('login.tabPassword')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'apikey'}
            className={mode === 'apikey' ? 'active' : ''}
            onClick={() => {
              setMode('apikey');
              setError('');
              setShowSecret(false);
            }}
          >
            {t('login.tabApiKey')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {mode === 'password' ? (
            <>
              <div className="input-group">
                <label htmlFor="username">{t('login.username')}</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={t('login.usernamePlaceholder')}
                  className={error ? 'error' : ''}
                  disabled={isLoading}
                />
              </div>
              <div className="input-group">
                <label htmlFor="password">{t('login.password')}</label>
                <div className="input-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showSecret ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t('login.passwordPlaceholder')}
                    className={error ? 'error' : ''}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowSecret(v => !v)}
                    aria-label={showSecret ? t('common.hideApiKey') : t('common.showApiKey')}
                    tabIndex={-1}
                  >
                    {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="input-group">
              <label htmlFor="apiKey">{t('login.apiKey')}</label>
              <div className="input-wrapper">
                <input
                  id="apiKey"
                  name="apiKey"
                  type={showSecret ? 'text' : 'password'}
                  autoComplete="off"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder={t('login.apiKeyPlaceholder')}
                  className={error ? 'error' : ''}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowSecret(v => !v)}
                  aria-label={showSecret ? t('common.hideApiKey') : t('common.showApiKey')}
                  tabIndex={-1}
                >
                  {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          {error ? (
            <span className="error-message" role="alert">
              {error}
            </span>
          ) : null}

          <button type="submit" className="connect-btn" disabled={isLoading}>
            {isLoading ? t('login.connecting') : t('login.connect')}
          </button>
        </form>

        <p className="login-help">
          {t('login.help')}{' '}
          <a href="https://docs.open-wa.org" target="_blank" rel="noopener noreferrer">
            {t('login.viewDocs')}
          </a>
        </p>
      </div>

      <footer className="login-footer">
        <span>{t('login.footer')}</span>
        <a
          href="https://github.com/rmyndharis/OpenWA"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
          aria-label="GitHub"
        >
          <GithubIcon size={18} />
        </a>
      </footer>
    </div>
  );
}
