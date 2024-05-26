/* ---------- MODULES ---------- */
const _ = require('lodash');
const auth = require('../middleware/auth');
const express = require('express');
const passport = require('passport');
const crypto = require('crypto');

/* ---------- CLASSES & INSTANCES ---------- */
const router = express.Router();
const User = require('../models/User');
const Channel = require('../models/Channel');

/* ---------- CONSTANTS ---------- */
const DEV_VIEW_MODE = process.env.DEV_VIEW_MODE; // To automatically log in after server refresh
const DEV_USER_ID = process.env.DEV_USER_ID;

/* ---------- Telegram  ---------- */
const TelegramBot = require('node-telegram-bot-api');
const token = '7118637598:AAE-h_JBJHdVl0LJyyS23prZ6UaYk3QV_rQ';
const bot = new TelegramBot(token, {polling: false});

/* ---------- INITIALIZATION ---------- */
/* ----- Express ----- */
router.use(function (req, res, next) {
    // Automatically authenticate if dev mode is on.
    if (!req.isAuthenticated() && _.includes(['user', 'admin'], DEV_VIEW_MODE) && DEV_USER_ID) {
        User.findById(DEV_USER_ID, (err, user) => {
            if (err) throw err;

            req.login(user, (err) => {
                if (err) return next(err);

                return next();
            });
        });
    }
    else {
        next();
    }
});

/* ---------- ROUTES ---------- */
// With the middleware, if the user is not authenticated, they will be redirected to the front landing page.
router.get('/', auth.isLoggedIn, async (req, res) => {
    const data = await Channel.find({owner : req.user._id});
    console.log(data);
    res.render('users/dashboard', {user: req.user, myChannel: data , flash: req.flash('dashboard')});
});

/* ----- VISITOR ROUTES ----- */
router.post('/login', passport.authenticate('local', {successRedirect: '/', failureRedirect: '/', failureFlash: 'Incorrect credentials.'}));


router.post('/sendMessage', async (req,res)=>{
    console.log(req.body);
    const chatId = req.body.idchat;
    const message = req.body.message;

    await bot.sendMessage(chatId, message);
    req.flash('success', 'Pesan berhasil terkirim');
    res.redirect('/');
});

router.post('/addChannel', auth.isLoggedIn, async (req, res)=>{
    const chatid = req.body.chatid;

    async function checkChatId(chatId) {
        try {
            const chatInfo = await bot.getChat(chatId);
            return chatInfo;
        } 
        catch (error) {
            console.error(`Chat ID ${chatId} tidak valid: ${error.message}`);
        }
    }

    const myChannel = await checkChatId(chatid) || 0;
    if (myChannel === undefined || myChannel === 0 || myChannel === null) {
        req.flash('error', 'Chat id salah atau tidak ditemukan');
        return res.redirect('/');
        // Handle the case where the variable is undefined, 0, or null
    } 
    else {
        console.log('myVariable has a value other than undefined, 0, or null');
        // Handle the case where the variable has a different value
    }

    const channelObj = {
        owner: req.user._id,
        idchat : chatid,
        title : myChannel.title,
        status : 1,
        token : crypto.randomBytes(16).toString('hex')
    };
    const post = new Channel(channelObj);

    post.save((err) => {
        // Check for invalid user input.
        if (err) {
            req.flash('error', err.message);
            return res.status(409).redirect('/');
        }
        req.flash('success', 'chat id ditambahkan');
        return res.redirect('/');
    });
});

router.get('/privacy', (req, res) => {
    res.render('privacy');
});

router.get('/tos', (req, res) => {
    res.render('tos');
});

/* ----- USER ROUTES ----- */
router.get('/logout', auth.isAuthenticated, (req, res) => {
    req.logout();
    res.redirect('/');
});

router.get('/profile', auth.isAuthenticated, (req, res) => {
    res.render('users/profile', {user: req.user});
});

router.get('/settings', auth.isAuthenticated, (req, res) => {
    res.render('users/settings', {user: req.user, flash: req.flash('settings')});
});

module.exports = router;