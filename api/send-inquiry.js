import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, subject, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Kick Serve Tennis <noreply@kickserve.biz>';
  const toEmail = process.env.CONTACT_EMAIL || 'info@kickserve.biz';

  if (!apiKey) {
    console.error('RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'Email service not configured.' });
  }

  const resend = new Resend(apiKey);

  const subjectLine = subject
    ? `Kickserve.biz inquiry: ${subject}`
    : `Kickserve.biz inquiry from ${name}`;

  const htmlBody = `
    <h2>New Inquiry from kickserve.biz</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
    ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
    <hr>
    <p>${message.replace(/\n/g, '<br>')}</p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: email,
      subject: subjectLine,
      html: htmlBody,
    });

    if (error) {
      console.error('Resend error:', JSON.stringify(error));
      return res.status(500).json({ error: 'Failed to send email. Please try again later.', detail: error.message || error });
    }

    return res.status(200).json({ success: true, id: data?.id });
  } catch (err) {
    console.error('Send error:', err);
    return res.status(500).json({ error: 'Failed to send email. Please try again later.', detail: err.message || String(err) });
  }
}
