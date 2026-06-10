import { watchFile, unwatchFile } from 'fs';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// ─── Owner ────────────────────────────────────────────────────────────────────
global.pairingNumber = ;
global.owner = [
  ['33759850405',  'ℝ𝕀𝕆𝕄𝔼ℕ', true],
  ['212773608927', 'ℝ𝕀𝕆𝕄𝔼ℕ', true],
];

// ─── Bot Info ─────────────────────────────────────────────────────────────────
global.namebot  = 'ℝ𝕀𝕆𝕄𝔼ℕ';
global.author   = 'ℝ𝕀𝕆𝕄𝔼ℕ';
global.prefix   = '.';
global.source   = 'https://github.com/sunooiox-glitch/RIOMEN-BOT';

// ─── Messages ─────────────────────────────────────────────────────────────────
global.wait  = '⏳ *Loading...* | جاري التحميل';
global.eror  = '❌ *Error!* | وقع خطأ';
global.done  = '✅ *Done!* | تم بنجاح';

// ─── Sticker ──────────────────────────────────────────────────────────────────
global.stickpack = global.namebot;
global.stickauth = global.author;

// ─── Emoji ────────────────────────────────────────────────────────────────────
global.emoji = {
    owner:    '👑',
    admin:    '🛡️',
    member:   '👤',
    bot:      '🤖',
    success:  '✅',
    error:    '❌',
    loading:  '⏳',
    download: '📥',
    sticker:  '🖼️',
    music:    '🎵',
    video:    '🎬',
};

// ─── Auto Reload ──────────────────────────────────────────────────────────────
let file = fileURLToPath(import.meta.url);
watchFile(file, () => {
    unwatchFile(file);
    console.log(chalk.redBright("♻️ config.js updated!"));
    import(`${file}?update=${Date.now()}`);
});
