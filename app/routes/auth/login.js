'use strict';

const express = require('express');
const router = express.Router();

const { User, UserProfiles } = require('../../models');
const { LocalProfile } = UserProfiles;
const { PasswordServ, TokenServ } = require('../../lib');
const {
    UserNotFoundError,
    EmailNotVerifiedError,
    IncorrectPasswordError
} = require('../../errors');

router.route('/')


    /**
     * Login
     * 
     */

    .post(async(req, res, next) => {

        const {
            email,
            password
        } = req.body;

        try {
            const user = await User.findOne({ email }).exec();

            if (!user) {
                const error = new UserNotFoundError();
                return next(error);
            }

            const profile = await LocalProfile.findOne({ userId: user.id }).exec();
            
            // If Email Is Not Verified 
            if (!profile.isEmailVerified) {
                const error = new EmailNotVerifiedError();
                return next(error);
            }

            const isCorrectPassword = await PasswordServ.match(password, profile.password);

            if (!isCorrectPassword) {
                const error = new IncorrectPasswordError();
                return next(error);
            }

            const tokenData = {
                email,
                provider: profile.provider,
                userId: user.id,
                role: user.role,
                profileId: profile.id
            };

            const token = await TokenServ.generate(tokenData);
            res.json({ token });

        } catch (error) {
            next(error);
        }

    })



module.exports = router;