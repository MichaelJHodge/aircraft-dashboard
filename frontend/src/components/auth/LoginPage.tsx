import React, { FormEvent, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { useTheme } from '../../context/useTheme';
import { Button } from '../common';
import styles from './LoginPage.module.css';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('internal@beta.example');
  const [password, setPassword] = useState('internal123');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.wrapper} aria-labelledby="login-title">
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <p className={styles.kicker}>Aircraft Certification Dashboard</p>
          <Button
            variant="ghost"
            size="small"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? '☀︎' : '◐'}
          </Button>
        </div>
        <h1 className={styles.title} id="login-title">
          Sign In
        </h1>
        <p className={styles.subtitle}>Access delivery and certification program status.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              className={styles.input}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              aria-label="Email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              className={styles.input}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              aria-label="Password"
            />
          </div>

          {error ? (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className={styles.credentials}>
          <span>
            Internal: <code className={styles.code}>internal@beta.example / internal123</code>
          </span>
          <span>
            Customer: <code className={styles.code}>customer@beta.example / customer123</code>
          </span>
        </div>
      </div>
    </section>
  );
};
