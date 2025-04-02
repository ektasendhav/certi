const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const pdf = require('html-pdf');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1/vaccination_booking', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

const BookingSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  username: String,
  vaccine: String,
  date: String,
  hospital: String
});

const User = mongoose.model('User', UserSchema);
const Booking = mongoose.model('Booking', BookingSchema);

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ektasendhav5304@gmail.com',
    pass: 'mczo vrzh gewf stwk'
  }
});

// Routes
app.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    });
    await user.save();
    res.json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user && await bcrypt.compare(req.body.password, user.password)) {
      req.session.userId = user._id;
      res.json({ message: 'Logged in successfully' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/book', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Please login first' });
    }

    const booking = new Booking({
      userId: req.session.userId,
      username: req.body.username,
      vaccine: req.body.vaccine,
      date: req.body.date,
      hospital: req.body.hospital
    });
    await booking.save();

    // Generate PDF
    const html = `
      <h1>Vaccination Booking Details</h1>
      <div style="font-family: Arial; padding: 20px; border: 1px solid #ccc;">
        <p><strong>Name:</strong> ${req.body.username}</p>
        <p><strong>Vaccine:</strong> ${req.body.vaccine}</p>
        <p><strong>Date:</strong> ${req.body.date}</p>
        <p><strong>Hospital:</strong> ${req.body.hospital}</p>
      </div>
    `;

    const pdfBuffer = await new Promise((resolve, reject) => {
      pdf.create(html).toBuffer((err, buffer) => {
        if (err) reject(err);
        resolve(buffer);
      });
    });

    // Send email with PDF
    const user = await User.findById(req.session.userId);
    const mailOptions = {
      from: 'ektasendhav5304@gmail.com',
      to: user.email,
      subject: 'Vaccination Booking Confirmation',
      text: 'Please find your booking details attached.',
      attachments: [{
        filename: 'booking-details.pdf',
        content: pdfBuffer
      }]
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Booking successful, PDF sent to email' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/download-pdf', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Please login first' });
    }

    const booking = await Booking.findOne({ userId: req.session.userId }).sort({ _id: -1 });
    if (!booking) {
      return res.status(404).json({ error: 'No booking found' });
    }

    const html = `
      <h1>Vaccination Booking Details</h1>
      <div style="font-family: Arial; padding: 20px; border: 1px solid #ccc;">
        <p><strong>Name:</strong> ${booking.username}</p>
        <p><strong>Vaccine:</strong> ${booking.vaccine}</p>
        <p><strong>Date:</strong> ${booking.date}</p>
        <p><strong>Hospital:</strong> ${booking.hospital}</p>
        <p style="font-family: Arial; padding: 20px; border: 1px solid #ccc; text-align:center;">This is computer generated mail, It doesn't require any signature </p>
      </div>
    `;

    pdf.create(html).toStream((err, stream) => {
      if (err) return res.status(500).send(err);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=booking-details.pdf');
      stream.pipe(res);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});