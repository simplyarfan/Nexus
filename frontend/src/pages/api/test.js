export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: 'Test API route works!',
    timestamp: new Date().toISOString(),
  });
}
