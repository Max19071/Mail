import { db } from "@/db";
import { mailboxes, messages } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const includeRead = searchParams.get("includeRead") === "true";

  if (!address) {
    return Response.json({ error: "address parametresi zorunludur." }, { status: 400 });
  }

  const mailboxRows = await db
    .select({
      id: mailboxes.id,
      address: mailboxes.address,
      displayName: mailboxes.displayName,
      createdAt: mailboxes.createdAt,
    })
    .from(mailboxes)
    .where(eq(mailboxes.address, address))
    .limit(1);

  const mailbox = mailboxRows[0];
  if (!mailbox) {
    return Response.json({ error: "Posta kutusu bulunamadı." }, { status: 404 });
  }

  const rows = await db
    .select()
    .from(messages)
    .where(
      includeRead
        ? eq(messages.mailboxId, mailbox.id)
        : and(eq(messages.mailboxId, mailbox.id), eq(messages.isRead, false)),
    )
    .orderBy(desc(messages.receivedAt));

  return Response.json({ mailbox, messages: rows });
}
