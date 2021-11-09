import { Args as CommandArgs, CommandContext, PieceContext, UserError } from "@sapphire/framework";
import { SubCommandPluginCommand } from "@sapphire/plugin-subcommands";
import type { PermissionResolvable } from "discord.js";
import { Logger } from "..";
import type { Client } from "../../../";

export abstract class Command extends SubCommandPluginCommand<CommandArgs, Command> {
	public readonly hidden: boolean;
	public readonly OwnerOnly: boolean;
	public readonly usage: string;

	public readonly cooldown: number;
	public readonly cooldownLimit: number;

	public readonly permissions: PermissionResolvable;
	public readonly clientPermissions: PermissionResolvable;

	public client: Client;
	public logger = new Logger({ name: "Bot" });

	public constructor(context: PieceContext, options: Command.Options) {
		super(context, {
			cooldownDelay: 5e3,
			cooldownLimit: 2,
			generateDashLessAliases: true,
			...options
		});

		if (!options.name) this.logger.warn(`No name provided for command with aliases "${this.aliases.join('", "')}"`);

		this.usage = `${options.name} ${options.usage ?? ""}`.trim();

		this.hidden = options.hidden ?? false;
		this.OwnerOnly = options.preconditions?.includes("OwnerOnly") ?? false;

		this.cooldown = options.cooldownDelay ?? 5e3;
		this.cooldownLimit = options.cooldownLimit ?? 2;

		this.permissions = options.requiredUserPermissions ?? [];
		this.clientPermissions = options.requiredClientPermissions ?? [];

		this.client = this.container.client as Client;
	}

	protected error(identifier: string | UserError, context?: unknown): never {
		throw typeof identifier === "string" ? new UserError({ identifier, context }) : identifier;
	}

	protected parseConstructorPreConditions(options: Command.Options): void {
		super.parseConstructorPreConditions(options);
		this.parseExtraPreConditions();
	}

	protected parseExtraPreConditions(): void {
		this.preconditions.append("Blacklisted");
	}
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Command {
	export type Options = SubCommandPluginCommand.Options & {
		hidden?: boolean;
		usage?: string;
		permissions?: PermissionResolvable;
	};

	export type Context = CommandContext;
	export type Args = CommandArgs;
}
