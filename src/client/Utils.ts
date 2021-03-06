import {
	AnyChannel,
	AwaitMessageComponentOptions,
	AwaitMessagesOptions,
	ButtonInteraction,
	Channel,
	Collection,
	CommandInteraction,
	DMChannel,
	Emoji,
	Guild,
	GuildChannel,
	GuildMember,
	Interaction,
	Message,
	MessageActionRow,
	MessageAttachment,
	MessageButton,
	MessageComponentInteraction,
	MessageEmbed,
	MessageEmbedOptions,
	Role,
	User,
} from "discord.js";
import Client from "./Client";

export default class Utils {
	constructor(public client: Client) {}

	public embed(options?: MessageEmbedOptions): MessageEmbed {
		return new MessageEmbed({ color: process.env.COLOUR as `#${string}`, ...options });
	}

	public capitalize(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	public async getChannel(id: string): Promise<AnyChannel | null> {
		return typeof id === "string"
			? this._resolve(this.client.channels.cache, id) ||
					(await this.client.channels.fetch(id).catch(() => null))
			: null;
	}

	public async getRole(id: string, guild: Guild) {
		return typeof id === "string" && guild instanceof Guild
			? this._resolve(guild.roles.cache, id) || (await guild.roles.fetch(id).catch(() => null))
			: null;
	}

	public async fetchMember(id: string, guild: Guild) {
		return typeof id === "string" && guild instanceof Guild
			? this._resolve(guild.members.cache, id) || (await guild.members.fetch(id).catch(() => null))
			: null;
	}

	public async fetchUser(id: string) {
		return typeof id === "string"
			? this._resolve(this.client.users.cache, id) ||
					(await this.client.users.fetch(id).catch(() => null))
			: null;
	}

	protected _resolve<T extends GuildMember | User | AnyChannel | Guild | Emoji | Role>(
		cache: Collection<string, T>,
		id: string
	): T | null {
		const check = (item: T): boolean => {
			let bool = false;
			if (!(item instanceof Guild)) {
				const reg = this._regex(item);
				const match = id.match(reg);

				bool = (bool || (match && match[1] === item.id)) ?? false;
			}

			if (!(item instanceof Channel && this.isDM(item))) {
				const i = item as User | GuildChannel | Guild | Emoji | Role;
				const name = (i instanceof User ? i.tag : i.name)?.toLowerCase();

				if (name) bool = bool || name === id || name.includes(id);
				else bool = bool ?? false;
			}

			return bool;
		};

		return (
			cache.get(id) ?? cache.find((v) => check(v)) ?? cache.find((v) => v.toString() === id) ?? null
		);
	}

	public isDM(channel: Channel): channel is DMChannel {
		return ["DM", "GROUP_DM"].includes(channel.type);
	}

	protected _regex(item: User | AnyChannel | Emoji | Role | GuildMember): RegExp {
		return item instanceof Emoji
			? /<a?:[a-zA-Z0-9_]+:(\d{17,19})>/
			: item instanceof Channel
			? /<#(\d{17,19})>/
			: item instanceof User || item instanceof GuildMember
			? /<@!?(\d{17,19})>/
			: /<@&(\d{17,19})>/;
	}

	public pagination(
		interaction: CommandInteraction,
		pages: MessageEmbed[],
		buttons: MessageButton[],
		timeout = 12e4,
		pageNumber = 1
	) {
		let page = pageNumber;
		if (!interaction.channel) return;

		const ids = buttons.map((c) => c.customId);
		const filter = (i: Interaction) =>
			i.isButton() && i.inGuild() && i.guildId === interaction.guildId && ids.includes(i.customId);
		const collector = interaction.channel.createMessageComponentCollector({
			time: timeout,
			filter,
		});

		collector.on("collect", async (buttonInteraction: ButtonInteraction) => {
			switch (buttonInteraction.customId) {
				case ids[0]:
					page = page === 1 ? pages.length : page - 1;
					break;
				case ids[2]:
					page = page === pages.length ? 1 : page + 1;
					break;
				case ids[1]:
					await interaction.deleteReply().catch(() => void 0);
					collector.stop("deleted");
					break;
				default:
					break;
			}

			await buttonInteraction.deferUpdate().catch(() => void 0);
			await interaction
				.editReply({
					embeds: [
						pages[page - 1].setFooter({
							text: this.client.languageHandler.translate(
								interaction.guildId,
								"music:queue.embed.footer",
								{
									page,
									maxPages: pages.length,
								}
							),
						}),
					],
				})
				.catch(() => void 0);
		});

		collector.on("end", (_, reason) => {
			if (reason === "deleted") return;

			const disabledRow = new MessageActionRow().addComponents(
				buttons[0].setDisabled(true),
				buttons[1].setDisabled(true),
				buttons[2].setDisabled(true)
			);

			interaction
				.editReply({
					embeds: [
						pages[page - 1].setFooter({
							text: this.client.languageHandler.translate(
								interaction.guildId,
								"music:queue.embed.footer",
								{
									page,
									maxPages: pages.length,
								}
							),
						}),
					],
					components: [disabledRow],
				})
				.catch(() => void 0);
		});
	}

	public async awaitComponent(
		message: Message,
		options: AwaitMessageComponentOptions<MessageComponentInteraction> = { time: 6e4 }
	): Promise<MessageComponentInteraction | null> {
		options = { time: 6e4, ...options };
		const coll = await message.awaitMessageComponent(options).catch(() => null);

		return coll;
	}

	public async awaitMessages(
		message: Message,
		options: AwaitMessagesOptions = { time: 6e4, errors: ["time"], max: 1 }
	): Promise<Collection<string, Message>> {
		options = { time: 6e4, errors: ["time"], max: 1, ...options };
		const coll = await message.channel
			.awaitMessages(options)
			.catch(() => new Collection<string, Message>());

		return coll;
	}

	public trimArray(arr: Array<string>, maxLen = 10): string[] {
		if (arr.length > maxLen) {
			const len = arr.length - maxLen;
			arr = arr.slice(0, maxLen);
			arr.push(`${len} more...`);
		}
		return arr;
	}

	public formatBytes(bytes: number): string {
		if (bytes === 0) return "0 Bytes";
		const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
	}

	public getAttachments(attachments: Collection<string, MessageAttachment>): string[] {
		const valid = /^.*(gif|png|jpg|jpeg|mp4|mp3|pdf|psd)$/g;

		return attachments
			.filter((attachment) => valid.test(attachment.url))
			.map((attachment) => attachment.url);
	}
}
