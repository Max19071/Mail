import { db } from "@/db";
import { mailboxes } from "@/db/schema";
import { buildApiKey, buildMailboxAddress, getMailDomain } from "@/lib/mail";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CreateMailboxRequest = {
  displayName?: string;
  prefix?: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (address) {
    const rows = await db.select().from(mailboxes).where(eq(mailboxes.address, address)).limit(1);
    const mailbox = rows[0];

    if (!mailbox) {
      return Response.json({ error: "Posta kutusu bulunamadı." }, { status: 404 });
    }

    return Response.json({ mailbox });
  }

  const rows = await db.select().from(mailboxes).orderBy(desc(mailboxes.createdAt));
  return Response.json({ mailboxes: rows, domain: getMailDomain() });
}

export async function POST(request: Request) {
  let body: CreateMailboxRequest = {};

  try {
    body = (await request.json()) as CreateMailboxRequest;
  } catch {
    body = {};
  }

  const displayName = body.displayName?.trim() || "Yeni AI Rapor Kutusu";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const rows = await db
        .insert(mailboxes)
        .values({
          address: buildMailboxAddress(body.prefix),
          displayName,
          apiKey: buildApiKey(),
          createdAt: new Date().toISOString(),
        })
        .returning();

      return Response.json({ mailbox: rows[0] }, { status: 201 });
    } catch {
      // Nadir adres veya anahtar çakışmasında yeniden dener.
    }
  }

  return Response.json({ error: "Posta kutusu üretilemedi. Lütfen tekrar deneyin." }, { status: 500 });
}
