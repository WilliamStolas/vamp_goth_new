require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const fs = require("fs");

// =====================
// ANTI MULTI INSTANCE
// =====================
if (global.__BOT__) {
    console.log("BOT already running");
    process.exit(0);
}
global.__BOT__ = true;

// =====================
// BOT INIT
// =====================
const bot = new Telegraf(process.env.BOT_TOKEN);

// =====================
// DB
// =====================
let db = { users: {} };

if (fs.existsSync("db.json")) {
    db = JSON.parse(fs.readFileSync("db.json"));
}

const saveDB = () =>
    fs.writeFileSync("db.json", JSON.stringify(db, null, 2));

// =====================
// USER INIT
// =====================
function user(id) {
    if (!db.users[id]) {
        db.users[id] = {
            coin: 0,
            silver: 0,
            wins: 0,
            loses: 0,
            fights: 0,
            energy: 100,
            lastBoost: 0,
            launched: false,
            nft: []
        };
        saveDB();
    }
    return db.users[id];
}

// =====================
// START (LANUCH SCREEN)
// =====================
bot.start((ctx) => {
    const u = user(ctx.from.id);

    ctx.reply(
`🖤 Salutation

Welcome to GOTH BOT 🍷

Ready to /launch or /more`
    );
});

// =====================
// LAUNCH SYSTEM (NOTCOIN STYLE)
// =====================
bot.command("launch", (ctx) => {
    const u = user(ctx.from.id);

    u.launched = true;
    u.coin += 500;
    saveDB();

    ctx.reply(
`🖤 GOTH LAUNCH ACTIVATED

💎 +500 Chrome Hearts

Tap to earn:
👉 /tap

Boost:
👉 /boost

Shop:
👉 /shop

Fight:
👉 /fight`
    );
});

// =====================
// TAP SYSTEM (MINING)
// =====================
bot.command("tap", (ctx) => {
    const u = user(ctx.from.id);

    if (!u.launched) return ctx.reply("🔒 launch first");

    if (u.energy <= 0)
        return ctx.reply("⚡ energy empty");

    u.coin += 50;
    u.energy -= 10;

    saveDB();

    ctx.reply("💎 +50 Chrome Hearts");
});

// =====================
// BOOST (DRINK RED WINE)
// =====================
bot.command("boost", (ctx) => {
    const u = user(ctx.from.id);

    const now = Date.now();
    if (now - u.lastBoost < 3600000) {
        return ctx.reply("⏳ wait 1 hour");
    }

    const reward = 500;

    u.coin += reward;
    u.lastBoost = now;

    saveDB();

    ctx.reply(`🍷 Drink Red Wine
💎 +${reward} Coins`);
});

// =====================
// PROFILE
// =====================
bot.command("profile", (ctx) => {
    const u = user(ctx.from.id);

    ctx.reply(
`🖤 PROFILE

💎 Coins: ${u.coin}
⚡ Energy: ${u.energy}
⚔️ Fights: ${u.fights}
🏆 Wins: ${u.wins}
💀 Loses: ${u.loses}`
    );
});

// =====================
// SHOP (TON READY)
// =====================
bot.command("shop", (ctx) => {
    const u = user(ctx.from.id);

    if (!u.launched) return ctx.reply("🔒 launch first");

    ctx.reply(
`🛒 GOTH SHOP

💎 Items:
- HP Boost
- Energy Drink
- Chrome Hearts Skins
- Dracula Cloaks
- Silver Coin Packs

Use:
/buy <item>`
    );
});

// =====================
// NFT MARKET
// =====================
bot.command("buy", (ctx) => {
    const u = user(ctx.from.id);

    ctx.reply(
`🧬 NFT MARKET

⚔ Sword NFT
🍷 Wine NFT
💍 Chrome Hearts
🧥 Dracula Cloaks
💎 Silver Artifacts

+ Add Custom NFT (TON READY)`
    );
});

// =====================
// FIGHT SYSTEM (UPGRADED)
// =====================
bot.command("fight", (ctx) => {
    const u = user(ctx.from.id);

    u.fights++;

    const win = Math.random() > 0.45;

    if (win) {
        u.wins++;
        u.coin += 100;
        ctx.reply("⚔ YOU WON +100 💎");
    } else {
        u.loses++;
        ctx.reply("💀 YOU LOST");
    }

    saveDB();
});

// =====================
// FRIENDS
// =====================
bot.command("friends", (ctx) => {
    const link = `https://t.me/vampiregothbot?start=ref_${ctx.from.id}`;

    ctx.reply(`👥 Invite friends:
+ reward per invite

${link}`);
});

// =====================
// ADMIN (CLEAN)
// =====================
const ADMIN_IDS = (process.env.ADMIN_IDS || "").split(",");

bot.command("admin", (ctx) => {
    if (!ADMIN_IDS.includes(String(ctx.from.id)))
        return ctx.reply("❌ no access");

    ctx.reply("👑 ADMIN PANEL READY");
});

// =====================
// VIRAL SYSTEM
// =====================
bot.on("text", (ctx) => {
    const u = user(ctx.from.id);

    if (Math.random() > 0.97) {
        u.coin += 50;
        saveDB();
        ctx.reply("🟣 VIRAL +50 💎");
    }
});

// =====================
// SAFE LAUNCH
// =====================
bot.launch({ dropPendingUpdates: true });

console.log("🖤🔥 GOTH VAMP GAME ONLINE");