import type { Config, Context } from "@netlify/edge-functions";

const COOKIE_NAME = "nf_site_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function renderPasswordPage(hasError = false): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Required — Ian Yen</title>
  <link rel="icon" href="/favicon.png?v=3" type="image/png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      color-scheme: dark;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0a0c;
      color: #f4f4f6;
      font-family: "Geist", "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
      padding: 24px;
    }
    .card {
      width: 100%;
      max-width: 380px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 32px 28px;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(16px);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      font-weight: 600;
      font-size: 15px;
      margin-bottom: 20px;
      color: #fff;
    }
    h1 {
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }
    p {
      font-size: 14px;
      line-height: 1.5;
      color: rgba(244, 244, 246, 0.65);
      margin-bottom: 24px;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    input[type="password"] {
      width: 100%;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid ${hasError ? "#ef4444" : "rgba(255, 255, 255, 0.14)"};
      background: rgba(0, 0, 0, 0.35);
      color: #fff;
      font-size: 15px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s ease;
    }
    input[type="password"]:focus {
      border-color: rgba(255, 255, 255, 0.45);
    }
    button {
      width: 100%;
      padding: 12px 16px;
      border-radius: 10px;
      border: none;
      background: #f4f4f6;
      color: #0a0a0c;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: opacity 0.15s ease, transform 0.1s ease;
    }
    button:hover {
      opacity: 0.92;
    }
    button:active {
      transform: scale(0.99);
    }
    .error {
      font-size: 13px;
      color: #f87171;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <main class="card">
    <div class="badge" aria-hidden="true">.y</div>
    <h1>Protected Portfolio</h1>
    <p>Please enter the password to view this project.</p>
    <form method="POST">
      <input
        type="password"
        name="password"
        placeholder="Enter password"
        autocomplete="current-password"
        autofocus
        required
      />
      ${hasError ? '<div class="error" role="alert">Incorrect password. Please try again.</div>' : ""}
      <button type="submit">Continue</button>
    </form>
  </main>
</body>
</html>`;
}

export default async (request: Request, context: Context) => {
  const expectedPassword = Netlify.env.get("SITE_PASSWORD");
  if (!expectedPassword) {
    return new Response("Site password is not configured.", { status: 500 });
  }

  const expectedToken = await sha256Hex(`nf_gate:${expectedPassword}`);
  const currentCookie = context.cookies.get(COOKIE_NAME);

  if (currentCookie === expectedToken) {
    return;
  }

  if (request.method === "POST") {
    const formData = await request.formData().catch(() => null);
    const submittedPassword = String(formData?.get("password") ?? "");

    if (submittedPassword === expectedPassword) {
      context.cookies.set({
        name: COOKIE_NAME,
        value: expectedToken,
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        maxAge: COOKIE_MAX_AGE,
      });
      return Response.redirect(request.url, 303);
    }

    return new Response(renderPasswordPage(true), {
      status: 401,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  return new Response(renderPasswordPage(false), {
    status: 401,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
};

export const config: Config = {
  path: "/*",
  excludedPath: [
    "/assets/*",
    "/netlify/*",
    "/*.css",
    "/*.js",
    "/*.png",
    "/*.jpg",
    "/*.jpeg",
    "/*.gif",
    "/*.svg",
    "/*.ico",
    "/*.webp",
    "/*.woff",
    "/*.woff2",
  ],
};
