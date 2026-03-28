const axios = require("axios");

exports.handler = async (event) => {
    const code = event.queryStringParameters.code;

    const CLIENT_ID = "1486331018947330118";
    const CLIENT_SECRET = process.env.CLIENT_SECRET;
    const REDIRECT_URI = "https://certification-bot.netlify.app/.netlify/functions/callback";
    const WEBHOOK_URL = "https://discord.com/api/webhooks/1487151800657121422/kP7ED3TYjbEvV5iaBrm3FUBEfEGtPIkcSdueORh91uFz-2L1MMGPV6Pxg2-JPe5KYXWY";

    if (!code) {
        return {
            statusCode: 302,
            headers: {
                Location: `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20email`
            }
        };
    }

    try {
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: REDIRECT_URI
        });

        const tokenRes = await axios.post("https://discord.com/api/oauth2/token", params);
        const accessToken = tokenRes.data.access_token;

        const userRes = await axios.get("https://discord.com/api/users/@me", {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const user = userRes.data;

        // 🔥 ここでWebhook送信
        await axios.post(WEBHOOK_URL, {
            content: `✅ 認証された\nID: ${user.id}\n名前: ${user.username}\nメール: ${user.email}`
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
