
const { SendEmailCommand } = require("@aws-sdk/client-ses");
const sesClient = require("../models/ses");
const User = require('../models/user');
require("dotenv").config();

exports.sendSignupEmail = async (user) => {

  const params = {
    Source: "aditinaik243@gmail.com",
    Destination: {
      ToAddresses: [user.email]
    },
    Message: {
      Subject: { Data: "Welcome to Mini Amazon Clone!" },
      Body: {
        Html: {
          Data: `
            <h2>Hello ${user.name},</h2>
            <p>Your account has been successfully created.</p>
            <p>Thank you for signing up!</p>
          `
        }
      }
    }
  };

  await sesClient.send(new SendEmailCommand(params));
};
