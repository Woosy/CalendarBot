const { Command } = require('klasa')
const { MessageEmbed } = require('discord.js')
const fs = require('fs')
const path = require('path')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      runIn: ['text', 'dm'],
      permissionLevel: 0,
      requiredPermissions: ['USE_EXTERNAL_EMOJIS'],

      aliases: ['commandes', 'commands', 'commande', 'cmds', 'cmd', 'aide', 'halp', 'h'],
      usage: '[command:str]',
      description: 'Affiche la liste des commandes du bot',
      extendedHelp: "La commande help supporte 1 argument facultatif. Si aucun argument n'est renseigné, le bot renverra la liste complète des commandes disponibles. Sinon, si l'argument est une commande (ou un alias), vous obtiendrez la description complète de la commande.",

      cooldown: 5
    })
    this.usageCustom = '%help <command>'
    this.example = '%help task'
  }

  async run (message, [command]) {
    // if the first argument is a command that exists
    // we display the help of this command:
    if (command) {
      // if there are arguments but they are not a valid command
      const cmd = this.client.commands.get(command)
      if (!cmd) return message.reply(`commande **%${command}** introuvable... Tapez \`%help\` pour afficher la liste des commandes.`)

      const embed = new MessageEmbed()
        .setColor('#3586ff')
        .setTitle(`Commande %${command}`)
        .setDescription(cmd.extendedHelp)
        .addField('Utilisation', cmd.usageCustom, true)
        .addField('Exemple', cmd.example, true)
        .addField('Aliases', `\`${getAliases(cmd)}\``, false)
        .setTimestamp()
        .setFooter(this.client.user.username, this.client.user.displayAvatarURL())
      return message.channel.send(embed)
    }

    // if no argument:
    // display a list of all commands
    const client = this.client
    Promise.all([
      loadCommands(this, client, path.join(__dirname, '../tasks/')),
      loadCommands(this, client, __dirname),
      loadCommands(this, client, path.join(__dirname, '../config/'))
    ]).then(function (responses) {
      const embed = new MessageEmbed()
        .setColor('#3586ff')
        .setTitle('Liste des commandes :')
        .setDescription('Voici la liste des commandes du bot, classées par catégories.')
        .addField('Commandes calendrier :', responses[0])
        .addField('Commandes générales :', responses[1])
        .addField('Commandes configuration :', responses[2])
        .setTimestamp()
        .setFooter(client.user.username, client.user.displayAvatarURL())
      return message.channel.send(embed)
    }).catch(function (errors) {
      throw errors
    })
  }
}

// Function that loops on all commands
// returns a string promise with name + shortDesc to
// build the help message..
function loadCommands (command, client, commandsPath) {
  return new Promise(function (resolve, reject) {
    fs.readdir(commandsPath, (err, files) => { // loops on each folder's file
      if (err) reject(err)

      let jsFiles = files.filter(f => f.split('.').pop() === 'js') // js files count

      // if there are no commands (should not occur)
      if (jsFiles.length <= 0) resolve('Aucune commande...')

      let description = ''
      // for each command
      jsFiles.forEach((f, i) => {
        let command = client.commands.get(f.split('.')[0])
        if (!command.hidden) {
          description += `\`%${client.funcs.beautify(`${command}`, 15)}\` - ${command.description}\n`
        }
      })
      resolve(description)
    })
  })
}

// Function that returns a string with a list
// of aliases from the command passed as a
// parameter with a minimum of formatting
function getAliases (cmd) {
  let string = ''
  cmd.aliases.forEach(alias => {
    string += `, ${alias}`
  })
  return string.substr(2)
}
