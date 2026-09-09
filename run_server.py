import http.server
import socketserver
import webbrowser
import threading
import time
import sys
import json
import os
import mimetypes

# Explicitly register mime-types to prevent Windows Registry overrides
mimetypes.init()
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('text/html', '.html')
mimetypes.add_type('image/png', '.png')
mimetypes.add_type('image/jpeg', '.jpg')
mimetypes.add_type('image/jpeg', '.jpeg')


PORT = 8000

class SilentHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Prevent request logging from cluttering the console
        pass

    def do_POST(self):
        if self.path == '/api/sync':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                payload = json.loads(post_data.decode('utf-8'))
                
                queries = payload.get('queries', [])
                spoilage = payload.get('spoilage', [])
                stats = payload.get('stats', {})
                
                os.makedirs('data', exist_ok=True)
                
                # 1. Save queries.json
                with open('data/queries.json', 'w', encoding='utf-8') as f:
                    json.dump(queries, f, indent=2, ensure_ascii=False)
                
                # 2. Save spoilage.json
                with open('data/spoilage.json', 'w', encoding='utf-8') as f:
                    json.dump(spoilage, f, indent=2, ensure_ascii=False)
                
                # 3. Save stats.json
                with open('data/stats.json', 'w', encoding='utf-8') as f:
                    json.dump(stats, f, indent=2, ensure_ascii=False)
                
                # 4. Compile data/data.js
                with open('data/data.js', 'w', encoding='utf-8') as f:
                    f.write('// KoolKisaan Precompiled Data\n')
                    f.write('window.queriesData = ' + json.dumps(queries, ensure_ascii=False) + ';\n\n')
                    f.write('window.spoilageData = ' + json.dumps(spoilage, ensure_ascii=False) + ';\n\n')
                    f.write('window.statsData = ' + json.dumps(stats, ensure_ascii=False) + ';\n')
                
                # Send success response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status":"success"}')
                print("[KoolKisaan Server] Database synced and data/data.js recompiled successfully!")
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(f'{{"status":"error","message":"{str(e)}"}}'.encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

def start_server():
    Handler = SilentHTTPRequestHandler
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"\n[KoolKisaan Server] Serving successfully at http://localhost:{PORT}/")
            print("[KoolKisaan Server] Press Ctrl+C in this terminal to stop the server.")
            httpd.serve_forever()
    except Exception as e:
        print(f"Error starting server: {e}", file=sys.stderr)

if __name__ == '__main__':
    # Start the server in a separate background thread
    server_thread = threading.Thread(target=start_server)
    server_thread.daemon = True
    server_thread.start()
    
    # Allow server thread a moment to bind to the port
    time.sleep(0.8)
    
    # Open the browser to index.html
    url = f"http://localhost:{PORT}/index.html"
    print(f"[KoolKisaan Server] Automatically launching your browser to: {url}")
    webbrowser.open(url)
    
    # Keep the main thread alive to listen for Ctrl+C
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[KoolKisaan Server] Server stopped. Goodbye!")
        sys.exit(0)
