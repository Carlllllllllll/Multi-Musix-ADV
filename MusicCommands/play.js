const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The song to play')
                .setRequired(true)),
    async execute(interaction, client) {
        const query = interaction.options.getString('query');

        const player = client.riffy.createConnection({
            guildId: interaction.guild.id,
            voiceChannel: interaction.member.voice.channel.id,
            textChannel: interaction.channel.id,
            deaf: true
        });

        const resolve = await client.riffy.resolve({ query: query, requester: interaction.user });
        const { loadType, tracks, playlistInfo } = resolve;

        if (loadType === 'playlist') {
            for (const track of resolve.tracks) {
                track.info.requester = interaction.user;
                player.queue.add(track);
            }
            const embed = new EmbedBuilder()
                .setAuthor({
                    name: 'Added To Queue',
                    iconURL: 'https://cdn.discordapp.com/attachments/1156866389819281418/1157218651179597884/1213-verified.gif?ex=6517cf5a&is=65167dda&hm=cf7bc8fb4414cb412587ade0af285b77569d2568214d6baab8702ddeb6c38ad5&',
                    url: 'https://discord.gg/xQF9f9yUEM'
                })
                .setDescription(`**Playlist Name : **${playlistInfo.name} \n**Tracks : **${tracks.length}`)
                .setColor('#14bdff')
                .setFooter({ text: 'Use queue command for more Information' });
            await interaction.reply({ embeds: [embed] });
            if (!player.playing && !player.paused) return player.play();

        } else if (loadType === 'search' || loadType === 'track') {
            const track = tracks.shift();
            track.info.requester = interaction.user;
            player.queue.add(track);

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: 'Added To Queue',
                    iconURL: 'https://cdn.discordapp.com/attachments/1156866389819281418/1157218651179597884/1213-verified.gif?ex=6517cf5a&is=65167dda&hm=cf7bc8fb4414cb412587ade0af285b77569d2568214d6baab8702ddeb6c38ad5&',
                    url: 'https://discord.gg/xQF9f9yUEM'
                })
                .setDescription(`**${track.info.title}** has been queued up and is ready to play!`)
                .setColor('#14bdff')
                .setFooter({ text: 'Use queue command for more Information' });
            await interaction.reply({ embeds: [embed] });

            if (!player.playing && !player.paused) return player.play();
        } else {
            await interaction.reply({ content: `No results found for ${query}`, ephemeral: true });
        }
    }
};
