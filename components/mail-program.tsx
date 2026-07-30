"use client";

import { useEffect, useMemo, useState } from "react";

type Mailbox = {
  id: number;
  address: string;
  displayName: string;
  apiKey: string;
  createdAt: string;
};

type Message = {
  id: number;
  mailboxId: number;
  fromAddress: string;
  subject: string;
  body: string;
  isRead: boolean;
  receivedAt: string;
};

const demoReport = {
  title: "Haftalık Pazar Araştırması",
  summary:
    "Rekabet koşulları ve kullanıcı eğilimleri incelendi. Fiyat/performans odaklı ürünler öne çıkıyor.",
  findings: [
    "Arama trendlerinde son 30 günde %18 yükseliş var.",
    "Rakiplerin çoğu yıllık ödeme planında %20 veya daha fazla indirim sunuyor.",
    "Kullanıcı geri bildirimlerinde en kritik beklenti hızlı destek.",
  ],
  sources: ["https://trends.google.com", "https://www.statista.com"],
};

export function MailProgram() {
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState("Bana Ait AI Rapor Kutusu");
  const [includeRead, setIncludeRead] = useState(true);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedMailbox = useMemo(
    () => mailboxes.find((mailbox) => mailbox.address === selectedAddress) ?? null,
    [mailboxes, selectedAddress],
  );

  const selectedMessage = useMemo(
    () => messages.find((message) => message.id === selectedMessageId) ?? null,
    [messages, selectedMessageId],
  );

  async function readError(response: Response, fallback: string) {
    try {
      const data = (await response.json()) as { error?: string };
      return data.error || fallback;
    } catch {
      return fallback;
    }
  }

  async function loadMailboxes(preferredAddress?: string) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/mailboxes", { cache: "no-store" });
      if (!response.ok) throw new Error(await readError(response, "Posta kutuları getirilemedi."));

      const data = (await response.json()) as { mailboxes: Mailbox[] };
      setMailboxes(data.mailboxes);

      const nextAddress = preferredAddress || selectedAddress || data.mailboxes[0]?.address || "";
      setSelectedAddress(nextAddress);
      if (!nextAddress) {
        setMessages([]);
        setSelectedMessageId(null);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Beklenmedik hata");
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(targetAddress?: string) {
    const address = targetAddress || selectedAddress;
    if (!address) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/messages?address=${encodeURIComponent(address)}&includeRead=${includeRead}`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error(await readError(response, "Mesajlar getirilemedi."));

      const data = (await response.json()) as { messages: Message[] };
      setMessages(data.messages);
      setSelectedMessageId((current) =>
        data.messages.some((message) => message.id === current)
          ? current
          : (data.messages[0]?.id ?? null),
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Beklenmedik hata");
    } finally {
      setLoading(false);
    }
  }

  async function createMailbox() {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/mailboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      if (!response.ok) throw new Error(await readError(response, "Yeni posta kutusu üretilemedi."));

      const data = (await response.json()) as { mailbox: Mailbox };
      await loadMailboxes(data.mailbox.address);
      await loadMessages(data.mailbox.address);
      setNotice("Yeni posta kutusu ve özel API anahtarı oluşturuldu.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Beklenmedik hata");
    } finally {
      setBusy(false);
    }
  }

  async function sendDemoReport() {
    if (!selectedMailbox) {
      setError("Önce bir posta kutusu seçin veya oluşturun.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/messages/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: selectedMailbox.apiKey,
          to: selectedMailbox.address,
          from: "internet-research-ai@automation.service",
          report: { ...demoReport, generatedAt: new Date().toISOString() },
        }),
      });
      if (!response.ok) throw new Error(await readError(response, "Demo rapor gönderilemedi."));

      await loadMessages();
      setNotice("Demo rapor gelen kutusuna teslim edildi.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Beklenmedik hata");
    } finally {
      setBusy(false);
    }
  }

  async function markAsRead(messageId: number, isRead: boolean) {
    setError("");
    const response = await fetch(`/api/messages/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead }),
    });

    if (!response.ok) {
      setError(await readError(response, "Mesaj durumu değiştirilemedi."));
      return;
    }
    await loadMessages();
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(`${label} panoya kopyalandı.`);
    } catch {
      setError("Panoya kopyalama için tarayıcı izin vermedi.");
    }
  }

  useEffect(() => {
    void loadMailboxes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedAddress) void loadMessages(selectedAddress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddress, includeRead]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-50 px-4 py-8 md:px-8">
      <div className="mx-auto mb-6 max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">AI Mail Hub</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">İnteraktif Rapor Mail Programı</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Google API anahtarı gerekmez. Her kutu için programın oluşturduğu özel anahtarla yapay zekâ
          raporlarını bu ekrana gönderebilirsiniz.
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1fr_1.25fr]">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Posta kutusu oluştur</h2>
          <div className="mt-4 rounded-2xl border border-slate-200 p-4">
            <label className="mb-2 block text-sm font-medium text-slate-800">Kutu adı</label>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              placeholder="Örnek: Yönetici Rapor Kutusu"
            />
            <button
              type="button"
              onClick={createMailbox}
              disabled={busy}
              className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {busy ? "Oluşturuluyor..." : "Yeni Mail Adresi Oluştur"}
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-slate-800">Aktif posta kutusu</label>
              <button
                type="button"
                onClick={() => void loadMailboxes()}
                className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"
              >
                Yenile
              </button>
            </div>
            <select
              value={selectedAddress}
              onChange={(event) => setSelectedAddress(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Seçiniz</option>
              {mailboxes.map((mailbox) => (
                <option key={mailbox.id} value={mailbox.address}>
                  {mailbox.displayName} — {mailbox.address}
                </option>
              ))}
            </select>

            {selectedMailbox && (
              <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                <InfoRow
                  label="Mail Adresiniz"
                  value={selectedMailbox.address}
                  onCopy={() => void copy(selectedMailbox.address, "Mail adresi")}
                />
                <InfoRow
                  label="Programın Ürettiği API Anahtarı"
                  value={selectedMailbox.apiKey}
                  onCopy={() => void copy(selectedMailbox.apiKey, "API anahtarı")}
                />
                <div>
                  <p className="font-semibold">AI Programının Kullanacağı Adres</p>
                  <code className="mt-1 block rounded bg-white px-2 py-1">POST /api/messages/report</code>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">Hızlı çalışma testi</p>
            <p className="mt-1 text-xs text-slate-600">
              Örnek raporu seçili gelen kutusuna gönderir.
            </p>
            <button
              type="button"
              onClick={sendDemoReport}
              disabled={!selectedMailbox || busy}
              className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              Demo Rapor Gönder
            </button>
          </div>

          {notice && <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
          {error && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-900">Gelen Kutusu</h2>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={includeRead}
                onChange={(event) => setIncludeRead(event.target.checked)}
              />
              Okunanları göster
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
            <div className="max-h-[65vh] overflow-auto rounded-2xl border border-slate-200">
              {loading && <p className="p-3 text-sm text-slate-500">Yükleniyor...</p>}
              {!loading && messages.length === 0 && (
                <p className="p-3 text-sm text-slate-500">Henüz mesaj yok.</p>
              )}
              {messages.map((message) => (
                <button
                  type="button"
                  key={message.id}
                  onClick={() => setSelectedMessageId(message.id)}
                  className={`block w-full border-b border-slate-100 px-3 py-3 text-left hover:bg-slate-50 ${
                    selectedMessageId === message.id ? "bg-indigo-50" : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">{message.subject}</p>
                    {!message.isRead && <span className="size-2 shrink-0 rounded-full bg-indigo-500" />}
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-600">{message.fromAddress}</p>
                </button>
              ))}
            </div>

            <div className="min-h-64 rounded-2xl border border-slate-200 p-4">
              {!selectedMessage && <p className="text-sm text-slate-500">Bir mesaj seçin.</p>}
              {selectedMessage && (
                <>
                  <p className="text-sm font-semibold text-slate-900">{selectedMessage.subject}</p>
                  <p className="mt-1 text-xs text-slate-600">Gönderen: {selectedMessage.fromAddress}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(selectedMessage.receivedAt).toLocaleString("tr-TR")}
                  </p>
                  <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-800">
                    {selectedMessage.body}
                  </pre>
                  <button
                    type="button"
                    onClick={() => void markAsRead(selectedMessage.id, !selectedMessage.isRead)}
                    className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
                  >
                    {selectedMessage.isRead ? "Okunmadı yap" : "Okundu yap"}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoRow({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div>
      <p className="font-semibold">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <code className="min-w-0 truncate rounded bg-white px-2 py-1">{value}</code>
        <button type="button" onClick={onCopy} className="rounded border border-slate-300 px-2 py-1">
          Kopyala
        </button>
      </div>
    </div>
  );
}
