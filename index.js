require("dotenv").config();

const express = require("express");
const { Telegraf, Markup } = require("telegraf");
const path = require("path");
const { connectDB, User } = require("./db");

// ================= DB =================
(async () => {
  try {
    await connectDB().catch(err => console.log("DB connection failed:", err));
  } catch (e) {
    console.log("DB connection failed:", e);
  }
})();

const app = express();

if (!process.env.BOT_TOKEN) {
  throw new Error("BOT_TOKEN is missing");
}

const bot = new Telegraf(process.env.BOT_TOKEN);

// ================= WEBAPP =================
const WEBAPP_URL = "https://vampgothnew-production.up.railway.app";

app.use(express.json());
app.use(express.static(path.join(__dirname, "webapp")));

// 👇 اینو اضافه کن
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "webapp", "index.html"));
});

// ================= USER =================
async function getUser(id) {
  let user = await User.findOne({ userId: id });
  if (!user) user = await User.create({ userId: id });
  return user;
}

// ================= LOGIN =================
app.post("/api/login", async (req, res) => {
  const user = await getUser(req.body.id);
  res.json({ user });
});

// ================= TAP =================
app.post("/api/tap", async (req, res) => {
  const user = await getUser(req.body.id);

  let reward = user.chromeLevel * 50;

  if (Date.now() - user.lastBoost < 30 * 60 * 1000) {
    reward = 500;
    user.hp -= 1;
  }

  user.coin += reward;
  user.silver += reward;

  await user.save();

  res.json(user);
});

// ================= BOOST =================
app.post("/api/boost", async (req, res) => {
  const user = await getUser(req.body.id);

  if (Date.now() - user.lastBoost < 30 * 60 * 1000) {
    return res.json({ error: "cooldown" });
  }

  user.lastBoost = Date.now();
  user.hp += 50;

  await user.save();

  res.json({ user });
});

// ================= WHEEL =================
app.post("/api/wheel", async (req, res) => {
  const user = await getUser(req.body.id);

  if (Date.now() - user.lastWheel < 86400000) {
    return res.json({ error: "cooldown" });
  }

  user.lastWheel = Date.now();

  const rewards = [
    1000, 5000, 10000, 50000,
    100000, 500000,
    1000000, 5000000, 10000000
  ];

  const win = rewards[Math.floor(Math.random() * rewards.length)];
  user.coin += win;

  await user.save();

  res.json({ win, user });
});

// ================= REF =================
app.post("/api/ref", async (req, res) => {
  const { id, ref } = req.body;

  const user = await getUser(id);

  if (ref && ref !== id) {
    const refUser = await getUser(ref);

    refUser.coin += 200;
    refUser.referralCount += 1;

    user.referredBy = ref;

    await refUser.save();
    await user.save();
  }

  res.json({ ok: true });
});

// ================= BOT =================
if (process.env.BOT_TOKEN) {
  bot.start(async (ctx) => {
    const id = ctx.from.id;
    await getUser(id);

    const link = `https://t.me/${ctx.botInfo.username}?start=${id}`;

    ctx.reply(
      `🖤 Salutation
Welcome to Your Castel 🍷

Invite:
${link}`,
      Markup.inlineKeyboard([
        [Markup.button.webApp("ENTER WORLD 🖤", WEBAPP_URL)]
      ])
    );
  });

  bot.command("profile", async (ctx) => {
    const u = await getUser(ctx.from.id);

    ctx.reply(
      `🧛 PROFILE

💰 Coin: ${u.coin}
🥈 Silver: ${u.silver}
🧬 HP: ${u.hp}
🧥 Chrome Level: ${u.chromeLevel}
👥 Ref: ${u.referralCount}`
    );
  });

  bot.launch();
}

// ================= SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🟢 SERVER RUNNING ON PORT", PORT);
});