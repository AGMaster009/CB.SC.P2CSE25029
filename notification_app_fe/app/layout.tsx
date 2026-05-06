"use client";

import { useState, useEffect, useMemo, createContext } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AppBar, Toolbar, Typography, Box, Button, IconButton } from "@mui/material";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Link from "next/link";
import "./globals.css";

const ColorModeContext = createContext({ toggleColorMode: () => {} });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem("theme_mode");
    if (savedMode === "light" || savedMode === "dark") {
      setMode(savedMode);
    }
  }, []);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === "light" ? "dark" : "light";
          localStorage.setItem("theme_mode", newMode);
          return newMode;
        });
      },
    }),
    [],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: mode === "dark" ? "#bb86fc" : "#6200ea" },
          secondary: { main: "#03dac6" },
          background: {
            default: mode === "dark" ? "#121212" : "#f5f5f5",
            paper: mode === "dark" ? "#1e1e1e" : "#ffffff",
          },
        },
      }),
    [mode],
  );

  return (
    <html lang="en">
      <body>
        <ColorModeContext.Provider value={colorMode}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppBar position="static">
              <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                  Campus Notifications
                </Typography>
                <Button color="inherit" component={Link} href="/">
                  All Notifications
                </Button>
                <Button color="inherit" component={Link} href="/priority">
                  Priority Inbox
                </Button>
                {mounted && (
                  <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit" title="Toggle Theme">
                    {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                  </IconButton>
                )}
              </Toolbar>
            </AppBar>
            <Box sx={{ p: 3, minHeight: '100vh' }}>{children}</Box>
          </ThemeProvider>
        </ColorModeContext.Provider>
      </body>
    </html>
  );
}
