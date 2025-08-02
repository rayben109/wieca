"use server"

import nodemailer from "nodemailer"
import { render } from "@react-email/render"
import NewRequestEmail from "@/emails/new-request-email"
import RequestStatusEmail from "@/emails/request-status-email"
import NewMessageEmail from "@/emails/new-message-email"

// Create a transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  secure: process.env.EMAIL_SERVER_SECURE === "true",
})

type EmailTemplate = "new-request" | "request-status" | "new-message"

interface EmailOptions {
  to: string
  subject: string
  template: EmailTemplate
  data: Record<string, any>
}

export async function sendEmailNotification({ to, subject, template, data }: EmailOptions) {
  try {
    // Skip sending emails in development if no email config
    if (process.env.NODE_ENV === "development" && (!process.env.EMAIL_SERVER_HOST || !process.env.EMAIL_SERVER_USER)) {
      console.log("Email would be sent:", { to, subject, template, data })
      return { success: true, info: "Email sending skipped in development" }
    }

    // Render the appropriate email template
    let html: string
    switch (template) {
      case "new-request":
        html = render(NewRequestEmail(data))
        break
      case "request-status":
        html = render(RequestStatusEmail(data))
        break
      case "new-message":
        html = render(NewMessageEmail(data))
        break
      default:
        throw new Error(`Unknown email template: ${template}`)
    }

    // Send the email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "WIECA Mentor Connect <noreply@wiecaglobal.org>",
      to,
      subject,
      html,
    })

    return { success: true, info }
  } catch (error) {
    console.error("Failed to send email:", error)
    return { success: false, error: "Failed to send email" }
  }
}
