import { ApplicationCommandOptionType } from 'discord-api-types';
import {
    ApplicationCommandData,
    CommandInteraction,
    MessageEmbed,
    PermissionString,
} from 'discord.js';
import qs from 'qs';

import { EventData } from '../models/internal-models';
import { Env } from '../services/env';
import { HttpService } from '../services/http-service';
import { MessageUtils } from '../utils';
import { Command } from './command';
let Config = require('../../config/config.json');

const contentful = require('contentful');
const client = contentful.createClient({
    space: Env.contentfulSpaceID,
    accessToken: Env.contentfulCDNKey
});

export class LeaderboardCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: 'leaderboard',
        description: 'View current TCO leaderboards.',
        options: [
            {
                name: 'leaderboard',
                description: 'Type of leaderboard to display.',
                required: true,
                type: ApplicationCommandOptionType.String.valueOf(),
                choices: [
                    {
                        name: 'Algo',
                        value: 'Algorithm',
                    },
                    {
                        name: 'Dev',
                        value: 'Development',
                    },
                    {
                        name: 'F2F',
                        value: 'F2F',
                    },
                    {
                        name: 'MM',
                        value: 'Marathon',
                    },
                    {
                        name: 'QA',
                        value: 'QA',
                    },
                    {
                        name: 'Design',
                        value: 'Design',
                    },
                    {
                        name: 'Dev Copilot',
                        value: 'Dev_copilot',
                    },
                    {
                        name: 'Design Copilot',
                        value: 'Design_copilot',
                    },
                    {
                        name: 'Data Science Copilot',
                        value: 'DS_copilot',
                    },
                    {
                        name: 'QA Copilot',
                        value: 'QA_copilot',
                    }
                ],
            },
        ],
    };
    public requireDev = false;
    public requireGuild = false;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let leaderboard = intr.options.getString('leaderboard');

        const entryRsp = await client.getEntry('5HmoppBlc79RfxOwb8JAls');
        const entry = entryRsp.fields.props[leaderboard];
        const https = new HttpService();
        const dataLookerRsp = await https.get(entry.api, '');
        const dataLook = await dataLookerRsp.json();
        const fields = [
            { name: 'Rank', value: '------', inline: true },
            { name: 'Handle', value: '---------', inline: true },
            { name: 'Points', value: '--------', inline: true }
        ];

        dataLook.slice(0, 5).forEach((record, indx) => {
            fields.push({ name: '\u200B', value: (indx + 1) + '', inline: true });
            fields.push({ name: '\u200B', value: `[${record['member_profile_basic.handle']}](https://topcoder.com/members/${record['member_profile_basic.handle']})`, inline: true });
            fields.push({ name: '\u200B', value: record['tco_leaderboard.tco_points'] + '', inline: true });
        });

        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`${entry.stageText} - ${entry.selectText} ${entry.titleText}`)
            .setURL(`${entry.leaderboardUrl}&${qs.stringify({ ...Config.UTMs, 'utm_campaign': 'discord-to-platform' })}`)
            .addFields(fields)
            .setImage('https://images.ctfassets.net/b5f1djy59z3a/5IJ8vYa6HHJV2aMpl83eyG/5ca3e0a83792ec0ad0a588bcc63b1a9d/D561D764-FFF8-43DF-AA52-660A42A3A001.svg?fm=png')
            .setFooter({ text: 'TCO - WHERE OUR VIRTUAL COMMUNITY BECOMES REALITY.' });

        await MessageUtils.sendIntr(intr, embed);
    }
}
