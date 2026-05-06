"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = Log;
async function Log(s, l, p, m) {
    let t = process.env.ACCESS_TOKEN || process.env.NEXT_PUBLIC_ACCESS_TOKEN;
    if (!t) {
        console.error("Log error");
        return;
    }
    let b = typeof window !== "undefined";
    let u = b ? "/evaluation-service/logs" : "http://20.207.122.201/evaluation-service/logs";
    let sm = m.substring(0, 48);
    let bd = { stack: s, level: l, package: p, message: sm };
    try {
        let r = await fetch(u, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${t}` }, body: JSON.stringify(bd) });
        if (!r.ok) {
            let txt = await r.text();
            console.error("fail", txt);
        }
    }
    catch (e) {
        console.error("err", e);
    }
}
