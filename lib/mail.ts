import { randomBytes } from "node:crypto";

export type ReportPayload = {
  title: string;
  summary?: string;
  findings?: string[];
  sources?: string[];
  generatedAt?: string;
};

export function getMailDomain() {
  return process.env.MAIL_DOMAIN?.trim() || "ai-mail.local";
}

function normalizePrefix(prefix?: string) {
  return (prefix || "rapor")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "rapor";
}

export function buildMailboxAddress(prefix?: string) {
  const suffix = randomBytes(3).toString("hex");
  return `${normalizePrefix(prefix)}-${suffix}@${getMailDomain()}`;
}

export function buildApiKey() {
  return `amh_${randomBytes(24).toString("base64url")}`;
}

export function formatReportMailBody(report: ReportPayload) {
  const sections = [
    report.summary ? `ÖZET\n${report.summary}` : "",
    report.findings?.length
      ? `BULGULAR\n${report.findings.map((item, index) => `${index + 1}. ${item}`).join("\n")}`
      : "",
    report.sources?.length ? `KAYNAKLAR\n${report.sources.join("\n")}` : "",
    report.generatedAt
      ? `OLUŞTURULMA TARİHİ\n${new Date(report.generatedAt).toLocaleString("tr-TR")}`
      : "",
  ].filter(Boolean);

  return sections.join("\n\n");
}
