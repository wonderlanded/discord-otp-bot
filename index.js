const Discord = require('discord.js');
const qrcode = require('qrcode')
const speakeasy = require('speakeasy')
const fs = require('fs')
const gg = [ ]
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
  if (msg.content === 'otpgen') {
    if(gg.includes(msg.author.id)) return
    else gg.push(msg.author.id)
    let s = speakeasy.generateSecret({
        length: 20,
        name: msg.author.tag,
        issuer: msg.author.id
    })
    let url = speakeasy.otpauthURL({
        secret: s.ascii,
        issuer: 'SEXY WONDER',
        label: 'SEXY LABEL',
        algorithm: 'sha512',
        period: 300
    })
    await msg.channel.send(url, new Discord.MessageAttachment(await qrcode.toBuffer(url)))
    msg.reply(`위 QR코드를 OTP에 등록하고, 5분이내에 인증코드 6자리를 입력해주세요.`)
    console.log(`${msg.author.tag}: ${s.base32}`)
    const collector = await msg.channel.createMessageCollector(m=> m.author.id === msg.author.id && msg.content.length === 6 , { time: 300000 })
    collector.on('collect', m => {
      let res = speakeasy.totp.verify({
        secret: s.base32,
        encoding: 'base32',
        token: m.content
      })

      if(res) {
        let json = JSON.parse(fs.readFileSync('./data.json').toString())
        json[msg.author.id] = s.base32
        fs.writeFileSync('./data.json', JSON.stringify(json))
        m.reply('OK')
        collector.stop('ok')
      }
    })

    collector.on('end', ( c, r ) => {
      if(r!=='ok') msg.reply('timeout')
    })
  } else if (msg.content.startsWith('verify')) {
    let json = JSON.parse(fs.readFileSync('./data.json').toString())
    if(!json[msg.author.id]) return msg.reply('FUCK U')
    const verified = speakeasy.totp.verify({
      secret: json[msg.author.id],
      encoding: 'base32',
      token: msg.content.replace('verify ', '')
    })
    return msg.reply(verified ? 'OK' : 'FUCKOFF')
  }
});

client.login('');