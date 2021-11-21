import { Command } from "../../../client/";
import { cpus, platform, totalmem, uptime } from "os";
import { ApplyOptions } from "@sapphire/decorators";
import { version } from "../../../../package.json";
import { memoryUsage } from "process";
import type { Message } from "discord.js";
import ms from "ms";

@ApplyOptions<Command.Options>({
	name: "info",
	aliases: ["botinfo"],
	description: "Information about this bot",
	requiredClientPermissions: ["EMBED_LINKS"]
})
export default class extends Command {
	public async messageRun(message: Message): Promise<void> {
		const core = cpus()[0];
		await message.reply({
			embeds: [
				this.client.utils
					.embed()
					.setTitle(`Bot Info: ${this.client.user?.tag}`)
					.setFields([
						{
							name: "• Bot Information",
							value: `\`\`\`Uptime: ${ms(this.client.uptime ?? 0, {
								long: true
							})}\nVersion: v${version}\`\`\``
						},
						{
							name: "• System Information",
							value: `\`\`\`System Platform: ${platform()}\nSystem Uptime: ${ms(uptime() * 1e3, {
								long: true
							})}\`\`\``
						},
						{
							name: "• Cpu Information",
							value: `\`\`\`${[
								core.model,
								cpus()
									.map((data, i) => `${(i + 1).toString().padStart(2, "0")} - ${(data.times.sys / 1e6).toFixed(2)}%`)
									.join("\n")
							].join("\n")}\`\`\``
						},
						{
							name: "• Memory Usage",
							value: `\`\`\`${[
								`Total Memory: ${this.client.utils.formatBytes(totalmem())}`,
								`Used Memory: ${this.client.utils.formatBytes(memoryUsage().heapUsed)}`
							].join("\n")}\`\`\``
						}
					])
			]
		});
	}
}