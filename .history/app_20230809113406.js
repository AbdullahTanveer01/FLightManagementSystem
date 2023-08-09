// Import required modules
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const pdfkit = require('pdfkit'); // Import the 'pdfkit' module
// Create an instance of Express
const app = express();

// Set up the database connection
const con = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'moizest1',
  database: 'flightmanagementsystem'
});
app.use(express.json());
// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
// Routes
app.get('/', function(req, res) {
  res.render('login', { error: null });
});

app.post('/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var query = 'SELECT * FROM admins WHERE username = ? AND password = ?';
  con.query(query, [username, password], function(error, results, fields) {
    if (error) throw error;

    if (results.length > 0) {
      res.render('dashboard', { username: username }); // Pass 'username' instead of 'login'
    } else {
      res.render('login', { error: 'Invalid username or password' });
    }
  });
});
// Import necessary modules and set up other routes

// Route for rendering the register page
app.get('/register', function(req, res) {
  res.render('register');
});

// Route for handling the registration form submission
app.post('/register', function(req, res) {
  // Extract the registration form data
  const { username, password, email } = req.body;

  // Save the username and password to the database
  con.query(
    'INSERT INTO admins (username, password) VALUES (?, ?)',
    [username, password],
    function(error, results, fields) {
      if (error) throw error;

      res.redirect('/'); // Redirect to the homepage or appropriate page
    }
  );
});

// Set up other routes and server initialization

// Routes
app.get('/dashboard', function(req, res) {
  var username = 'admin1'; // Replace with the actual logged-in username
  res.render('dashboard', { username: username });
});

app.get('/contact', function(req, res) {
  res.render('contact');
});

app.get('/about', function(req, res) {
  res.render('about');
});


app.get('/book-flight', function(req, res) {
  // Fetch available flights, airlines, and airports from the database
  con.query('SELECT * FROM flights', function(flightsError, flights, flightsFields) {
    if (flightsError) throw flightsError;

    con.query('SELECT * FROM airlines', function(airlinesError, airlines, airlinesFields) {
      if (airlinesError) throw airlinesError;

      con.query('SELECT * FROM airports', function(airportsError, airports, airportsFields) {
        if (airportsError) throw airportsError;

        res.render('book-flight', { flights: flights, airlines: airlines, airports: airports });
      });
    });
  });
});

// Route for searching flights based on selected departure and arrival airports
app.post('/search-flights', function(req, res) {
  const departureAirport = req.body.departure;
  const arrivalAirport = req.body.arrival;

  // Fetch available flights based on the selected airports
  const query = 'SELECT * FROM flights WHERE departure_airport_id = ? AND arrival_airport_id = ?';
  con.query(query, [departureAirport, arrivalAirport], function(error, results, fields) {
    if (error) throw error;

    res.render('available-flights', { flights: results });
  });
});


app.get('/make-payment/:flightId', (req, res) => {
  const flightId = req.params.flightId;
  res.render('payments', { flightId: flightId });
});

app.post('/transaction-complete', function(req, res) {
  // Retrieve payment data from req.body
  var seatType = req.body.seatType;
  var name = req.body.name;
  var cnic = req.body.cnic;
  var seats = req.body.seats;
  var paymentMethod = req.body.paymentMethod;
  var bankId = req.body.bankId;
  var expiryDate = req.body.expiryDate;
  var cvv = req.body.cvv;
  var pin = req.body.pin;

  // Generate random ticket number and seat number
  var ticketNumber = Math.floor(Math.random() * 1000000) + 1;
  var seatNumber = Math.floor(Math.random() * 100) + 1;

 // Store payment data and ticket details in the database
var query = 'INSERT INTO transactions (seat_type, name, cnic, seats, payment_method, bank_id, expiry_date, cvv, pin, ticket_number, seat_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
con.query(query, [seatType, name, cnic, seats, paymentMethod, bankId, expiryDate, cvv, pin, ticketNumber, seatNumber], function(error, results, fields) {
  if (error) throw error;

  // Render the transaction-complete page with ticket details
  res.render('transaction-complete', {
    ticketNumber: ticketNumber,
    seatNumber: seatNumber,
    date: getCurrentDate(),
    time: getCurrentTime(),
    seatType: seatType,
    id: results.insertId // Add this line to pass the id variable
    });
  });

});

// Function to get the current date in "YYYY-MM-DD" format
function getCurrentDate() {
  var date = new Date();
  var year = date.getFullYear();
  var month = (date.getMonth() + 1).toString().padStart(2, '0');
  var day = date.getDate().toString().padStart(2, '0');
  return year + '-' + month + '-' + day;
}

// Function to get the current time in "HH:MM:SS" format
function getCurrentTime() {
  var date = new Date();
  var hours = date.getHours().toString().padStart(2, '0');
  var minutes = date.getMinutes().toString().padStart(2, '0');
  var seconds = date.getSeconds().toString().padStart(2, '0');
  return hours + ':' + minutes + ':' + seconds;
}
// Route to handle the PDF download request
app.get('/download-ticket-pdf', function(req, res) {
  const ticketNumber = req.query.ticketNumber;
  const seatNumber = req.query.seatNumber;

  // Create a new PDF document using 'pdfkit'
  const doc = new pdfkit();
  
  // Set the response headers for PDF file download
  res.setHeader('Content-Disposition', 'attachment; filename=ticket.pdf');
  res.setHeader('Content-Type', 'application/pdf');

  // Pipe the PDF document to the response stream
  doc.pipe(res);

  // Add content to the PDF document
  doc.fontSize(12).text('Ticket Number: ' + ticketNumber, { align: 'left' });
  doc.fontSize(12).text('Seat Number: ' + seatNumber, { align: 'left' });

  // Finalize the PDF document
  doc.end();
});
// Route for rendering the admin panel
app.get('/admin', function(req, res) {
  res.render('admin');
});
// Route for handling admin login form submission
app.post('/admin-login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var securityCode = req.body.securityCode;

  if (securityCode === '02') {
    res.redirect('/admin-dashboard'); // Redirect to the admin dashboard
  } else {
    res.render('admin', { error: 'Invalid security code' });
  }
});
// Route for rendering the admin dashboard
app.get('/admin-dashboard', function(req, res) {
  res.render('admin-dashboard');
});
// Route for handling flight insertion form submission
app.get('/admin-dashboard', function(req, res) {
  res.render('admin-dashboard');
});

// Route for handling flight insertion form submission
app.post('/admin-dashboard/insert-flight', function(req, res) {
  // Extract flight data from the request body
  const { price, Departure_airport_id, Arrival_airport_id, Departure_time, Arrival_time } = req.body;

  // Insert flight data into the flights table
  con.query(
      'INSERT INTO flights (price, Departure_airport_id, Arrival_airport_id, Departure_time, Arrival_time) VALUES ( ?, ?, ?,?, ?)',
      [price, Departure_airport_id, Arrival_airport_id, Departure_time, Arrival_time],
      function(error, results, fields) {
          if (error) throw error;

          // Redirect to the admin dashboard or appropriate page
          res.redirect('/admin-dashboard');
      }
  );
});

app.set('view engine', 'ejs');

// Start the server
app.listen(4000, function() {
  console.log('Server started on port 4000');
});