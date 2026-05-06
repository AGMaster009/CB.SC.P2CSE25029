export type Stack = "backend" | "frontend";
export type Level = "debug" | "info" | "warn" | "error" | "fatal";
export type BackendPackage = "cache" | "controller" | "cron_job" | "db" | "domain" | "handler" | "repository" | "route" | "service";
export type FrontendPackage = "api" | "component" | "hook" | "page" | "state" | "style";
export type SharedPackage = "auth" | "config" | "middleware" | "utils";
export type Package<S extends Stack> = S extends "backend" ? BackendPackage | SharedPackage : FrontendPackage | SharedPackage;
export declare function Log<S extends Stack>(s: S, l: Level, p: Package<S>, m: string): Promise<void>;
