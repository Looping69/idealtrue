export default function handler(_req, res) {
  res.status(200).json({
    ok: true,
    service: 'ideal-stay-web',
    checkedAt: new Date().toISOString(),
  });
}
