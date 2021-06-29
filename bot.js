'use strict';
/**
 * A bot that welcomes new guild members when they join
 */

// Import the discord.js module
require('dotenv').config();
const Discord = require('discord.js');
const nodemailer = require('nodemailer');

// Create an instance of a Discord client
const client = new Discord.Client();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN.toString();
const MAIL_ADDRESS = process.env.MAIL_ADDRESS.toString();
const MAIL_PW = process.env.MAIL_PW.toString();
const SERVER_ID = process.env.SERVER_ID.toString();
const MAX_RETRIES = 15;

var registered = new Set();
var inProgress = new Map();
var tries = new Map();

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: MAIL_ADDRESS,
        pass: MAIL_PW,
    }
});

let getMailOptions = (username, code) => ({
    from: MAIL_ADDRESS,
    to: username + '@student.unimelb.edu.au',
    subject: 'Dist. Computing Discord Server',
    text: code,
});

let genCode = () => "dcmp@" + Math.trunc(Math.random() * 1e20).toString(16);


let sendMail = (username, user) => {
    console.log("attempting to send email to " + username);
    if (registered.has(user)) return;
    const code = genCode();

    transporter.sendMail(getMailOptions(username, code))
        .then(console.log("sent email to " + username), inProgress.set(user, code))
};

let getRole = (roleName) => client.guilds.fetch(SERVER_ID)
    .then(guild => guild.roles.cache.find(role => role.name === roleName))
    .catch(console.error);

let validateCode = (user, inputCode) => inProgress.get(user).toString() === inputCode;

let addRole = (user, role) => client.guilds.fetch(SERVER_ID).then(guild => guild.member(user).roles.add(role))

let banWarning = (user) => {
    user.send("Hi, you're going to be banned if you fail a few more attempts. Please contact the staff.")
}

const StarterMessage = new Discord.MessageEmbed()
    .setTitle("README")
    .setColor("0xff0000")
    .setDescription("In order to access the channels, you must authenticate your account against your student email.\n\n1. react to this message\n\n2. Respond to bot request for your unimelb username with user=username e.g. user=bot\n\n3. Check your email and respond to the bot with the code you received.\n\n4. Success (or something went wrong), you should now see the relevant channels.")

client.on('ready', () => {
    client.guilds.fetch(SERVER_ID, false, true).then(server => server.systemChannel.messages.fetchPinned()
        .then(pinned => {
            if (pinned.size < 1) {
                server.systemChannel.send(StarterMessage)
                    .then(msg => msg.pin())
            } else {
                console.log("existing message, skipping")
            }
        })
        .catch(console.error)
    )
});


client.on('messageReactionAdd', (messageReaction, user) => {
    // if the reaction was not on one of our messages, ignore
    if (!messageReaction.message.author.equals(client.user)) {
        return;
    }

    // user already registered, ignore
    if (registered.has(user)) {
        console.log("user: " + user.username + ", has already registered - ignore react.");
        return;
    }

    // already have in progress request
    if (inProgress.has(user)) {
        console.log("user: " + user.username + ", is already in progress - ignore react.");
        user.send("Hi, you already have an in progress auth request.")
        return;
    }

    user.send('Please enter your unimelb username `user=yourusername` e.g. user=bot')

    const filter = m => m.content.startsWith('user=');
    user.createDM().then(channel => channel.awaitMessages(filter, {max: 1, time: 60000, errors: ['time']}))
        .then(collected => sendMail(collected.last().toString().slice(5), user))
        .then(_ => {
            user.send("Sent verification email, please check student inbox + spam and paste the code below. You have 5 minutes :D")
            user.createDM().then(channel => channel.awaitMessages(m => m.content.startsWith('dcmp@'), {max: 1, time: 5 * 60000, errors: ['time']}))
                .then(col => addCodeBlockedRole(col.last(), "student"))
                .catch(console.error);
        })
        .catch(err => user.send("Sorry, you took too long to respond. Try re-reacting to the emoji." + err));
});

let addCodeBlockedRole = (message, roleName) => {
    // ignore message from guilds
    if (message.guild) {
        console.log("ignoring message from guild: " + message.content);
        return;
    };

    // not inprogress for that user, can't help
    if (!inProgress.has(message.author)) {
        console.log("ignoring message from non-in progress user: " + message.content);
        return;
    };

    console.log("recv msg, from in-progress, non-guild channel" + message.content);

    if (!validateCode(message.author, message.content)) {
        message.reply("invalid code, please try again").catch(console.error);
        return;
    }

    getRole(roleName)
        .then(role =>
            addRole(message.author, role)
                .then(_ => {
                    registered.add(message.author);
                    registered.add(message.author);
                    message.author.send("success, check back to the server.");
                })
                .catch(err => {
                    registered.delete(message.author);
                    console.error("error updating role " + roleName + ", err: " + err);
                    message.author.send("error updating role :/, retry later");
                }
                )
        )
        .catch(err => {
            registered.delete(message.author);
            console.error("error retrieving role " + roleName + ", err: " + err);
            message.author.send("error updating role :/, retry later");
        });

    inProgress.delete(message.author);
}

client.login(DISCORD_TOKEN);
