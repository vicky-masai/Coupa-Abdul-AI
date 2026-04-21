// api/create-coupa-user.js
// Serverless function for Coupa user creation (token kept on server)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const token = process.env.COUPA_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "Missing COUPA_TOKEN" });
  }

  const { login, email, firstname, lastname } = req.body || {};
  if (!login || !email || !firstname || !lastname) {
    return res.status(400).json({
      error: "login, email, firstname, lastname are required"
    });
  }

  try {
    const url = "https://ey-in-demo.coupacloud.com/api/users";

    // ✅ Send root-level fields exactly like your successful Postman call
    const payload = {
      login,
      email,
      firstname,
      lastname
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Coupa API error",
        status: response.status,
        details: data
      });
    }

    return res.status(201).json(data);

  } catch (err) {
    return res.status(500).json({ error: "Server error", details: String(err) });
  }
}
