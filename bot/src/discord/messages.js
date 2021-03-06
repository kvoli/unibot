import Discord from "discord.js";
import _ from "lodash";
import TurndownService from "turndown";

const turndownService = new TurndownService();

export const StarterMessage = new Discord.MessageEmbed()
  .setTitle("README")
  .setAuthor(
    "Teaching Team",
    "https://cpb-ap-se2.wpmucdn.com/blogs.unimelb.edu.au/dist/6/275/files/2017/09/04_Logo_Vertical-Housed-1abdv7t.jpg"
  )
  .setColor("0xff0000")
  .setDescription(
    "Please read the instructions below for information on how to register your discord account."
  )
  .addFields([
    {
      name: "1. Trigger Authentication",
      value:
        "React with an emoji to this message in order to begin authentication.",
    },
    {
      name: "2. Accept terms of use",
      value:
        "The bot will message you with the rules. Read **all of the terms of use** and then type `AGREE` to acknowledge that you have understood the rules and cheating is bad.",
    },
    {
      name: "3. Enter unimelb student username",
      value:
        "The bot will prompt you with `user=?`, to which you need to respond with `user=your_unimelb_username`. This is so we can email your student email account and verify it's really your student account you wish to link against.",
    },
    {
      name: "4. Check email & enter code",
      value:
        "If all has gone well, you will receive an email from `amcclernon{at}student.unimelb.edu.au`. This email contains an authentication code in the body that you should copy and paste into the DM chat with the bot.",
    },
    {
      name: "5. Done!",
      value:
        "You should now be authenticated and have an additional student role next to your name. Additionally, if you are enrolled in one of the subjects this discord houses - you will also have that role against your name. With both these roles you can interact.",
    },
  ])
  .setFooter(
    "For any issues, re-react to the message after 5 minutes and try again."
  );

export const DiscussionMessage = (message) =>
  new Discord.MessageEmbed()
    .setAuthor(
      message.author.display_name,
      message.author.avatar_image_url,
      message.author.html_url
    )
    .setTitle(`re: ${message.topicTitle}`)
    .setURL(message.url)
    .setTimestamp(message.created_at)
    .setColor("#27408b")
    .setDescription(turndownService.turndown(message.message));

export const AnnouncementMessage = (message) =>
  new Discord.MessageEmbed()
    .setAuthor(
      message.author.display_name,
      message.author.avatar_image_url,
      message.author.html_url
    )
    .setTitle(message.title)
    .setURL(message.html_url)
    .setTimestamp(message.posted_at)
    .setColor("#27408b")
    .setDescription(turndownService.turndown(message.message));

export const ModuleMessage = (message) =>
  new Discord.MessageEmbed()
    .setAuthor(
      "Canvas",
      "https://cpb-ap-se2.wpmucdn.com/blogs.unimelb.edu.au/dist/6/275/files/2017/09/04_Logo_Vertical-Housed-1abdv7t.jpg"
    )
    .setColor("#08c96b")
    .setURL(
      message.type == "ExternalUrl" ? message.external_url : message.html_url
    )
    .setTitle(`${message.parent}: new ${message.type}`)
    .setDescription(message.title);

export const ModuleFileMessage = (message) =>
  new Discord.MessageEmbed()
    .setAuthor(
      "Canvas",
      "https://cpb-ap-se2.wpmucdn.com/blogs.unimelb.edu.au/dist/6/275/files/2017/09/04_Logo_Vertical-Housed-1abdv7t.jpg"
    )
    .setColor("#08c96b")
    .setURL(message.html_url)
    .setTitle(`${message.parent}: new ${message.type}`)
    .setDescription(message.title)
    .attachFiles([{ attachment: message.file, name: message.filename }]);

export const EULA = new Discord.MessageEmbed()
  .setAuthor(
    "CIS School",
    "https://cpb-ap-se2.wpmucdn.com/blogs.unimelb.edu.au/dist/6/275/files/2017/09/04_Logo_Vertical-Housed-1abdv7t.jpg"
  )
  .setColor("#3636cc")
  .setURL("https://policy.unimelb.edu.au/MPF1324#section-4.1")
  .setTitle(`CIS Subject Discord Terms of Use`)
  .setDescription(
    "While Discord is for informal chat among students and staff of the subject, you are expected to \
      uphold the University of Melbourne policy on Student Conduct at all times in the hosted Discord \
      chat channels: [more information](https://policy.unimelb.edu.au/MPF1324#section-4.1).\n\n \
      respond AGREE if you have understood and agree."
  );

export const EULAPinned = new Discord.MessageEmbed()
  .setAuthor(
    "CIS School",
    "https://cpb-ap-se2.wpmucdn.com/blogs.unimelb.edu.au/dist/6/275/files/2017/09/04_Logo_Vertical-Housed-1abdv7t.jpg"
  )
  .setColor("#3636cc")
  .setURL("https://policy.unimelb.edu.au/MPF1324#section-4.1")
  .setTitle(`CIS Subject Discord Terms of Use`)
  .setDescription(
    "While Discord is for informal chat among students and staff of the subject, you are expected to \
      uphold the University of Melbourne policy on Student Conduct at all times in the hosted Discord \
      chat channels: [more information](https://policy.unimelb.edu.au/MPF1324#section-4.1).\n\n "
  );

export const WelcomeMessage = (discordUser, canvasUser) =>
  new Discord.MessageEmbed()
    .setColor("#3636cc")
    .setTitle(`Welcome ${discordUser.username}`)
    .setImage(discordUser.displayAvatarURL())
    .setDescription(
      `${canvasUser.user.short_name.split(" ").shift()} (${
        canvasUser.user.login_id
      })  just mapped their canvas <-> discord account ${discordUser.username}`
    );

export const TOSErrorMessage =
  "You haven't agreed to the TOS (or I crashed).\n Please try again later or post in #support if it happens again.";

export const AlreadyInProgressMessage = (username) =>
  `There is already an in progress request for ${username}, try again later.`;

export const AlreadyRegisteredMessage = (username) =>
  `There is already an registration for ${username}, roles are updated on an event basis and polled @10min intervals. Please msg kvoli if you think there is an issue.`;

export const UpdatedMappingMessage = (canvasUsername) =>
  `Hi ${canvasUsername} have updated your roles on the CIS Systems Server. Please check back and have a look`;

export const KickWarningLog = (displayName) =>
  `Discord user ${displayName} has been notified that their account is currently unverified. I've double checked my records and found no mention! Account will be kicked in 1 week after joining if non-authenticated`;

export const KickWarningMessage = (displayName) =>
  `Hi ${displayName}, please register your canvas account on the subject discord server. Accounts will be kicked after 1 week of inactivity. You can always join back later and rety.`;
