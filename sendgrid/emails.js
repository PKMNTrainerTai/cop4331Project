import sgMail from '@sendgrid/mail';
import { PASSWORD_RESET_REQUEST_TEMPLATE, VERIFICATION_EMAIL_TEMPLATE } from "./emailTemplates.js";
import { sender } from "./sendgrid.config.js";

export const sendVerificationEmail = async (email, verificationCode) => {
    try {
        const msg = {
            to: email,
            from: sender,
            subject: "Verify your email",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationCode),
            category: "Email Verification"
        };

        const response = await sgMail.send(msg);
        console.log("Email sent!", response);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        console.error(error.response?.body?.errors || error);
        throw new Error(`Error sending email: ${error.message}`);
    }
};

export const sendPasswordResetEmail = async (email, resetURL) => {
    try {
        const msg = {
            to: email,
            from: sender,
            subject: "Reset your password",
            html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
            category: "Password Reset"
        };

        const response = await sgMail.send(msg);
        console.log("Password reset email sent!", response);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        console.error(error.response?.body?.errors || error);
        throw new Error(`Error sending password reset email: ${error.message}`);
    }
};