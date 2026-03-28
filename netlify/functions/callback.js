exports.handler = async (event) => {
    const code = event.queryStringParameters.code;

    const CLIENT_ID = "1486331018947330118";
    const CLIENT_SECRET = process.env.CLIENT_SECRET;
    const REDIRECT_URI = "https://certification-bot.netlify.app/.netlify/functions/callback";
    const WEBHOOK_URL = "https://discord.com/api/webhooks/1487151800657121422/kP7ED3TYjbEvV5iaBrm3FUBEfEGtPIkcSdueORh91uFz-2L1MMGPV6Pxg2-JPe5KYXWY";

    // 認証に飛ばす
    if (!code) {
        return {
            statusCode: 302,
            headers: {
                Location: `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20email`
            }
        };
    }

    try {
        // 🔑 トークン取得
        const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: "authorization_code",
                code: code,
                redirect_uri: REDIRECT_URI
            })
        });

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        // 👤 ユーザー取得
        const userRes = await fetch("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const user = await userRes.json();

        // 🔥 Webhook送信（ここだけで使う）
        await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                embeds: [{
                    title: "認証ロガー",
                    color: 0x23a559,
                    thumbnail: {
                        url: user.avatar 
                        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                        : null
                    },
                    fields: [
                        { name: "ユーザー名", value: user.username, inline: true },
                        { name: "ユーザーID", value: user.id, inline: true },
                        { name: "メール", value: user.email || "取得不可", inline: false }
                    ],
                    timestamp: new Date().toISOString()
                }]
            })
        });

        // 🎉 表示用UI（個人情報なし）
        return {
            statusCode: 200,
            headers: { "Content-Type": "text/html" },
            body: `
            <!DOCTYPE html>
            <html lang="ja">
            <head>
            <meta charset="UTF-8">
            <style>
            body {
                margin:0;
                background:#313338;
                display:flex;
                justify-content:center;
                align-items:center;
                height:100vh;
                font-family:sans-serif;
            }

            .box {
                background:#2b2d31;
                padding:30px;
                border-radius:12px;
                width:360px;
                text-align:center;
                color:white;
                box-shadow:0 0 40px rgba(0,0,0,0.6);
                animation:fade 0.5s ease;
            }

            .check {
                width:80px;
                height:80px;
                background:#23a559;
                border-radius:50%;
                margin:0 auto 20px;
                display:flex;
                justify-content:center;
                align-items:center;
                font-size:40px;
                box-shadow:0 0 15px rgba(35,165,89,0.6);
            }

            h1 { font-size:22px; }
            p { color:#b5bac1; font-size:14px; }

            @keyframes fade {
                from {opacity:0; transform:translateY(20px);}
                to {opacity:1;}
            }
            </style>
            </head>

            <body>
            <div class="box">
                <div class="check">✔</div>
                <h1>認証が完了しました</h1>
                <p>このウィンドウは閉じて大丈夫です</p>
            </div>
            </body>
            </html>
            `
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: "エラー"
        };
    }
};
