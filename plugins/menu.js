import { Button } from '../lib/MessageBuilder.js';

export default {
    commands: ['menu', 'help', 'start'],

    async execute(sock, msg, { from, args }) {
        const lang = args[0]?.toLowerCase();

        if (!lang || (lang !== 'en' && lang !== 'ar')) {
            await sock.sendMessage(from, {
                text: `🌍 *Choose Language | اختر اللغة*\n\n• *.menu en* — 🇬🇧 English\n• *.menu ar* — 🇸🇦 العربية`
            }, { quoted: msg });
            return;
        }

        const isAr = lang === 'ar';

        const btn = new Button(sock)
            .setImage('https://i.imgur.com/your-bot-image.jpg')
            .setTitle(isAr ? '『 قائمة الأوامر 🍷 』' : '『 Commands Menu 🍷 』')
            .setBody(
                isAr
                ? `*( 🌹 | الأقسام الرئيسية | 🌹 )*\n\n> 𝙊𝙬𝙣𝙚𝙧 : ${global.author}\n> 𝘽𝙤𝙩 : ${global.namebot}`
                : `*( 🌹 | Main Sections | 🌹 )*\n\n> 𝙊𝙬𝙣𝙚𝙧 : ${global.author}\n> 𝘽𝙤𝙩 : ${global.namebot}`
            )
            .setFooter(isAr ? 'اختر قسماً 📋' : 'Choose a section 📋')
            .addSelection(isAr ? 'اختر القسم' : 'Choose Section')
            .makeSection(isAr ? '🌹 الأقسام الرئيسية' : '🌹 Main Sections')
            .makeRow('', isAr ? '⌁ ـ قسم الملصقات ،،⌁'         : '⌁ Sticker Section ،،⌁',  isAr ? '🖼️ قسم الملصقات'  : '🖼️ Sticker',  'menu_sticker')
            .makeRow('', isAr ? '⌁ ـ قسم التحميل ،،⌁'          : '⌁ Download Section ،،⌁', isAr ? '📥 قسم التحميل'   : '📥 Download', 'menu_download')
            .makeRow('', isAr ? '⌁ ـ قسم الذكاء الاصطناعي ،،⌁' : '⌁ AI Section ،،⌁',       isAr ? '🧠 الذكاء'        : '🧠 AI',        'menu_ai')
            .makeRow('', isAr ? '⌁ ـ قسم الترفيه ،،⌁'          : '⌁ Fun Section ،،⌁',      isAr ? '🎮 الترفيه'       : '🎮 Fun',       'menu_fun')
            .makeRow('', isAr ? '⌁ ـ قسم المجموعة ،،⌁'         : '⌁ Group Section ،،⌁',    isAr ? '👥 المجموعة'      : '👥 Group',     'menu_group')
            .makeRow('', isAr ? '⌁ ـ قسم المالك ،،⌁'           : '⌁ Owner Section ،،⌁',    isAr ? '👑 المالك'        : '👑 Owner',     'menu_owner');

        await btn.send(from, { quoted: msg });
    }
};
