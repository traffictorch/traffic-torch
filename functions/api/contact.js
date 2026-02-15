export async function onRequestPost(context) {
  const formData = await context.request.formData();
  const name = formData.get('name')?.toString() || 'Anonymous';
  const email = formData.get('email')?.toString() || 'No email';
  const message = formData.get('message')?.toString() || 'No message';

  const timestamp = new Date().toISOString();

  const discordPayload = {
    embeds: [{
      title: "New Contact Form Submission",
      color: 0xff6b00, // orange accent
      fields: [
        { name: "Name", value: name, inline: true },
        { name: "Email", value: email, inline: true },
        { name: "Message", value: message || '(empty)', inline: false }
      ],
      footer: { text: `Submitted: ${timestamp} | Traffic Torch` },
      timestamp: timestamp
    }]
  };

  try {
    const response = await fetch(context.env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload)
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Contact form error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Failed to send' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}