const { Client, GatewayIntentBits, EmbedBuilder, Collection } = require('discord.js');
const { Riffy } = require('riffy');
const { Classic } = require('musicard');
const fs = require('fs');
const { token } = require('./config.json');
const nodes = [
    {
        host: "lava-v4.ajieblogs.eu.org",
        password: "https://dsc.gg/ajidevserver",
        port: 443,
        secure: true
    },
];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.riffy = new Riffy(client, nodes, {
    send: (payload) => {
        const guild = client.guilds.cache.get(payload.d.guild_id);
        if (guild) guild.shard.send(payload);
    },
    defaultSearchPlatform: "ytmsearch",
    restVersion: "v4"
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.riffy.init(client.user.id);

    const guildId = 'YOUR_GUILD_ID';
    const guild = client.guilds.cache.get(guildId);
    let commands;

    if (guild) {
        commands = guild.commands;
    } else {
        commands = client.application?.commands;
    }

    client.commands.forEach(command => {
        commands?.create(command.data);
    });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.riffy.on("nodeConnect", node => {
    console.log(`Node "${node.name}" connected.`)
});

client.riffy.on("nodeError", (node, error) => {
    console.log(`Node "${node.name}" encountered an error: ${error.message}.`)
});

client.riffy.on("trackStart", async (player, track) => {
    const musicard = await Classic({
        thumbnailImage: track.info.thumbnail,
        backgroundColor: "#070707",
        backgroundImage: "https://cdn.discordapp.com/attachments/1220001571228880917/1220001571690123284/01.png?ex=660d5a01&is=65fae501&hm=a8cfb44844e61aa0fd01767cd363af048df28966c30d7b04a59f27fa45cf69c4&",
        nameColor: "#FF7A00",
        progressColor: "#FF7A00",
        progressBarColor: "#5F2D00",
        progress: 50,
        name: track.info.title,
        author: `By ${track.info.author}`,
        authorColor: "#696969",
        startTime: "0:00",
        endTime: "4:00",
        timeColor: "#FF7A00"
    });

    fs.writeFileSync("musicard.png", musicard);
    const details = `**Title:** ${track.info.title}\n` +
    `**Author:** ${track.info.author}\n` +
    `**Seekable:** ${track.info.seekable}\n` +
    `**Stream:** ${track.info.stream}\n` +
    `**Requester:** ${track.info.requester}\n` +
    `**Source Name:** ${track.info.sourceName}`;

    const musicEmbed = new EmbedBuilder()
        .setColor("#FF7A00")

        .setAuthor({
            name: 'Currently playing a Track',
            iconURL: 'https://cdn.discordapp.com/attachments/1140841446228897932/1144671132948103208/giphy.gif', 
            url: 'https://discord.gg/xQF9f9yUEM'
          })
        .setDescription(details)
        .setImage("attachment://musicard.png");

    const channel = client.channels.cache.get(player.textChannel);
    channel.send({ embeds: [musicEmbed], files: ["musicard.png"] });
});

client.riffy.on("queueEnd", async (player) => {
    const channel = client.channels.cache.get(player.textChannel);
    const autoplay = false;
    if (autoplay) {
        player.autoplay(player)
    } else {
        player.destroy();
        const embed = new EmbedBuilder()
        .setColor('#ffff00')
        .setAuthor({
          name: 'Queue Ended!',
          iconURL: 'https://cdn.discordapp.com/attachments/1230824451990622299/1230824519220985896/6280-2.gif?ex=6641e8a8&is=66409728&hm=149efc9db2a92eb90c70f0a6fb15618a5b912b528f6b1dcf1b517c77a72a733a&',
          url: 'https://discord.gg/xQF9f9yUEM'
        })
          .setDescription('**Bye Bye!, No more songs to play...**');
          channel.send({ embeds: [embed] });
      
    }
});

client.on("raw", (d) => {
    client.riffy.updateVoiceState(d);
});

client.login(token);
