import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text } from "@react-email/components"

interface PasswordResetEmailProps {
  recipientName: string
  resetUrl: string
  expiresIn: string
}

export default function PasswordResetEmail({
  recipientName,
  resetUrl,
  expiresIn = "1 hour",
}: PasswordResetEmailProps) {
  const previewText = `Password reset request for WIECA Mentor Connect`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Password Reset</Heading>
          <Text style={text}>Hello {recipientName},</Text>
          <Text style={text}>
            We received a request to reset your password for your WIECA Mentor Connect account.
          </Text>
          <Section style={messageBox}>
            <Text style={messageText}>
              If you didn't make this request, you can safely ignore this email.
            </Text>
          </Section>
          <Section style={buttonContainer}>
            <Link href={resetUrl} style={button}>
              Reset Password
            </Link>
          </Section>
          <Text style={text}>
            This link will expire in <strong>{expiresIn}</strong>. For security reasons, please do not share this link with anyone.
          </Text>
          <Text style={footer}>© {new Date().getFullYear()} WIECA Mentor Connect. All rights reserved.</Text>
        </Container>
      </Body>
    </Html>
  )
}

// Reusing the same styles from NewMessageEmail for consistency
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px",
  maxWidth: "600px",
  borderRadius: "4px",
  border: "1px solid #eee",
}

const h1 = {
  color: "#DB7C27",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "30px 0",
  padding: "0",
  textAlign: "center" as const,
}

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
}

const messageBox = {
  backgroundColor: "#f5f5f5",
  borderRadius: "4px",
  padding: "16px",
  margin: "24px 0",
}

const messageText = {
  color: "#555",
  fontSize: "15px",
  lineHeight: "22px",
  margin: "0",
  fontStyle: "italic",
}

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
}

const button = {
  backgroundColor: "#DB7C27",
  borderRadius: "4px",
  color: "#fff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "bold",
  padding: "12px 24px",
  textDecoration: "none",
  textAlign: "center" as const,
}

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  marginTop: "48px",
  textAlign: "center" as const,
}
