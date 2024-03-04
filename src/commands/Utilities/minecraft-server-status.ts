import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';
import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';
import axios from 'axios';

// Construct the request URL
const apikey = 'your_api_key_here';
const serverid = 'your_server_id_here';

export class TestCommand implements Command {
    public names = [Lang.getRef('chatCommands.test', Language.Default)];
    public cooldown = new RateLimiter(1, 5000);
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        try {
            const response = await axios.get(`https://ptero.joshsevero.dev/api/client/servers/${serverid}/resources`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apikey}`
                }
            });

            if (response.status === 200) {
                const serverData = response.data;

                // Extract necessary data from serverData
                const currentState = serverData.attributes.current_state;
                const resources = serverData.attributes.resources;

                // Create the embed using the extracted data
                const embedData = {
                    CURRENT_STATE: currentState,
                    MEMORY_BYTES: resources.memory_bytes,
                    CPU_ABSOLUTE: resources.cpu_absolute,
                    DISK_BYTES: resources.disk_bytes,
                    NETWORK_RX_BYTES: resources.network_rx_bytes,
                    NETWORK_TX_BYTES: resources.network_tx_bytes
                };

                // Send the embed
                await InteractionUtils.send(
                    intr,
                    Lang.getEmbed('displayEmbeds.pterosrvstats', data.lang, embedData)
                );
            } else {
                console.error(`Failed to fetch data: ${response.statusText}`);
                // Handle the error appropriately
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            // Handle the error appropriately
        }
    }
}
