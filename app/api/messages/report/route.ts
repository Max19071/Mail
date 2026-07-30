import { db } from "@/db";
import { mailboxes, messages } from "@/db/schema";
import { formatReportMailBody, type ReportPayload } from "@/lib/mail";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ReportRequest = {
  apiKey: string;
  to: string;
  from?: string;
  report: ReportPayload;
};

export async function POST(request: Request) {
  let body: ReportRequest;

  try {
    body = (await request.json()) as ReportRequest;
  } catch {
    return Response.json({ error: "Geçersiz JSON payload." }, { status: 400 });
  }

  if (!body?.apiKey || !body?.to || !body?.report?.title) {
    return Response.json(
      { error: "apiKey, to ve report.title alanları zorunludur." },
      { status: 400 },
    );
  }

  const mailboxRows = await db.select().from(mailboxes).where(eq(mailboxes.address, body.to)).limit(1);
  const mailbox = mailboxRows[0];

  if (!mailbox) {
    return Response.json({ error: "Hedef posta kutusu bulunamadı." }, { status: 404 });
  }

  if (mailbox.apiKey !== body.apiKey) {
    return Response.json({ error: "API anahtarı doğrulanamadı." }, { status: 401 });
  }

  const inserted = await db
    .insert(messages)
    .values({
      mailboxId: mailbox.id,
      fromAddress: body.from?.trim() || "ai-research-bot@automation.service",
      subject: `[AI Rapor] ${body.report.title.trim()}`,
      body: formatReportMailBody(body.report),
      isRead: false,
      receivedAt: new Date().toISOString(),
    })
    .returning({ id: messages.id, receivedAt: messages.receivedAt });

  return Response.json(
    {
      ok: true,
      message: "Rapor gelen kutusuna teslim edildi.",
      delivery: inserted[0],
    },
    { status: 201 },
  );
}
