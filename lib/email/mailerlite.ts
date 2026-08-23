import "server-only";

const MAILERLITE_GROUP_ID = "196583390575593396";

type ApprovedBusinessSubscriber = {
  fullName: string;
  email: string;
  company: string;
};

export async function addApprovedBusinessToMailerLite(subscriber: ApprovedBusinessSubscriber) {
  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) {
    console.error("MailerLite subscriber sync skipped: MAILERLITE_API_KEY is not configured.");
    return false;
  }

  const nameParts = subscriber.fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts.shift() ?? "";
  const lastName = nameParts.join(" ");

  try {
    const response = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: subscriber.email.trim(),
        fields: {
          name: firstName,
          last_name: lastName,
          company: subscriber.company.trim(),
        },
        groups: [MAILERLITE_GROUP_ID],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as { message?: string };
      console.error("MailerLite subscriber sync failed.", {
        status: response.status,
        message: result.message ?? "Unknown MailerLite error",
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("MailerLite subscriber sync could not reach the provider.", error);
    return false;
  }
}
