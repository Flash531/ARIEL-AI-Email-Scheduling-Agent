import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // Strong email validation
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim?.() ?? "");
    if (!isValidEmail) {
      return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Add to Resend audience (silently handle duplicates)
    try {
      await resend.contacts.create({
        email: cleanEmail,
      });
    } catch (err: any) {
      // 409 = already exists, 422 = validation error — both are fine to ignore
      if (err?.statusCode !== 409 && err?.statusCode !== 422) {
        throw err;
      }
    }

    // 2 + 3. Admin notification + user welcome email (parallel)
    await Promise.all([
      resend.emails.send({
        from: "Ariel <onboarding@resend.dev>",
        to: process.env.NOTIFY_EMAIL!,
        subject: "🎉 New Ariel Waitlist Signup",
        text: `New signup: ${cleanEmail} at ${new Date().toLocaleString()}`,
      }),

      resend.emails.send({
        from: "Ariel <onboarding@resend.dev>",
        to: cleanEmail,
        // reply_to: process.env.NOTIFY_EMAIL!,
        subject: "You're on the Ariel waitlist ✨",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                      max-width: 480px; margin: 0 auto; padding: 40px 24px;
                      background: #08090d; color: #f1f5f9; border-radius: 16px;">
            <div style="margin-bottom: 32px;">
              <span style="display: inline-block; background: rgba(99,102,241,0.15);
                           border: 1px solid rgba(99,102,241,0.3); border-radius: 999px;
                           padding: 5px 14px; font-size: 12px; font-weight: 600;
                           color: #a5b4fc; letter-spacing: 0.05em;">
                ARIEL
              </span>
            </div>
            <h2 style="font-size: 28px; font-weight: 800; letter-spacing: -0.03em;
                       color: #f1f5f9; margin: 0 0 16px;">
              You're in. 🎉
            </h2>
            <p style="font-size: 15px; color: #94a3b8; line-height: 1.7; margin: 0 0 24px;">
              Thanks for joining the Ariel waitlist. We're rolling out access
              gradually to keep the experience great for everyone.
            </p>
            <p style="font-size: 15px; color: #94a3b8; line-height: 1.7; margin: 0 0 32px;">
              You'll get a personal invite as soon as your spot opens up ,
              usually within a few days.
            </p>
            <div style="height: 1px; background: rgba(255,255,255,0.08); margin-bottom: 24px;" />
            <p style="font-size: 13px; color: #64748b; margin: 0;">
              The Ariel Team
            </p>
          </div>
        `,
      }),
    ]);

    return Response.json({ success: true });
  } catch (error) {
    console.error("[waitlist] error:", error);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
