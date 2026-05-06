"use client";

import { useState, useEffect } from "react";
import { Container, Typography, Card, CardContent, Chip, Box, Select, MenuItem, FormControl, InputLabel, Pagination, CircularProgress, IconButton, Alert } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UndoIcon from '@mui/icons-material/Undo';
import { Log } from "../lib/logging_middleware";
import { format } from "date-fns";

const API_URL = "/evaluation-service/notifications";

export default function AllNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [type, setType] = useState<string>("All");
  const limit = 10;
  
  // Track read status using local storage
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load read statuses
    const stored = localStorage.getItem("read_notifications");
    if (stored) setReadIds(new Set(JSON.parse(stored)));
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN;
        if (!token) throw new Error("Access token missing. Please restart the server.");

        let url = `${API_URL}?page=${page}&limit=${limit}`;
        if (type !== "All") url += `&notification_type=${type}`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401) {
          throw new Error("Session expired. Please refresh the access token and restart the server.");
        }
        if (!res.ok) throw new Error(`Failed to load notifications (${res.status})`);

        const data = await res.json();
        setNotifications(data.notifications || []);

        await Log("frontend", "info", "page", `Fetched notifs p:${page} t:${type}`);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
        await Log("frontend", "error", "api", `Failed to fetch notifications`);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [page, type]);

  const markAsRead = async (id: string) => {
    const newRead = new Set(readIds);
    newRead.add(id);
    setReadIds(newRead);
    localStorage.setItem("read_notifications", JSON.stringify(Array.from(newRead)));
    await Log("frontend", "info", "state", `Marked as read`);
  };

  const markAsUnread = async (id: string) => {
    const newRead = new Set(readIds);
    newRead.delete(id);
    setReadIds(newRead);
    localStorage.setItem("read_notifications", JSON.stringify(Array.from(newRead)));
    await Log("frontend", "info", "state", `Marked as unread`);
  };

  const getChipColor = (notifType: string) => {
    switch(notifType) {
      case 'Placement': return 'success';
      case 'Result': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, mt: 2 }}>
        <Typography variant="h4" fontWeight="bold">All Notifications</Typography>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Filter Type</InputLabel>
          <Select
            value={type}
            label="Filter Type"
            onChange={(e) => { setType(e.target.value); setPage(1); }}
          >
            <MenuItem value="All">All Types</MenuItem>
            <MenuItem value="Event">Event</MenuItem>
            <MenuItem value="Result">Result</MenuItem>
            <MenuItem value="Placement">Placement</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {notifications.map((n) => {
            const isRead = readIds.has(n.ID);
            return (
              <Card 
                key={n.ID} 
                sx={{ 
                  opacity: isRead ? 0.7 : 1,
                  borderLeft: isRead ? '4px solid gray' : '4px solid #bb86fc',
                  transition: '0.3s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                }}
              >
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip label={n.Type} color={getChipColor(n.Type)} size="small" />
                      {!isRead && <Chip label="New" color="secondary" size="small" />}
                    </Box>
                    <Typography variant="body1" fontWeight={isRead ? 'normal' : 'bold'}>
                      {n.Message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {n.Timestamp ? format(new Date(n.Timestamp), 'PPp') : 'Unknown Time'}
                    </Typography>
                  </Box>
                  <IconButton 
                    color={isRead ? "default" : "primary"} 
                    onClick={() => isRead ? markAsUnread(n.ID) : markAsRead(n.ID)} 
                    title={isRead ? "Mark as unread" : "Mark as read"}
                  >
                    {isRead ? <UndoIcon /> : <CheckCircleIcon />}
                  </IconButton>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
        <Pagination 
          count={5} // Mock total pages since API might not provide meta
          page={page} 
          onChange={(e, v) => setPage(v)} 
          color="primary" 
        />
      </Box>
    </Container>
  );
}
