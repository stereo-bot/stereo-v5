import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction, VoiceChannel } from "discord.js";
import { Command } from "../../../client";

@ApplyOptions<Command.Options>({
	name: "forceskip",
	preconditions: ["GuildOnly"],
	description: "Forceskips the current song",
	tDescription: "music:forceskip.description",
	cooldownDelay: 5e3,
	cooldownLimit: 1,
	musicPermissions: ["FORCE_SKIP_SONGS"],
	chatInputCommand: {
		register: true,
		messageCommand: true
	}
})
export default class extends Command {
	public async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.inGuild()) return;

		const player = this.client.manager.get(interaction.guildId);
		if (!player) {
			await interaction.reply(this.translate.translate(interaction.guildId, "MusicGeneral:noPlayer"));
			return;
		}

		const state = interaction.guild?.voiceStates.cache.get(interaction.user.id);
		if (player.channels.voice && state?.channelId !== player.channels.voice) {
			await interaction.deferReply();
			const channel = (await this.client.utils.getChannel(player.channels.voice)) as VoiceChannel;
			await interaction.followUp(
				this.translate.translate(interaction.guildId, "MusicGeneral:vc.wrong", {
					voice: channel.name
				})
			);

			return;
		}

		if (!player.queue.current) {
			await interaction.reply(this.translate.translate(interaction.guildId, "MusicGeneral:noTrack"));
			return;
		}

		player.skip();
		await interaction.reply(this.translate.translate(interaction.guildId, "MusicGeneral:skip"));
	}
}