/**
 * DEV@DEAKIN Newsletter Signup
 * Author : Daniel Soutar
 * Task 2.1P
 * 
 * I have opted to use Ethereal for email testing, through the nodemailer package.
 * This is instead of 
 * 1. MailChimp (as it is a paid service now, even at the lowest tier)
 * 2. SendGrid (which requires phone verification; I would prefer to avoid using my personal phone number)
 * 3. Mailgun (which also requires phone verification / payment)
 * 
 * Ethereal allows for demo emails to be "sent" as a preview link for viewing in the browser.
 * It also fulfils the requirement of the code being asynchronous, and mimics real email APIs.
 * Thus, for the purposes of a learning/demo excercise, I believe it is a suitable choice.
 */

const express = require("express");
const bodyParser = require("body-parser");
const nodeMailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); // serve public files (CSS, images)

/**
 * GET / 
 * Serve the index.html file
 */
app.get("/", (req, res)=> {
    res.sendFile(path.join(__dirname, "/index.html"));
});

/**
 * POST / 
 * Handle the form submission and send the email
 * Email is sent using nodemailer with an Ethereal test account
 * This functionality is asynchronous as required by the task sheet
 */
app.post("/", async (req, res) => {
    const firstName = req.body.first_name;
    const lastName = req.body.last_name;
    const email = req.body.email;
    
    // Create Ethereal test account (chosen instead of SendGrid/Mailgun to avoid phone verification / cost)
    let testAccount = await nodeMailer.createTestAccount();

    // Set up the email transporter - this uses SMTP with the test account credentials
    let transporter = nodeMailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });

    // Get the welcome email HTML template    
    const emailPath = path.join(__dirname, "/email.html");
    let emailTemplate = fs.readFileSync(emailPath, "utf8");
    let emailHtml = emailTemplate.replace("{{first_name}}", firstName)
                                 .replace("{{last_name}}", lastName);

    // Send the welcome email
    let info = await transporter.sendMail({
        from: `"Deakin Newsletter" <DEV@deakin.edu.au>`, // sender address
        to: email, // recipient - the email provided in the form
        subject: "Welcome to the Deakin Newsletter",
        html: emailHtml,
        attachments: [
            {
                filename: "logo.png",
                path: path.join(__dirname, "/public/image/logo.png"),
                cid: "logo" // embedded image CID
            }
        ]
    });
    
    // Get the preview URL for the sent email
    const previewUrl = nodeMailer.getTestMessageUrl(info);
    
    // Get the confirmation HTML page
    const confirmPath = path.join(__dirname, "/confirmation.html");
    let confirmTemplate = fs.readFileSync(confirmPath, "utf8");
    let confirmHtml = confirmTemplate.replace("{{first_name}}", firstName)
                                 .replace("{{preview_url}}", previewUrl);

    // Respond to the client with a confirmation page (including the preview link)
    res.send(confirmHtml);
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});