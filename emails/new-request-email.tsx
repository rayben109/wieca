import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text } from "@react-email/components"

interface NewRequestEmailProps {
  mentorName: string
  menteeName: string
  message: string
  requestUrl: string
}

export default function NewRequestEmail({ mentorName, menteeName, message, requestUrl }: NewRequestEmailProps) {
  const previewText = `New mentorship request from ${menteeName}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Mentorship Request</Heading>
          <Text style={text}>Hello {mentorName},</Text>
          <Text style={text}>
            You have received a new mentorship request from <strong>{menteeName}</strong>.
          </Text>
          <Section style={messageBox}>
            <Text style={messageText}>{message}</Text>
          </Section>
          <Text style={text}>Please review this request and respond by accepting or declining it on the platform.</Text>
          <Section style={buttonContainer}>
            <Link href={requestUrl} style={button}>
              View Request
            </Link>
          </Section>
          <Text style={text}>Thank you for being part of the WIECA Mentor Connect Programme.</Text>
          <Text style={footer}>© {new Date().getFullYear()} WIECA Mentor Connect. All rights reserved.</Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
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
