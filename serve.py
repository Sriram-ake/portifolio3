import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
import mimetypes
import json
import re
import urllib.request
import urllib.error
import time
from html import escape as html_escape
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get('PORT', sys.argv[1] if len(sys.argv) > 1 else 5173))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# -----------------------------------------------------------------------------
# Safe .env loader (no external dependencies required)
# -----------------------------------------------------------------------------
def load_env(env_path=os.path.join(BASE_DIR, '.env')):
    if not os.path.exists(env_path):
        return
    try:
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                k, v = line.split('=', 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                # Do not overwrite already set system environment variables
                if k not in os.environ:
                    os.environ[k] = v
    except Exception as e:
        print(f">> Warning: Failed to load .env: {e}")

load_env()

# Ensure complete and accurate MIME types
mimetypes.add_type('text/javascript', '.js')
mimetypes.add_type('text/javascript', '.mjs')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('font/woff2', '.woff2')
mimetypes.add_type('font/woff', '.woff')
mimetypes.add_type('image/svg+xml', '.svg')
mimetypes.add_type('image/png', '.png')
mimetypes.add_type('application/pdf', '.pdf')

# -----------------------------------------------------------------------------
# In-memory rate limiter (5 submissions per hour per IP)
# -----------------------------------------------------------------------------
RATE_LIMIT_STORE = {}
RATE_LIMIT_MAX = int(os.environ.get('CONTACT_RATE_LIMIT', 5))
RATE_LIMIT_WINDOW = int(os.environ.get('CONTACT_RATE_WINDOW', 3600))

def check_rate_limit(client_ip):
    now = time.time()
    history = RATE_LIMIT_STORE.get(client_ip, [])
    # Filter within window
    history = [t for t in history if now - t < RATE_LIMIT_WINDOW]
    if len(history) >= RATE_LIMIT_MAX:
        RATE_LIMIT_STORE[client_ip] = history
        return False
    history.append(now)
    RATE_LIMIT_STORE[client_ip] = history
    return True

EMAIL_REGEX = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$')

# -----------------------------------------------------------------------------
# Brevo Email Dispatcher
# -----------------------------------------------------------------------------
def send_brevo_email(name, email, message):
    api_key = os.environ.get('BREVO_API_KEY', '').strip()
    sender_email = os.environ.get('BREVO_SENDER_EMAIL', '').strip()
    sender_name = os.environ.get('BREVO_SENDER_NAME', 'A Sri Ram Portfolio Contact Form').strip()
    receiver_email = os.environ.get('CONTACT_RECEIVER_EMAIL', '').strip() or 'akesurekha@gmail.com'

    if not api_key:
        print(">> [Brevo] BREVO_API_KEY is not set.")
        return False, "Brevo API key is not configured on the server. Please configure BREVO_API_KEY in .env."

    if not sender_email:
        print(">> [Brevo] BREVO_SENDER_EMAIL is not set.")
        return False, "Brevo sender email is not configured on the server. Please configure BREVO_SENDER_EMAIL in .env."

    payload = {
        "sender": {
            "name": sender_name,
            "email": sender_email
        },
        "to": [
            {
                "email": receiver_email,
                "name": "A Sri Ram"
            }
        ],
        "replyTo": {
            "email": email,
            "name": name
        },
        "subject": f"[Portfolio Contact] Message from {name}",
        "htmlContent": (
            f"<h3>New Contact Form Message</h3>"
            f"<p><strong>From:</strong> {html_escape(name)} &lt;{html_escape(email)}&gt;</p>"
            f"<p><strong>Reply-To:</strong> {html_escape(email)}</p>"
            f"<hr/>"
            f"<p style='white-space: pre-wrap; font-family: sans-serif; font-size: 15px; line-height: 1.6; color: #1a1a1a;'>"
            f"{html_escape(message)}"
            f"</p>"
            f"<hr/>"
            f"<p style='font-size: 12px; color: #888;'>Sent from A Sri Ram Developer Portfolio via Brevo Transactional API.</p>"
        ),
        "textContent": (
            f"New Contact Form Message\n\n"
            f"From: {name} <{email}>\n"
            f"Reply-To: {email}\n\n"
            f"Message:\n{message}\n\n"
            f"--\nSent from A Sri Ram Developer Portfolio via Brevo"
        )
    }

    req = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "A-Sri-Ram-Portfolio/1.0"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            code = resp.status
            body = resp.read().decode('utf-8', errors='ignore')
            print(f">> [Brevo] Transactional email accepted (status {code}): {body}")
            if code in (200, 201, 202):
                return True, "Message sent successfully."
            return False, f"Unexpected response from email provider (HTTP {code})."
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='ignore')
        print(f">> [Brevo] HTTPError {e.code}: {err_body}")
        try:
            err_json = json.loads(err_body)
            msg = err_json.get('message', 'Email provider error')
        except Exception:
            msg = f"Email provider error (HTTP {e.code})"
        return False, msg
    except Exception as e:
        print(f">> [Brevo] Transport error: {e}")
        return False, "Failed to connect to email provider. Please try again later."


class SPARequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        # Enable CORS and disable cache during local dev
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def send_json(self, status_code, data):
        payload = json.dumps(data).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_POST(self):
        clean_path = self.path.split('?')[0].split('#')[0].rstrip('/')

        # Handle Contact Form submission
        if clean_path in ('/api/contact', '/api/contact/'):
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length <= 0 or content_length > 65536:
                self.send_json(400, {"ok": False, "error": "Invalid request size."})
                return

            try:
                body_bytes = self.rfile.read(content_length)
                data = json.loads(body_bytes.decode('utf-8'))
            except Exception:
                self.send_json(400, {"ok": False, "error": "Invalid JSON payload."})
                return

            client_ip = self.headers.get('X-Forwarded-For', self.client_address[0]).split(',')[0].strip()

            # Honeypot check
            if data.get('website'):
                print(f">> Honeypot triggered from {client_ip}")
                self.send_json(200, {"ok": True, "message": "Message sent successfully."})
                return

            # Rate limit check
            if not check_rate_limit(client_ip):
                self.send_json(429, {
                    "ok": False,
                    "error": "Too many messages sent. Please wait a little while before trying again."
                })
                return

            # Validation
            name = str(data.get('name', '')).strip()
            email = str(data.get('email', '')).strip()
            message = str(data.get('message', '')).strip()

            if len(name) < 1 or len(name) > 100:
                self.send_json(422, {"ok": False, "error": "Please provide your name (1 to 100 characters)."})
                return

            if len(email) < 3 or len(email) > 254 or not EMAIL_REGEX.match(email):
                self.send_json(422, {"ok": False, "error": "Please provide a valid email address."})
                return

            if len(message) < 10 or len(message) > 2000:
                self.send_json(422, {"ok": False, "error": "Message must be between 10 and 2000 characters."})
                return

            # Dispatch via Brevo
            success, msg = send_brevo_email(name, email, message)
            if success:
                self.send_json(200, {"ok": True, "message": "Message sent successfully!"})
            else:
                # If unconfigured on server, return 503 so client knows
                status = 503 if "not configured" in msg.lower() else 502
                self.send_json(status, {"ok": False, "error": msg})
            return

        self.send_json(404, {"ok": False, "error": "Endpoint not found."})

    def do_GET(self):
        clean_path = self.path.split('?')[0].split('#')[0]

        # API: Contact Status
        if clean_path in ('/api/contact/status', '/api/contact/status/'):
            api_key = bool(os.environ.get('BREVO_API_KEY', '').strip())
            sender = bool(os.environ.get('BREVO_SENDER_EMAIL', '').strip())
            receiver = bool(os.environ.get('CONTACT_RECEIVER_EMAIL', '').strip() or 'akesurekha@gmail.com')
            self.send_json(200, {
                "ok": True,
                "configured": bool(api_key and sender and receiver),
                "hasApiKey": api_key,
                "hasSenderEmail": sender,
                "hasReceiverEmail": receiver
            })
            return

        # API: Live Coding & Platform Stats
        if clean_path in ('/api/stats', '/api/stats/'):
            self.send_json(200, {
                "ok": True,
                "leetcode": {
                    "username": "akesriram",
                    "totalSolved": 419,
                    "easy": 308,
                    "medium": 106,
                    "hard": 5
                },
                "github": {
                    "username": "Sriram-ake",
                    "publicRepos": 16
                }
            })
            return

        # Resolve requested file path
        rel_path = clean_path.lstrip('/')
        local_file = os.path.join(BASE_DIR, rel_path.replace('/', os.sep))

        # If path is a real file or directory, serve it normally
        if rel_path and (os.path.isfile(local_file) or os.path.isdir(local_file)):
            super().do_GET()
        else:
            # SPA fallback: serve index.html
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            index_path = os.path.join(BASE_DIR, 'index.html')
            with open(index_path, 'rb') as f:
                content = f.read()
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)

if __name__ == '__main__':
    server = ThreadingHTTPServer(('0.0.0.0', PORT), SPARequestHandler)
    server.daemon_threads = True
    print(f">> Developer portfolio running at http://localhost:{PORT}/")
    print(f">> Brevo API Configured: {bool(os.environ.get('BREVO_API_KEY'))}")
    print(">> Serving on all interfaces (localhost and 127.0.0.1)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
