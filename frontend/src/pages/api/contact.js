export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { firstName, lastName, email, company, message } = req.body;

  // Basic validation
  if (!firstName || !lastName || !email || !message) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // For now, we'll just log the form data and return success
    // In production, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP
    // - EmailJS (client-side)

    console.log('Contact form submission:', {
      firstName,
      lastName,
      email,
      company,
      message,
      timestamp: new Date().toISOString(),
    });

    // Simulate email sending
    const emailData = {
      to: 'syedarfan101@gmail.com',
      subject: `New Contact Form Submission from ${firstName} ${lastName}`,
      body: `
        New contact form submission:
        
        Name: ${firstName} ${lastName}
        Email: ${email}
        Company: ${company || 'Not provided'}
        
        Message:
        ${message}
        
        Submitted at: ${new Date().toLocaleString()}
      `,
    };

    console.log('Email would be sent:', emailData);

    // Return success
    res.status(200).json({
      message: 'Message sent successfully!',
      data: {
        firstName,
        lastName,
        email,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
}
