export type Stack = "backend" | "frontend";
export type Level = "debug" | "info" | "warn" | "error" | "fatal";
export type BackendPackage = "cache" | "controller" | "cron_job" | "db" | "domain" | "handler" | "repository" | "route" | "service";
export type FrontendPackage = "api" | "component" | "hook" | "page" | "state" | "style";
export type SharedPackage = "auth" | "config" | "middleware" | "utils";
export type Package<S extends Stack> = S extends "backend" ? BackendPackage | SharedPackage : FrontendPackage | SharedPackage;

export async function Log<S extends Stack>(stack: S, level: Level, pkg: Package<S>, message: string): Promise<void> {
    const token = process.env.ACCESS_TOKEN || process.env.NEXT_PUBLIC_ACCESS_TOKEN;
    if (!token) {
        console.error("Log error: ACCESS_TOKEN is missing");
        return;
    }

    const isBrowser = typeof window !== "undefined";
    const url = isBrowser ? "/evaluation-service/logs" : "http://20.207.122.201/evaluation-service/logs";
    const safeMessage = message.substring(0, 48);
    const body = { stack, level, package: pkg, message: safeMessage };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`Log failed with status: ${response.status}. Response: ${text}`);
        }
    } catch (error) {
        console.error("Log network error:", error);
    }
}
