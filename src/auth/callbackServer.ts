import http from 'http';
import url from 'url';

export function startCallbackServer(port: number = 3000): Promise<string> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url || '', true);

      if (parsedUrl.pathname === '/oauth2callback' || parsedUrl.pathname === '/mf/callback') {
        const code = parsedUrl.query.code as string;

        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <html>
              <body style="font-family: sans-serif; padding: 50px; text-align: center;">
                <h1>✅ 認証成功！</h1>
                <p>認証コードを取得しました。</p>
                <p style="background: #f0f0f0; padding: 20px; border-radius: 5px;">
                  <code style="font-size: 16px;">${code}</code>
                </p>
                <p>このウィンドウを閉じて、ターミナルに戻ってください。</p>
              </body>
            </html>
          `);

          server.close();
          resolve(code);
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1>エラー：認証コードが見つかりません</h1>');
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      }
    });

    server.listen(port, () => {
      console.log(`\n認証用サーバーを起動しました (http://localhost:${port})`);
    });
  });
}
