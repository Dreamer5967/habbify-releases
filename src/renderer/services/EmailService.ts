export const EmailService = {
 // To use this, create an account at emailjs.com and get your keys
 // You can set these in your .env file
 SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'default_service',
 PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'default_public_key',

 // Create 3 templates in EmailJS and put their IDs here
 TEMPLATES: {
 WELCOME: import.meta.env.VITE_EMAILJS_TEMPLATE_WELCOME || 'template_welcome',
 LOGIN: import.meta.env.VITE_EMAILJS_TEMPLATE_LOGIN || 'template_login',
 LOGOUT: import.meta.env.VITE_EMAILJS_TEMPLATE_LOGOUT || 'template_logout',
},

 async sendEmail(templateId: string, templateParams: any) {
 if (this.PUBLIC_KEY === 'default_public_key') {
 console.warn('EmailJS is not configured. Skipping automated email.');
 return;
}

 try {
 const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json'},
 body: JSON.stringify({
 service_id: this.SERVICE_ID,
 template_id: templateId,
 user_id: this.PUBLIC_KEY,
 template_params: templateParams
})
});

 if (!response.ok) {
 throw new Error(await response.text());
}
} catch (error) {
 console.error('Failed to send automated email:', error);
}
},

 async sendWelcomeEmail(userName: string, userEmail: string) {
 console.log(`Sending Welcome Email to ${userEmail}`);
 await this.sendEmail(this.TEMPLATES.WELCOME, {
 to_name: userName,
 to_email: userEmail,
 message: 'Welcome to Habbify! We are excited to have you on board. Start tracking your habits and reaching your goals today!'
});
},

 async sendLoginEmail(userName: string, userEmail: string) {
 console.log(`Sending Login Email to ${userEmail}`);
 await this.sendEmail(this.TEMPLATES.LOGIN, {
 to_name: userName,
 to_email: userEmail,
 message: 'New login detected on your Habbify account. If this was you, you can safely ignore this email.'
});
},

 async sendLogoutEmail(userName: string, userEmail: string) {
 console.log(`Sending Logout Email to ${userEmail}`);
 await this.sendEmail(this.TEMPLATES.LOGOUT, {
 to_name: userName,
 to_email: userEmail,
 message: 'You have successfully logged out of Habbify. See you next time!'
});
}
};
