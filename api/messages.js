const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

module.exports = async (request, response) => {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const name = String(request.body?.name || '').trim();
  const contact = String(request.body?.contact || '').trim();
  const message = String(request.body?.message || '').trim();

  if (!name || !contact || !message) {
    return response.status(400).json({ error: 'All fields are required.' });
  }

  if (name.length > 100 || contact.length > 200 || message.length > 5000) {
    return response.status(400).json({ error: 'One or more fields are too long.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
    return response.status(400).json({ error: 'Please provide a valid email address.' });
  }

  try {
    const rows = await sql`
      INSERT INTO messages (name, contact, message)
      VALUES (${name}, ${contact}, ${message})
      RETURNING id
    `;
    const messageId = rows[0].id;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL,
        to: [contact],
        subject: `Thank you for your message #${messageId}`,
        text: `Dear ${name},\n\nThank you for your message. We have received it and will get back to you within 48 hours.\n\nYour message ID is: ${messageId}\n\nRegards,\nSudan Srinivasan`,
        html: `<p>Dear ${escapeHtml(name)},</p><p>Thank you for your message. We have received it and will get back to you within 48 hours.</p><p><strong>Your message ID is: ${messageId}</strong></p><p>Regards,<br>Sudan Srinivasan</p>`
      })
    });

    if (!emailResponse.ok) {
      console.error('Confirmation email failed:', await emailResponse.text());
      return response.status(201).json({ success: true, id: messageId, emailSent: false });
    }

    return response.status(201).json({ success: true, id: messageId, emailSent: true });
  } catch (error) {
    console.error('Message insert failed:', error);
    return response.status(500).json({ error: 'Unable to save message.' });
  }
};
