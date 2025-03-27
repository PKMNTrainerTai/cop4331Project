import { PASSWORD_RESET_REQUEST_TEMPLATE, VERIFICATION_EMAIL_TEMPLATE } from "./emailTemplates.js"
import { mailtrapClient, sender } from "./mailtrap.config.js"

export const sendVerificationEmail = async (email, verificationCode) => {
    const recipient = [{email}]

    try{
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject:"verify your email",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationCode),
            category:"Email Verification"
        })
        console.log("email sent!", response)
    } catch (error){
        console.error('error sending verification', error);
        throw new Error('error sending email: ${error}')
    }
}

export const sendPasswordResetEmail = async (email, resetURL)=>{
    const recipient =[{email}];

    try{
        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "reset your password",
            html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
            category:"password reset"
        })
    }catch (error){
        console.error('error sending password reset email', error);
        throw new Error('error sending password reset email: ${error}');
    }
}