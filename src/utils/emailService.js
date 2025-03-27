import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // You can use "outlook" or any SMTP service
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS, // Your app password
      },
    });

    const mailOptions = {
      from: `"AutoHeaven" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", options.email);

  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw new Error("Email could not be sent"); // Pass error to be handled elsewhere
  }
};

export default sendEmail;
