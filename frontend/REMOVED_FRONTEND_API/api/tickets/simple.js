// Simplified tickets route without auth or Prisma - just for testing routing
export default function handler(req, res) {
  const { method } = req;

  if (method === 'GET') {
    return res.status(200).json({
      success: true,
      data: [
        {
          id: 1,
          subject: 'Test Ticket',
          status: 'open',
          priority: 'medium',
        },
      ],
      message: 'Tickets route works! (Simple version)',
    });
  }

  if (method === 'POST') {
    return res.status(201).json({
      success: true,
      data: {
        id: 999,
        subject: req.body.subject || 'New Ticket',
        status: 'open',
      },
      message: 'Ticket created! (Simple version)',
    });
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed',
  });
}
