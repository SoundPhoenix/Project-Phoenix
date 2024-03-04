import { ApplicationCommandData, CommandInteraction, MessageEmbed, PermissionString } from 'discord.js';
import jwt from 'jsonwebtoken';
import qs from 'qs';
import db from '../models/db';
import { EventData } from '../models/internal-models';
import { getRatingLevel, RATINGS_ROLES_MAP } from '../models/tc-models';
import { Env, HttpService } from '../services';
import { MessageUtils } from '../utils';
import { Command } from './command';
let Config = require('../../config/config.json');

export class VerifyCommand implements Command {
    public metadata: ApplicationCommandData = {
        name: 'verify',
        description: 'Verify that you are Topcoder member and earn Grey Rated role.'
    };
    public ephemeral = true;
    public requireDev = false;
    public requireGuild = false;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        // Exclude bots from verify
        if (intr.user.bot) {
            await MessageUtils.sendIntr(intr, 'Bots can\'t verify');
            return;
        }
        // Check if member alredy verified?
        const userId = intr.user.id;
        const m = await db.Member.findByPk(userId);
        if (m !== null) {
            const guild = intr.client.guilds.cache.get(Env.serverID);
            const member = await guild.members.fetch(userId);
            // get member info from TC members API
            const https = new HttpService();
            const tcAPI = await https.get(
                `https://api.topcoder${Env.nodeEnv === 'development' ? '-dev' : ''}.com/v5/members/${m.tcHandle}`,
                ''
            ).then(r => r.json());
            // prepare rating role that should be set to this member
            // set all to gray rated by default
            let ratingRole = Env.grayRatedRoleID;
            if (tcAPI.maxRating && tcAPI.maxRating.rating) {
                // sometimes no rating available from TC API
                ratingRole = RATINGS_ROLES_MAP[getRatingLevel(tcAPI.maxRating.rating)];
            }
            // Set member nickname to TC handle
            await member.setNickname(m.tcHandle);
            // member roles
            const roles = Env.verifyRoleID.split(',');
            roles.push(ratingRole);
            await member.roles.add(roles);
            if (member.roles.cache.has(Env.guestRoleID)) {
                await member.roles.remove(Env.guestRoleID);
            }
            await MessageUtils.sendIntr(intr, `Hey @${intr.user.username}, you already verified yourself. Thank You!`);
            return;
        }
        // If here procceed with verification
        const token = jwt.sign({
            exp: Math.floor(Date.now() / 1000) + (60 * 5), // 5min
            data: {
                userId: intr.user.id
            }
        }, Env.token);
        const retUrl = encodeURIComponent(`${Env.discordVerifyUserWebhook}?discord=${token}`);
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('CLICK HERE TO VERIFY')
            .setURL(`https://accounts-auth0.topcoder${Env.nodeEnv === 'development' ? '-dev' : ''}.com/?retUrl=${retUrl}&mode=signIn&${qs.stringify({ ...Config.UTMs, 'utm_campaign': 'verify-members' })}`)
            .setDescription('You will be sent to Topcoder authentication page where you need to either login or register. Once done, we will send you back to discord and complete the verification process.');

        await MessageUtils.sendIntr(intr, embed);
    }
}
