/**
 * Header Component
 * Main application header with navigation
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Header.module.css";
import { useAuth } from "../../context/useAuth";
import { useTheme } from "../../context/useTheme";
import { Button } from "../common";

export const Header: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoText}>BETA Ops</span>
          </Link>
        </div>

        <nav className={styles.nav} aria-label="Primary navigation">
          <Link
            to="/"
            className={`${styles.navLink} ${isActive("/") ? styles.active : ""}`}
            aria-current={isActive("/") ? "page" : undefined}
          >
            Dashboard
          </Link>
          <Link
            to="/aircraft"
            className={`${styles.navLink} ${
              isActive("/aircraft") ||
              location.pathname.startsWith("/aircraft/")
                ? styles.active
                : ""
            }`}
            aria-current={
              isActive("/aircraft") || location.pathname.startsWith("/aircraft/")
                ? "page"
                : undefined
            }
          >
            Aircraft
          </Link>
        </nav>

        <div className={styles.userControls}>
          <Button
            variant="ghost"
            size="small"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? '☀︎' : '◐'}
          </Button>
          <span className={styles.userText}>
            {user?.email} ({user?.role})
          </span>
          <Button variant="ghost" size="small" onClick={logout}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
};
