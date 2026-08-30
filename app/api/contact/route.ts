import { NextResponse } from "next/server";
import emailjs from "@emailjs/nodejs";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 },
      );
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    const serviceID = process.env.EMAILJS_SERVICE_ID;
    const templateID = process.env.EMAILJS_TEMPLATE_ID;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;

    if (!serviceID || !templateID || !privateKey) {
      console.error("EmailJS environment variables are missing.");
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 },
      );
    }

    await emailjs.send(
      serviceID,
      templateID,
      {
        name,
        email,
        message,
      },
      {
        publicKey,
        privateKey,
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("EmailJS error:", error);

    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 },
    );
  }
}
