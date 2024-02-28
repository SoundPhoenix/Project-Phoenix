import { ButtonInteraction } from 'discord.js';
import { EventData } from '../models/internal-models.js';
export interface Button {
    ids: string[];
    deferType: ButtonDeferType;
    requireGuild: boolean;
    requireEmbedAuthorTag: boolean;
    execute(intr: ButtonInteraction, data: EventData): Promise<void>;
}
export declare enum ButtonDeferType {
    REPLY = "REPLY",
    UPDATE = "UPDATE",
    NONE = "NONE"
}
