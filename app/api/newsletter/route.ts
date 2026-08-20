import { NextResponse } from "next/server";
import  db  from "@/lib/db"; 
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    await db.execute({
      sql: `
        INSERT INTO newsletter_subscribers (email)
        VALUES (?)
        ON CONFLICT(email) DO NOTHING
      `,
      args: [email],
    });

    return NextResponse.json({
      success: true,
      message: "You're subscribed!",
    });
  } catch (error) {
    console.error("Newsletter subscription error:", error);

    return NextResponse.json(
      { error: "Unable to subscribe right now." },
      { status: 500 }
    );
  }
}