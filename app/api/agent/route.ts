import { generateText, tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import { getUnreadEmails } from "@/tools/emailTool";
import { getCalendarEvents } from "@/tools/calendarTool";
import { createCalendarEvent } from "@/tools/createCalendarEvent";
import { sendEmail } from "@/tools/sendEmail";
import { markEmailAsRead } from "@/tools/markEmailAsRead";

export async function POST(req: Request) {
    const body = await req.json();

    // messages is an array of { role: "user" | "assistant", content: string }
    // sent from the client so the agent remembers prior turns
    const messages: { role: "user" | "assistant"; content: string }[] =
        body.messages || [];

    const agentResult = await generateText({
        model: openai.chat("gpt-4o-mini"),

        system: `
You are an autonomous AI scheduling assistant that manages emails and Google Calendar on behalf of the user.

TODAY'S DATE AND TIME: ${new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" })} (PKT)

## YOUR RESPONSIBILITIES
You have access to real tools. You MUST call them to take action — never just describe what you would do.

## WORKFLOW — follow this strictly:

### When the user asks to check emails or meeting requests:
1. Call getUnreadEmails to fetch all unread emails.
2. Identify any meeting request emails (look for keywords like "meet", "call", "schedule", "availability", "zoom", "google meet", time/date mentions).
3. For each meeting request found, call getCalendarEvents to check if the requested time is free.
4. If the slot is FREE → call createCalendarEvent to book it, then call sendEmail to confirm with the requester, then call markEmailAsRead.
5. If the slot is BUSY → call sendEmail to politely decline or propose an alternative time, then call markEmailAsRead.
6. Report clearly to the user what actions you took.

### When the user explicitly tells you to reply or respond to someone:
1. You MUST call sendEmail immediately with the correct recipient, subject, and a well-written message based on the user's intent.
2. Do NOT read emails again unless you genuinely need new information you don't already have.
3. Use the conversation history to recall who the sender was, their email address, and the subject of the email.

### General rules:
- ALWAYS act — call the tools, do not just plan.
- After sending an email, confirm clearly: "I've sent a reply to [name] at [email]."
- After scheduling a meeting, confirm: "I've booked [title] on [date] at [time]."
- If you lack information (e.g., the recipient's email address), ask the user.
- Be concise and professional in every reply email you send.
`,

        messages,

        tools: {
            getUnreadEmails: tool({
                description:
                    "Fetch unread Gmail emails. Returns id, from (includes name and email address), subject, and snippet. Call this first to detect meeting requests.",
                inputSchema: z.object({}),
                execute: async () => getUnreadEmails(),
            }),

            getCalendarEvents: tool({
                description:
                    "Returns upcoming Google Calendar events. Call this to check if a requested meeting time is already booked.",
                inputSchema: z.object({}),
                execute: async () => getCalendarEvents(),
            }),

            createCalendarEvent: tool({
                description:
                    "Creates a new event in Google Calendar. Call this when a meeting request is detected and the time slot is available.",
                inputSchema: z.object({
                    title: z.string().describe("Title of the meeting"),
                    startTime: z
                        .string()
                        .describe("Start time in ISO 8601 format, e.g. 2026-03-28T22:00:00+05:30"),
                    endTime: z
                        .string()
                        .describe("End time in ISO 8601 format, e.g. 2026-03-28T23:00:00+05:30"),
                }),
                execute: async ({ title, startTime, endTime }) =>
                    createCalendarEvent(title, startTime, endTime),
            }),

            sendEmail: tool({
                description:
                    "Send an email using Gmail. Use this to reply to meeting requests, confirm scheduled meetings, or decline conflicts.",
                inputSchema: z.object({
                    to: z
                        .string()
                        .describe("Recipient email address, e.g. farhan6902@icloud.com"),
                    subject: z.string().describe("Email subject line"),
                    message: z
                        .string()
                        .describe("Full body of the email in plain text"),
                }),
                execute: async ({ to, subject, message }) =>
                    sendEmail(to, subject, message),
            }),

            markEmailAsRead: tool({
                description:
                    "Mark a Gmail message as read after it has been processed. Use the message id returned by getUnreadEmails.",
                inputSchema: z.object({
                    messageId: z.string().describe("The Gmail message ID to mark as read"),
                }),
                execute: async ({ messageId }) => markEmailAsRead(messageId),
            }),
        },

        toolChoice: "auto",
        stopWhen: stepCountIs(10), // allow up to 10 tool-call steps per turn
    });

    let finalText = agentResult.text;

    // If the model only called tools and returned no text, summarise the tool results
    if (!finalText && agentResult.toolResults?.length) {
        const summary = await generateText({
            model: openai.chat("gpt-4o-mini"),
            prompt: `
The AI agent completed the following actions:

${JSON.stringify(agentResult.toolResults, null, 2)}

Write a clear, friendly summary for the user explaining exactly what was done.
Mention names, email addresses, dates, and times where available.
`,
        });

        finalText = summary.text;
    }

    const toolsUsed = [
        ...new Set(agentResult.toolCalls?.map((t: any) => t.toolName) ?? []),
    ].join(", ");

    return Response.json({
        text:
            (finalText || "Done. No actions were needed.") +
            (toolsUsed ? `\n\nTools used: ${toolsUsed}` : ""),
        toolCalls: agentResult.toolCalls,
        toolResults: agentResult.toolResults,
    });
}