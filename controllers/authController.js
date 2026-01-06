const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({
            name,
            email,
            password
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = {
            user: {
                _id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                _id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ msg: 'No account found with that email address' });
        }

        // Generate 6-digit code
        const { generateVerificationCode, sendPasswordResetEmail } = require('../utils/emailService');
        const code = generateVerificationCode();

        // Hash the code before storing
        const salt = await bcrypt.genSalt(10);
        const hashedCode = await bcrypt.hash(code, salt);

        // Store hashed code and expiration (15 minutes)
        user.resetPasswordToken = hashedCode;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
        await user.save();

        // Send email with the plain code
        const emailResult = await sendPasswordResetEmail(email, code);

        if (!emailResult.success) {
            return res.status(500).json({ msg: 'Failed to send email. Please try again later.' });
        }

        res.json({ msg: 'Password reset code sent to your email' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ msg: 'No account found with that email address' });
        }

        // Check if reset token exists
        if (!user.resetPasswordToken || !user.resetPasswordExpires) {
            return res.status(400).json({ msg: 'No password reset request found. Please request a new code.' });
        }

        // Check if token has expired
        if (Date.now() > user.resetPasswordExpires) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            return res.status(400).json({ msg: 'Reset code has expired. Please request a new one.' });
        }

        // Verify the code
        const isMatch = await bcrypt.compare(code, user.resetPasswordToken);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid verification code' });
        }

        // Update password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Clear reset token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ msg: 'Password has been reset successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

