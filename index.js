require("dotenv").config();

const { Telegraf, Markup } = require("telegraf");
const express = require("express");
const fs = require("fs");
const path = require("path");

// ================= SAFE INSTANCE =================
if (global.__BOT__) process.exit(0);
global.__BOT__ = true;

// ================= APP (WEB SERVER) =================
const app = express();

app.use(express.json());
app.use(express.static("webapp"));

// WebApp route (FIX 502)
app.get("/webapp", (req, res) => {
    res.sendFile(path.join(__dirname, "webapp", "index.html"));
});

// health check (Railway)
app.get("/", (req, res) => {
    res.send("🖤 GOTH BOT ONLINE");
});

// ================= BOT =================
const bot = new Telegraf(process.env.BOT_TOKEN, {
    handlerTimeout: 90000
});

// ================= WEBAPP URL =================
const WEBAPP_URL =
    process.env.WEBAPP_URL ||
    "https://vampgothnew-production.up.railway.app/webapp";

// ================= DB =================
let db = { users: {}, admin: {} };

if (fs.existsSync("db.json")) {
    db = JSON.parse(fs.readFileSync("db.json"));
}

const save = () =>
    fs.writeFileSync("db.json", JSON.stringify(db, null, 2));

function user(id) {
    if (!db.users[id]) {
        db.users[id] = {
            coin: 0,
            silver: 0,
            wins: 0,
            loses: 0,
            fights: 0,
            lastDaily: 0,
            banned: false
        };
        save();
    }
    return db.users[id];
}

// ================= START =================
bot.start((ctx) => {
    const u = user(ctx.from.id);

    if (u.banned) return ctx.reply("⛔ You are banned");

    ctx.reply(
`🖤 Salutation

Welcome to GOTH BOT 🍷

Ready to /launch or /more`,
        Markup.inlineKeyboard([
            [Markup.button.webApp("🖤 ENTER PORTAL", WEBAPP_URL)],
            [Markup.button.callback("📜 MORE", "more")]
        ])
    );
});

// ================= MORE =================
bot.action("more", (ctx) => {
    ctx.reply(
`📜 SYSTEM

/daily
/profile
/fight
/shop
/admin`
    );
});

// ================= DAILY =================
bot.command("daily", (ctx) => {
    const u = user(ctx.from.id);

    if (Date.now() - u.lastDaily < 86400000)
        return ctx.reply("⏳ Already claimed");

    u.lastDaily = Date.now();
    u.coin += 200;

    save();
    ctx.reply("🎁 +200 COIN");
});

// ================= PROFILE =================
bot.command("profile", (ctx) => {
    const u = user(ctx.from.id);

    ctx.reply(
`🖤 PROFILE

💰 Coin: ${u.coin}
🥈 Silver: ${u.silver}
⚔ Wins: ${u.wins}
💀 Loses: ${u.loses}
🔥 Fights: ${u.fights}`
    );
});

// ================= FIGHT =================
bot.command("fight", (ctx) => {
    const u = user(ctx.from.id);

    const win = Math.random() > 0.5;
    u.fights++;

    if (win) {
        u.wins++;
        u.coin += 100;
        ctx.reply("⚔ YOU WON +100");
    } else {
        u.loses++;
        ctx.reply("💀 YOU LOST");
    }

    save();
});

// ================= SHOP =================
bot.command("shop", (ctx) => {
    ctx.reply(
`🛒 NFT SHOP`,
        Markup.inlineKeyboard([
            [Markup.button.webApp("OPEN SHOP 🖤", WEBAPP_URL)]
        ])
    );
});

// ================= ADMIN PANEL =================
const ADMINS = [process.env.ADMIN_ID];

bot.command("admin", (ctx) => {
    if (!ADMINS.includes(String(ctx.from.id)))
        return ctx.reply("⛔ No access");

    ctx.reply(
`🧠 ADMIN PANEL

/users
/ban <id>
/unban <id>`
    );
});

bot.command("ban", (ctx) => {
    if (!ADMINS.includes(String(ctx.from.id))) return;

    const id = ctx.message.text.split(" ")[1];
    if (!db.users[id]) return;

    db.users[id].banned = true;
    save();

    ctx.reply("⛔ banned");
});

bot.command("unban", (ctx) => {
    if (!ADMINS.includes(String(ctx.from.id))) return;

    const id = ctx.message.text.split(" ")[1];
    if (!db.users[id]) return;

    db.users[id].banned = false;
    save();

    ctx.reply("✅ unbanned");
});

// ================= WEBAPP DATA =================
bot.on("web_app_data", (ctx) => {
    const data = JSON.parse(ctx.webAppData.data);
    const u = user(ctx.from.id);

    if (u.banned) return;

    if (data.type === "tap") {
        u.coin += data.value || 10;
    }

    if (data.type === "fight") {
        if (data.result === "win") {
            u.coin += 100;
            u.wins++;
        } else {
            u.loses++;
        }
    }

    if (data.type === "buy_nft") {
        u.silver += 1;
    }

    save();
});

// ================= LAUNCH =================
bot.launch({
    dropPendingUpdates: true
});

// ================= START SERVER =================
app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
    console.log("🖤 SERVER + BOT RUNNING");
});