import './config.js';
import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import chalk from 'chalk';
import express from 'express';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Keep-alive Server ────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (_, res) => res.send(`🤖 ${global.namebot} is running!`));
app.listen(PORT, () => console.log(chalk.cyan(`🌐 Server on port ${PORT}`)));

// ─── Load Plugins ─────────────────────────────────────────────────────────────
const plugins = new Map();

async function loadPlugins() {
    const dir = join(__dirname, 'plugins');
    const files = readdirSync(dir).filter(f => f.endsWith('.js'));
    for (const file of files) {
        const mod = await import(`./plugins/${file}`);
        const plugin = mod.default;
        if (plugin?.commands) {
            for (const cmd of plugin.commands) {
                plugins.set(cmd, plugin);
            }
            console.log(chalk.green(`🔌 Loaded: ${file}`));
        }
    }
    console.log(chalk.cyan(`✅ ${plugins.size} commands loaded!`));
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function isOwner(jid) {
    const num = jid.replace(/[^0-9]/g, '');
    return global.owner.some(([n]) => n === num);
}

function getBody(msg) {
    return msg.message?.conversation
        || msg.message?.extendedTextMessage?.text
        || msg.message?.imageMessage?.caption
        || msg.message?.videoMessage?.caption
        || msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson
        || '';
}

function getSelectedId(msg) {
    try {
        const params = msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
        if (params) {
            const parsed = JSON.parse(params);
            return parsed?.id || parsed?.display_text || '';
        }
    } catch {}
    return '';
}

// ─── Start Bot ────────────────────────────────────────────────────────────────
async function startBot() {
    await loadPlugins();

    const { state, saveCreds } = await useMultiFileAuthState('./sessions');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        browser: Browsers.ubuntu('Chrome'),
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        generateHighQualityLinkPreview: true,
    });

    // ── Pairing Code ─────────────────────────────────────────────────────────
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            const code = await sock.requestPairingCode(String(global.pairingNumber));
            console.log(chalk.yellow(`\n🔑 Pairing Code: ${code}\n`));
        }, 3000);
    }

    // ── Connection ───────────────────────────────────────────────────────────
    sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'close') {
            const shouldReconnect = new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red('🔌 Disconnected!'));
            if (shouldReconnect) {
                console.log(chalk.yellow('🔄 Reconnecting...'));
                startBot();
            }
        } else if (connection === 'open') {
            console.log(chalk.green(`\n✅ ${global.namebot} Connected!\n`));
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // ── Messages ─────────────────────────────────────────────────────────────
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message) continue;
            if (msg.key.fromMe) continue;

            const from = msg.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            const sender = isGroup ? msg.key.participant : from;
            const owner = isOwner(sender);
            const body = getBody(msg);
            const selectedId = getSelectedId(msg);

            // ── Button Response ───────────────────────────────────────────────
            if (selectedId) {
                console.log(chalk.magenta(`🔘 Button: ${selectedId}`));
                const plugin = plugins.get(selectedId);
                if (plugin) {
                    try {
                        await plugin.execute(sock, msg, { from, sender, args: [], isGroup, owner, body });
                    } catch (err) {
                        console.error(chalk.red('❌ Error:'), err);
                    }
                }
                continue;
            }

            // ── Text Commands ─────────────────────────────────────────────────
            if (!body.startsWith(global.prefix)) continue;

            const args = body.slice(global.prefix.length).trim().split(/\s+/);
            const command = args.shift().toLowerCase();

            console.log(chalk.cyan(`📩 ${command} | from: ${sender}`));

            const plugin = plugins.get(command);

            if (!plugin) {
                await sock.sendMessage(from, {
                    text: `❓ Unknown command: *${command}*\nType *${global.prefix}menu ar* or *${global.prefix}menu en*`
                }, { quoted: msg });
                continue;
            }

            if (plugin.ownerOnly && !owner) {
                await sock.sendMessage(from, { text: '⛔ *Owner only!*' }, { quoted: msg });
                continue;
            }

            try {
                await plugin.execute(sock, msg, { from, sender, args, isGroup, owner, body });
            } catch (err) {
                console.error(chalk.red('❌ Error:'), err);
                await sock.sendMessage(from, { text: global.eror }, { quoted: msg });
            }
        }
    });
}

startBot();
