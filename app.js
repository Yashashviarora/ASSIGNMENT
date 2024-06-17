const express = require('express'); // Import the Express module
const bodyParser = require('body-parser'); // Import the body-parser module for parsing request bodies
const axios = require('axios'); // Import the axios module for making HTTP requests
const mariadb = require('mariadb'); // Import the mariadb module for connecting to MariaDB
const path = require('path'); // Import the path module for handling file paths
const { Console } = require('console');

const app = express(); // Create an Express application

// Create a MariaDB connection pool
const pool = mariadb.createPool({
    host: 'localhost', // MariaDB server hostname
    user: 'root', // MariaDB username
    password: 'root', // MariaDB password
    database: 'moviesDB', // Database name
    connectionLimit: 5 // Limit the number of simultaneous connections
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory
app.set('view engine', 'ejs'); // Set EJS as the templating engine

// Route to render the main search page
app.get('/', (req, res) => {
    res.render('index'); // Render 'index.ejs'
});

// Route to handle search form submissions
app.post('/search', async (req, res) => {

    const searchTerm = req.body.searchTerm; // Get the search term from the request body
    console.log('search term', searchTerm);
    try {
        // Encode the search term to handle spaces and special characters
        const encodedSearchTerm = encodeURIComponent(searchTerm);
        // Make a request to the OMDB API with the encoded search term
        const response = await axios.get(`http://www.omdbapi.com/?s=${encodedSearchTerm}&apikey=5501b202`);
       console.log(response);
        const results = response.data.Search || []; // Ensure results is an array
        res.render('results', { results }); // Render 'results.ejs' with the search results
    } catch (error) {
        console.error(error); // Log any errors to the console
        res.render('index', { error: 'Error fetching data from OMDB API' }); // Render 'index.ejs' with an error message
    }
});

// Route to handle adding a movie to favorites
app.post('/favorite', async (req, res) => {
    const { title, year, type, poster } = req.body; // Get movie details from the request body
    try {
        // Get a connection from the pool
        const conn = await pool.getConnection();
        // Insert the movie details into the 'favorites' table
        await conn.query('INSERT INTO favorites (title, year, type, poster) VALUES (?, ?, ?, ?)', [title, year, type, poster]);
        conn.release(); // Release the connection back to the pool
    } catch (err) {
        console.error(err); // Log any errors to the console
    }
    res.redirect('/'); // Redirect to the main page
});

// Start the server on port 3000
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
