const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Generate 6-digit verification code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send password reset email
const sendPasswordResetEmail = async (email, code) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: `"Perfect Journal" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset Code - Perfect Journal',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0D1117; color: #EAECEF;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #00DCA3; font-size: 24px; margin: 0;">Perfect Journal</h1>
                    <p style="color: #8B949E; font-size: 12px; margin: 5px 0;">Precision • Performance • Community</p>
                </div>
                
                <div style="background-color: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 30px;">
                    <h2 style="color: #EAECEF; margin-top: 0;">Password Reset Request</h2>
                    <p style="color: #8B949E; line-height: 1.6;">
                        We received a request to reset your password. Use the verification code below to proceed:
                    </p>
                    
                    <div style="background-color: #0D1117; border: 2px solid #00DCA3; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                        <div style="color: #8B949E; font-size: 12px; margin-bottom: 10px;">VERIFICATION CODE</div>
                        <div style="color: #00DCA3; font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: monospace;">
                            ${code}
                        </div>
                    </div>
                    
                    <p style="color: #8B949E; line-height: 1.6; font-size: 14px;">
                        This code will expire in <strong style="color: #EAECEF;">15 minutes</strong>.
                    </p>
                    
                    <p style="color: #8B949E; line-height: 1.6; font-size: 14px;">
                        If you didn't request this password reset, please ignore this email or contact support if you have concerns.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; color: #30363D; font-size: 12px;">
                    <p>© 2025 Perfect Journal. All rights reserved.</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendPasswordResetEmail,
    generateVerificationCode
};
