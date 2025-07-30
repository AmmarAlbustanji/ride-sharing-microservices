// utils/sendOtpWithVonage.js
const { Vonage } = require('@vonage/server-sdk');

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET
});

exports.sendOTP = async (phone, otp) => {
  const from = "Vonage";
  const to = phone;
  const text = `Your OTP is: ${otp}`;

  return new Promise((resolve, reject) => {
    vonage.sms.send({ to, from, text }, (err, responseData) => {
      if (err) {
        console.error("SMS sending error:", err);
        return resolve(false);
      }
      if (responseData.messages[0].status === "0") {
        console.log("SMS sent successfully.");
        resolve(true);
      } else {
        console.error("SMS failed:", responseData.messages[0]['error-text']);
        resolve(false);
      }
    });
  });
};
