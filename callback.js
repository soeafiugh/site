const axios = require("axios");

exports.handler = async (event) => {
    const code = event.queryStringParameters.code;

    const CLIENT_ID = "1486331018947330118";
    const CLIENT_SECRET = process.env.CLIENT_SECRET;
    const REDIRECT_URI = "https://あなたのサイト.netlify.app/.netlify/functions/callback";

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
        // トークン取得
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: REDIRECT_URI
        });

        const tokenRes = await axios.post("https://discord.com/api/oauth2/token", params);
        const accessToken = tokenRes.data.access_token;

        // ユーザー取得
        const userRes = await axios.get("https://discord.com/api/users/@me", {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const user = userRes.data;

        // 結果表示
        return {
            statusCode: 200,
            headers: { "Content-Type": "text/html" },
            body: `
            <h1>認証成功</h1>
            <p>ID: ${user.id}</p>
            <p>名前: ${user.username}</p>
            <p>メール: ${user.email}</p>
            `
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: "エラー"
        };
    }
};
