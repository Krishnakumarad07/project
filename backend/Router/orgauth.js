const express = require('express');
const router = express.Router();
const OrgDB = require('../Models/Orgmodel');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const nodemailer= require("nodemailer");

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'fallbackkey';
router.post('/signup', async (req, res) => {
    try {
        const { orgname, org_email, password } = req.body;

        // Check if the Organisation already exists
        const existingOrg = await OrgDB.findOne({ orgname,org_email });
        if (existingOrg) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Register the organisation
        const newOrganisation = new OrgDB({
            orgname,
            org_email,
            password,  // Store the plain text password
        });
        const org = await newOrganisation.save();

        // Generate a JWT token
        const token = jwt.sign(
            { id: org._id, orgusername: org.orgname, org_email: org.org_email },
            JWT_SECRET,
        );

        res.json({
            message: 'Organisation Registered successfully',
            token,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});


router.post('/login', async (req, res) => {
    try {
        const { orgname,org_email, password } = req.body;

        // Find the organisation by email
        const org = await OrgDB.findOne({org_email});
        if (!org) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        if (org.orgname != orgname)
        {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if the password matches
        if (org.password !== password) {  // Compare plain text passwords
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate a JWT token
        const token = jwt.sign(
            { id: org._id, orgname: org.orgname, email: org.org_email },
            JWT_SECRET,
        );

        res.json({
            message: 'Login successful',
            token,
        });
    } catch (err) {
        res.status(500).json(err);
    }
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // Find the user by email
        const org = await OrgDB.findOne({ org_email:email });
        if (!org) {
            return res.status(404).json({ message: 'No such email in DB' });
        }

        // Configure Nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAILID,
                pass: process.env.MAILPWD,
            }
        });

        // Configure the email options
        const mailOptions = {
            from: `"Smart Recruiter" <${process.env.MAILID}>`,
            to: org.org_email,
            subject: 'Regarding Forgot Password',
            text: `Your password is: ${org.password}`, // Plain text
            html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
    h2 { color: #333; }
    p { color: #555; }
    a { color: #1a73e8; text-decoration: none; }
    .footer { font-size: 12px; color: #777; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Dear Organization ${(org.orgname).charAt(0).toUpperCase()+(org.orgname).slice(1)},</h2>
    <p>We received a request to for your password. </p>
    <p><h5>Here is Your Password:<mark>${org.password}</mark></h5></p>
    <p>If you did not request this change, please ignore this email or contact support if you have questions.</p>
    <div class="footer">
      <p>Best regards,<br>Smart Recruiter Team</p>
    </div>
  </div>
</body>
</html>
`,
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Password sent to email' });
    } catch (err) {
        res.status(500).json({ message: 'Error sending password', error: err });
    }
});



module.exports = router;
