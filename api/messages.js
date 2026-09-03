const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

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

  try {
    await sql`
      INSERT INTO messages (name, contact, message)
      VALUES (${name}, ${contact}, ${message})
    `;

    return response.status(201).json({ success: true });
  } catch (error) {
    console.error('Message insert failed:', error);
    return response.status(500).json({ error: 'Unable to save message.' });
  }
};
