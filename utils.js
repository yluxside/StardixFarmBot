const dayjs = require('dayjs');
const chalk = require('chalk'); // Adicionado

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function enterRankup(bot) {
    if (bot.currentWindow) bot.closeWindow(bot.currentWindow);
    bot.setQuickBarSlot(0);
    bot.activateItem();

    bot.once('windowOpen', async (window) => {
        if (window.title.includes('Modos de Jogo')) {
            log(`Janela identificada: 'Modos de Jogo'`, 'grey');
            await bot.clickWindow(11, 0, 0);
        }
    });

    await sleep(3000);
    if (bot.currentWindow?.title?.includes('Modos de Jogo')) {
        console.log('Não entrou no rankup?');
        enterRankup(bot);
    }
}

async function getLocation(bot, home, cb) {
    const onMessage = async (message) => {
        if (message.includes('Teletransportado com sucesso')) {
            log(`${bot.username} chegou na home com sucesso!`, 'green');
            bot.location = 'home';
            bot.removeListener('messagestr', onMessage);
        } else if (message.includes('Essa warp não')) {
            log(`${bot.username} não conseguiu chegar na home`, 'red');
            bot.removeListener('messagestr', onMessage);
        }
    };

    let coords = bot.entity.position;
    if (Math.trunc(coords.z) === 0 || Math.trunc(coords.z) === -2 && Math.trunc(coords.x) === 0) {
        const block = bot.blockAt(bot.entity.position.offset(0, -1, 0));
        if (!block) return;
        if (block.name === 'planks') {
            bot.location = 'lobby';
            console.log('Lobby identificado');
            await enterRankup(bot);
        } else if (block.name === 'piston') {
            bot.location = 'rankup';
            console.log('Rankup identificado');
            bot.on('messagestr', onMessage);
            await sleep(500);
            log(`Indo até a home: ${home}`, 'grey');
        }
        cb();
    }
}

async function getCurrentTime() {
    return dayjs().format("HH:mm:ss");
}

async function log(message, color) {
    let time = await getCurrentTime();
    const chalkColors = {
        green: chalk.green,
        red: chalk.red,
        grey: chalk.grey,
        magenta: chalk.magenta,
    };
    const chalkFn = chalkColors[color] || chalk.white;
    console.log(chalkFn(`[${time}] ${message}`));
}

module.exports = {
    sleep,
    log,
    getLocation,
    getCurrentTime,
    enterRankup
};
