const { Task } = require('klasa')

module.exports = class extends Task {
  constructor (...args) {
    super(...args, { name: 'notifier', enabled: true })
  }

  // Checks for each guild if it has tasks due for
  // "tomorrow", if yes, sends a notification
  // to the appropriate channel.
  async run () {
    this.client.guilds.forEach(async (guild) => {
      // if there is a configuredchannel
      const channelId = guild.settings.channels.notifications
      if (!channelId) return

      // if the channel is valid
      const channel = guild.channels.find(channel => channel.id === channelId)
      if (!channel) return

      // gets tasks for tomorrow
      const embed = this.client.funcs.getNotificationEmbed(this.client, channel)
      if (!embed) return

      // if bot's last msg is already a notification: delete & post new one
      // otherwise, do nothing but posting the new one
      await channel.messages.fetch({ limit: 2 }).then(async (messages) => {
        let msg = messages.first()
        if (msg && msg.author.id === this.client.user.id) {
          await msg.delete().catch(err => this.client.console.error(err))
          msg = messages.first(2)[1]
          if (msg && msg.author.id === this.client.user.id) {
            await msg.delete().catch(err => this.client.console.error(err))
          }
        }
      })

      const roleId = guild.settings.roles.notify
      if (roleId) {
        const role = guild.roles.find(role => role.id === roleId)
        channel.send(`${role.toString()}`)
      } else {
        channel.send(`Notification time ! (vous pouvez configurer un rôle à tag via \`%conf role notif @notification\`)`)
      }

      channel.send(embed)
      this.client.console.log(`Sent a notification for guild ${channel.guild.name} (${channel.guild.id})`)
    })
  }
}
