"use client";

import { useState } from "react";

export default function TestPage() {
  const [log, setLog] = useState<string[]>([]);

  function add(msg: string) {
    setLog((prev) => [...prev, `${new Date().toISOString().slice(11, 19)} ${msg}`]);
  }

  async function testApi() {
    add("Testando API...");
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@photodelivery.com", password: "1234" }),
      });
      const data = await res.json();
      add(`Login OK: token=${data.access_token?.slice(0, 20)}...`);

      localStorage.setItem("photodelivery_auth", JSON.stringify({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      }));

      const stored = localStorage.getItem("photodelivery_auth");
      const auth = JSON.parse(stored || "{}");
      add(`Token salvo: ${!!auth.accessToken}`);

      const meRes = await fetch("http://localhost:8000/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      const me = await meRes.json();
      add(`Me OK: ${me.name} (${me.email})`);

      const evRes = await fetch("http://localhost:8000/api/v1/events", {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      const ev = await evRes.json();
      add(`Events: ${ev.total} eventos`);

      add("TUDO OK!");
    } catch (err: any) {
      add(`ERRO: ${err.message}`);
    }
  }

  function testLocalStorage() {
    add(`localStorage auth: ${localStorage.getItem("photodelivery_auth") || "vazio"}`);
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-8">
      <h1 className="text-xl mb-4">Diagnostico Photo Delivery</h1>
      <div className="flex gap-2 mb-6">
        <button onClick={testApi} className="bg-green-700 text-white px-4 py-2 rounded">1. Testar API</button>
        <button onClick={testLocalStorage} className="bg-blue-700 text-white px-4 py-2 rounded">2. Ver Storage</button>
      </div>
      <div className="bg-gray-900 p-4 rounded max-h-96 overflow-y-auto text-sm">
        {log.map((msg, i) => (
          <div key={i} className="py-0.5">{msg}</div>
        ))}
        {log.length === 0 && <div className="text-gray-600">Clique nos botoes para testar...</div>}
      </div>
    </div>
  );
}
