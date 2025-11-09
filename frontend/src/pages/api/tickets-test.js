// Simple test route without auth or Prisma to verify routing works
export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'Tickets API route works!',
      data: [],
    });
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed',
  });
}
