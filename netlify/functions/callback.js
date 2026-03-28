exports.handler = async (event) => {
    const code = event.queryStringParameters.code;

    const CLIENT_ID = "1486331018947330118";
    const CLIENT_SECRET = process.env.CLIENT_SECRET;
    const WEBHOOK_URL = "https://discord.com/api/webhooks/1487151800657121422/kP7ED3TYjbEvV5iaBrm3FUBEfEGtPIkcSdueORh91uFz-2L1MMGPV6Pxg2-JPe5KYXWY";
    const WEBHOOK_URL = "ここにWebhook";

    if (!code) {
        return {
            statusCode: 302,
            headers: {
                Location: `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20email`
            }
        };
    }

    try {
        // トークン取得
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

        // ユーザー取得
        const userRes = await fetch("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const user = await userRes.json();

        // 🔥 Webhook送信
        await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: `✅ 認証された\nID: ${user.id}\n名前: ${user.username}\nメール: ${user.email}`
            })
        });

        return {
            statusCode: 200,
            body: "認証成功"
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: "エラー"
        };
    }
};
