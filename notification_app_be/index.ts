import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Log } from "logging_middleware";

dotenv.config({ path: "../.env" });

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Notification System Backend is running. Access priority notifications at /api/priority-notifications");
});

const PORT = 4000;
const BASE_URL = "http://20.207.122.201/evaluation-service";

// Auto-refresh the access token using stored credentials
async function refreshToken(): Promise<string | null> {
    try {
        const res = await fetch(`${BASE_URL}/auth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "peri.adityagoutam009@gmail.com",
                name: "PERI ADITYA GOUTAM",
                mobileNo: "9381735639",
                githubUsername: "AGMaster009",
                rollNo: "CB.SC.P2CSE25029",
                accessCode: "PTBMmQ",
                clientID: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
            }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        const newToken = data.access_token;
        // Update in-process env so subsequent calls use the fresh token
        process.env.ACCESS_TOKEN = newToken;
        console.log("Token auto-refreshed successfully.");
        return newToken;
    } catch {
        return null;
    }
}

// Fetch with automatic one-time token retry on 401
async function fetchWithRetry(url: string, token: string): Promise<Response> {
    let res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.status === 401) {
        console.warn("Token expired — attempting auto-refresh...");
        const newToken = await refreshToken();
        if (newToken) {
            res = await fetch(url, {
                headers: { "Authorization": `Bearer ${newToken}` }
            });
        }
    }

    return res;
}

app.get("/api/priority-notifications", async (req, res) => {
    try {
        await Log("backend", "info", "route", "Fetching priority notifications");

        const token = process.env.ACCESS_TOKEN;
        if (!token) {
            return res.status(500).json({ error: "Server configuration error: missing token" });
        }

        const response = await fetchWithRetry(`${BASE_URL}/notifications`, token);

        if (!response.ok) {
            await Log("backend", "error", "route", `Eval API error: ${response.status}`);
            return res.status(502).json({ error: "Failed to reach evaluation service" });
        }

        const data = await response.json();
        const notifications = data.notifications || [];

        // Sort by Weight (Placement=3, Result=2, Event=1) then by Recency
        const getWeight = (type: string) => {
            if (type === "Placement") return 3;
            if (type === "Result") return 2;
            if (type === "Event") return 1;
            return 0;
        };

        notifications.sort((a: any, b: any) => {
            const weightDiff = getWeight(b.Type) - getWeight(a.Type);
            if (weightDiff !== 0) return weightDiff;
            return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
        });

        const top10 = notifications.slice(0, 10);

        await Log("backend", "info", "handler", "Computed top 10 priority");
        res.json({ notifications: top10 });
    } catch (error: any) {
        await Log("backend", "fatal", "route", `Server error`);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    Log("backend", "info", "service", `Backend started on port ${PORT}`);
});
