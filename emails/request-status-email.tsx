import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text } from "@react-email/components"

interface RequestStatusEmailProps {
  menteeName: string
  mentorName: string
  status: "accepted" | "declined"
  message?: string
  dashboardUrl: string
}

export default function RequestStatusEmail({
  menteeName,
  mentorName,
  status,
  message,
  dashboardUrl,
}: RequestStatusEmailProps) {
  const previewText = `Your mentorship request has been ${status}`
  const isAccepted = status === "accepted"

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={{ ...h1, color: isAccepted ? "#4CAF50" : "#F44336" }}>
            Mentorship Request {isAccepted ? "Accepted" : "Declined"}
          </Heading>
          <Text style={text}>Hello {menteeName},</Text>
          <Text style={text}>
            Your mentorship request to <strong>{mentorName}</strong> has been <strong>{status}</strong>.
          </Text>
          {isAccepted ? (
            <>
              <Text style={text}>
                Congratulations! You can now start communicating with your mentor through the platform.
              </Text>
              {message && (
                <Section style={messageBox}>
                  <Text style={messageText}>{message}</Text>
                </Section>
              )}
              <Section style={buttonContainer}>
                <Link href={dashboardUrl} style={{ ...button, backgroundColor: "#4CAF50" }}>
                  Start Conversation
                </Link>
              </Section>
            </>
          ) : (
            <>
              <Text style={text}>
                Don't be discouraged. There are many other mentors available who might be a better fit for your needs
                and goals.
              </Text>
              {message && (
                <Section style={messageBox}>
                  <Text style={messageText}>{message}</Text>
                </Section>
              )}
              <Section style={buttonContainer}>
                <Link href={dashboardUrl} style={button}>
                  Find Other Mentors
                </Link>
              </Section>
            </>
          )}
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
