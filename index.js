const mineflayer = require('mineflayer');
const utils = require('./utils');
const chalk = require('chalk');
const fs = require('fs');

mineflayer.multiple = async (bots, constructor) => {
  const { Worker, isMainThread, workerData } = require('worker_threads');
  if (isMainThread) {
    const threads = [];
    for (const i in bots) {
      await utils.sleep(6000);
      threads.push(new Worker(__filename, { workerData: bots[i] }));
    }
  } else {
    constructor(workerData);
  }
};

const accounts = [];
const accountFile = 'accounts.txt';
const accountsFileData = fs.readFileSync(accountFile, 'utf8');
for (const account of accountsFileData.split('\r\n')) {
  const splitted = account.split(':');
  if (splitted.length === 4) {
    accounts.push({ username: splitted[0], pass: splitted[1], home: splitted[2], auth: splitted[3] });
  }
}

const bot_creator = ({ username, pass, home, auth }) => {
  let bot = mineflayer.createBot({
    username,
    host: 'stardix.com',
    port: 25565,
    checkTimeoutInterval: 60000,
    version: '1.8.9',
    auth,
    password: pass,
    home
  });

  // Variáveis
  bot.location = 'unknown';
  bot.isRestarting = false;
  bot.disconnected = false;

  // Eventos
  bot.once('login', async () => console.log(chalk.magenta.bold(`Conectando > ${username}`)));

  bot.on('spawn', async () => {
    await utils.sleep(1500);
    await utils.getLocation(bot, home, async () => {
      if (bot.location === 'home') {
        console.log(chalk.green(`[${username}] chegou na home (/pw${home})`));
      }
    });
  });

  bot.on('message', async (message) => {
    console.log(message.toAnsi());
    if (message.toString().includes('Por favor, faça o login')) bot.chat(`/login ${pass}`);
    else if (message.toString().startsWith('Servidor está reiniciando') || message.toString().includes('O servidor está iniciando...')) {
      console.log(chalk.cyan(`Servidor reiniciando, desconectando: ${bot.username}`));
      bot.isRestarting = true;
      bot.quit();
    }
  });

  bot.on('end', async (reason) => {
    if (reason.includes('quit') && bot.isRestarting) {
      bot.removeAllListeners();
      bot._client.removeAllListeners();
      utils.log(`${username} aguardando 5 min para reconectar`, 'magenta');
      await utils.sleep(60000 * 5);
      bot.isRestarting = false;
      bot_creator({ username, pass, home, auth });
    } else if (reason.includes('quit') && bot.disconnected) {
      console.log(chalk.yellow(`${username} desconectado manualmente`));
    } else {
      bot.removeAllListeners();
      bot._client.removeAllListeners();
      utils.log(`${username} foi desconectado, reconectando...`, 'red');
      await utils.sleep(7500);
      bot_creator({ username, pass, home, auth });
    }
  });
};

mineflayer.multiple(accounts, bot_creator);
