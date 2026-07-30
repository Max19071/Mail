import { db } from "@/db";
import { messages } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const messageId = Number(id);

  if (!Number.isInteger(messageId) || messageId <= 0) {
    return Response.json({ error: "Geçersiz mesaj id." }, { status: 400 });
  }

  let body: { isRead?: boolean } = {};
  try {
    body = (await request.json()) as { isRead?: boolean };
  } catch {
    body = {};
  }

  const updated = await db
    .update(messages)
    .set({ isRead: body.isRead ?? true })
    .where(eq(messages.id, messageId))
    .returning({ id: messages.id, isRead: messages.isRead });

  if (!updated[0]) {
    return Response.json({ error: "Mesaj bulunamadı." }, { status: 404 });
  }

  return Response.json({ message: updated[0] });
}
