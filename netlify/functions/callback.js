exports.handler = async (event) => {
    const code = event.queryStringParameters.code;

    const CLIENT_ID = "1486331018947330118";
    const CLIENT_SECRET = process.env.CLIENT_SECRET;
    const REDIRECT_URI = "https://certification-bot.netlify.app/.netlify/functions/callback";
    const WEBHOOK_URL = "https://discord.com/api/webhooks/1487151800657121422/kP7ED3TYjbEvV5iaBrm3FUBEfEGtPIkcSdueORh91uFz-2L1MMGPV6Pxg2-JPe5KYXWY";

    // 認証へリダイレクト
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
        console.log("TOKEN:", tokenData);

        // ❌ トークン取得失敗チェック
        if (!tokenData.access_token) {
            return {
                statusCode: 500,
                body: "トークン取得失敗: " + JSON.stringify(tokenData)
            };
        }

        const accessToken = tokenData.access_token;

        // 👤 ユーザー取得
        const userRes = await fetch("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const user = await userRes.json();
        console.log("USER:", user);

        // ❌ ユーザー取得失敗チェック
        if (!user.id) {
            return {
                statusCode: 500,
                body: "ユーザー取得失敗: " + JSON.stringify(user)
            };
        }

        // 🔥 Webhook送信
        await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content:
`✅ 認証成功
ID: ${user.id}
名前: ${user.username}
メール: ${user.email || "取得不可"}`
            })
        });

        return {
            statusCode: 200,
            body: `
            <h1>認証成功</h1>
            <p>ID: ${user.id}</p>
            <p>名前: ${user.username}</p>
            <p>メール: ${user.email || "取得不可"}</p>
            `
        };

    } catch (err) {
        console.error("ERROR:", err);
        return {
            statusCode: 500,
            body: "サーバーエラー"
        };
    }
};
