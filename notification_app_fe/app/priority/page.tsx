"use client";

import { useState, useEffect } from "react";
import { Container, Typography, Card, CardContent, Chip, Box, CircularProgress, Alert } from "@mui/material";
import { Log } from "../../lib/logging_middleware";
import { format } from "date-fns";
import WhatshotIcon from '@mui/icons-material/Whatshot';

export default function PriorityInbox() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPriority = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/priority-notifications");
        if (res.status === 401) {
          throw new Error("Session expired. Please refresh the access token and restart the backend.");
        }
        if (!res.ok) throw new Error(`Priority service error (${res.status})`);

        const data = await res.json();
        setNotifications(data.notifications || []);

        await Log("frontend", "info", "page", "Fetched priority notifications");
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
        await Log("frontend", "error", "api", `Priority API error`);
      } finally {
        setLoading(false);
      }
    };

    fetchPriority();
  }, []);

  const getChipColor = (notifType: string) => {
    switch(notifType) {
      case 'Placement': return 'success';
      case 'Result': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, mt: 2 }}>
        <WhatshotIcon color="error" fontSize="large" />
        <Typography variant="h4" fontWeight="bold">Priority Inbox</Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {notifications.length === 0 ? (
            <Typography>No priority notifications found.</Typography>
          ) : (
            notifications.map((n, index) => (
              <Card 
                key={n.ID || index} 
                sx={{ 
                  borderLeft: '4px solid #f44336', // Red border for priority
                  backgroundColor: 'rgba(244, 67, 54, 0.05)',
                  transition: '0.3s',
                  '&:hover': { transform: 'scale(1.02)', boxShadow: 4 }
                }}
              >
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip label={`Rank #${index + 1}`} color="error" size="small" variant="outlined" />
                      <Chip label={n.Type} color={getChipColor(n.Type)} size="small" />
                    </Box>
                    <Typography variant="h6" fontWeight="bold">
                      {n.Message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {n.Timestamp ? format(new Date(n.Timestamp), 'PPp') : 'Unknown Time'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      )}
    </Container>
  );
}
