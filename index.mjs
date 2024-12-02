import express, { query } from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import session from "express-session";

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const pool = mysql.createPool({
  host: "3.133.12.47",
  user: "yeeun",
  password: "cst336",
  database: "quote_app",
  connectionLimit: 10,
  waitForConnections: true,
});
const conn = await pool.getConnection();

//initializing sessions
app.set("trust proxy", 1);
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);

app.get("/", async (req, res) => {
  res.render("login");
});

// logout
app.get("/logout", isAuthenticated, async (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// login
app.post("/login", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  let passwordHash = ``;

  let sql = `SELECT * 
            FROM admin 
            WHERE username = ?`;
  let sqlParams = [username];
  const [rows] = await conn.query(sql, sqlParams);
  if (rows.length > 0) {
    passwordHash = rows[0].password;
  }

  const match = await bcrypt.compare(password, passwordHash);

  if (match) {
    req.session.fullName = rows[0].firstName + " " + rows[0].lastName;
    req.session.authenticated = true;
    res.redirect("home");
  } else {
    res.redirect("/");
  }
});

//routes

// home
app.get("/home", async (req, res) => {
  res.render("home");
});

// api
app.get("/api/author/:authorId", isAuthenticated, async (req, res) => {
  let authorId = req.params.authorId;
  let sql = `SELECT * FROM authors WHERE authorId = ?`;
  let sqlParams = [authorId];
  const [rows] = await conn.query(sql, sqlParams);
  res.send(rows);
});

// Search Quotes Page
app.get("/searchQuotes", isAuthenticated, async (req, res) => {
  let author_sql = `SELECT authorId, firstName, lastName, authorId FROM authors ORDER BY lastName`;
  let category_sql = `SELECT DISTINCT(category) FROM quotes`;
  const [author_rows] = await conn.query(author_sql);
  const [categroy_rows] = await conn.query(category_sql);
  res.render("searchQuotes", { authors: author_rows, category: categroy_rows });
});

app.get("/allQuotes", isAuthenticated, async (req, res) => {
  let sql =
    "SELECT `authorId`,`firstName`, `lastName`, `quote`, `quoteId` FROM `quotes` NATURAL JOIN authors WHERE 1";
  const [rows] = await conn.query(sql);
  res.render("quotes", { rows: rows });
});

// Search Filters
app.get("/searchByKeyword", isAuthenticated, async (req, res) => {
  let keyword = req.query.keyword;
  let sql =
    "SELECT `authorId`, `firstName`, `lastName`, `quote` FROM `quotes` NATURAL JOIN authors WHERE quote LIKE ?";
  let sqlParams = [`%${keyword}%`];
  const [rows] = await conn.query(sql, sqlParams);
  res.render("quotes", { rows: rows });
});

app.get("/searchByAuthor", isAuthenticated, async (req, res) => {
  let author = req.query.author;
  let sql =
    "SELECT `authorId`, `firstName`, `lastName`, `quote` FROM `quotes` NATURAL JOIN authors WHERE authorId = ?";
  let sqlParams = [author];
  const [rows] = await conn.query(sql, sqlParams);

  res.render("quotes", { rows: rows });
});

app.get("/searchByCategory", isAuthenticated, async (req, res) => {
  let category = req.query.category;
  let sql = `
      SELECT authorId, authors.firstName, authors.lastName, quotes.quote 
      FROM quotes 
      NATURAL JOIN authors 
      WHERE category = ?`;
  let sqlParams = [category];
  const [rows] = await conn.query(sql, sqlParams);
  res.render("quotes", { rows: rows });
});

app.get("/searchByLikes", isAuthenticated, async (req, res) => {
  let min = req.query.min;
  let max = req.query.max;
  let sql = `
      SELECT authorId, authors.firstName, authors.lastName, quotes.quote 
      FROM quotes 
      NATURAL JOIN authors 
      WHERE quotes.likes >= ? AND quotes.likes <= ?`;
  let sqlParams = [min, max];
  const [rows] = await conn.query(sql, sqlParams);
  res.render("quotes", { rows: rows });
});

// get add Quotes
app.get("/addQuote", isAuthenticated, async (req, res) => {
  let author_sql = `SELECT firstName, lastName, authorId FROM authors ORDER BY lastName`;
  let category_sql = `SELECT DISTINCT(category) FROM quotes`;
  const [author_rows] = await conn.query(author_sql);
  const [categroy_rows] = await conn.query(category_sql);
  res.render("addQuote", { authors: author_rows, category: categroy_rows });
});

// post add Quotes
app.post("/addQuote", isAuthenticated, async (req, res) => {
  // What happens when you submit a new author
  let quote = req.body.quote;
  let authorId = req.body.author;
  let category = req.body.category;

  let sql = `INSERT INTO quotes
              (quote, authorId, category)
              VALUES (?, ?, ?)`;
  let params = [quote, authorId, category];
  await conn.query(sql, params);
  res.status(200).redirect("/allQuotes");
});

// all Authors
app.get("/allAuthors", isAuthenticated, async (req, res) => {
  let sql = `SELECT authorId, firstName, lastName, portrait
              FROM authors
              ORDER BY lastName`;
  const [rows] = await conn.query(sql);
  res.render("allAuthors", { authors: rows });
});

// get add Authors
app.get("/addAuthor", isAuthenticated, async (req, res) => {
  res.render("addAuthors");
});

// post add Authors
app.post("/addAuthor", isAuthenticated, async (req, res, next) => {
  const {
    firstName,
    lastName,
    biography,
    picture,
    dob,
    dod,
    profession,
    country,
  } = req.body;
  const gender = req.body.sex === "female" ? "F" : "M";

  if (!firstName || !lastName || !biography) {
    return res.status(400).send("Required fields are missing");
  }

  const sql = `
  INSERT INTO authors
  (firstName, lastName, biography, sex, portrait, dob, dod, profession, country)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
  const params = [
    firstName,
    lastName,
    biography,
    gender || null,
    picture || null,
    dob || null,
    dod || null,
    profession || null,
    country || null,
  ];

  await conn.query(sql, params);
  res.status(200).redirect("allAuthors");
});

// get edit Quote
app.get("/editQuote", isAuthenticated, async (req, res) => {
  let quoteId = req.query.quoteId;
  let sql = `SELECT * 
            FROM quotes
            WHERE quoteId = ?`;
  let author_sql = `SELECT firstName, lastName, authorId FROM authors ORDER BY lastName`;
  let category_sql = `SELECT DISTINCT(category) FROM quotes`;
  let [quoteData] = await conn.query(sql, [quoteId]);
  const [author_rows] = await conn.query(author_sql);
  const [categroy_rows] = await conn.query(category_sql);
  res.render("editQuote", {
    quoteData: quoteData,
    author_rows: author_rows,
    categroy_rows: categroy_rows,
  });
});

// post edit quote
app.post("/editQuote", isAuthenticated, async (req, res) => {
  let quoteId = req.body.quoteId;
  let quote = req.body.quote;
  let authorId = req.body.authorId;
  let category = req.body.category;
  let likes = req.body.likes;

  let sql = `UPDATE quotes SET quote = ?, authorId = ?, category = ?, likes = ? WHERE quoteId = ?`;
  let sqlParams = [quote, authorId, category, likes, quoteId];
  await conn.query(sql, sqlParams);

  res.redirect("/allQuotes");
});

// get edit author
app.get("/editAuthor", isAuthenticated, async (req, res) => {
  let authorId = req.query.authorId;
  let sql = `SELECT * 
            FROM authors
            WHERE authorId = ?`;
  let [authorData] = await conn.query(sql, [authorId]);
  res.render("editAuthor", { authorData });
});

// post edit author
app.post("/editAuthor", isAuthenticated, async (req, res) => {
  let authorId = req.body.authorId;
  const {
    firstName,
    lastName,
    biography,
    picture,
    dob,
    dod,
    profession,
    country,
  } = req.body;
  const gender = req.body.sex === "female" ? "F" : "M";

  let sql = `UPDATE authors SET firstName = ?, lastName = ?, sex = ?, biography = ?, portrait = ?, dob = ?, dod = ?, profession = ?, country = ? WHERE authorId = ?`;
  let sqlParams = [
    firstName,
    lastName,
    gender,
    biography,
    picture,
    dob,
    dod,
    profession,
    country,
    authorId,
  ];
  await conn.query(sql, sqlParams);

  res.redirect("/allAuthors");
});

// delete quote
app.delete("/deleteQuote", isAuthenticated, async (req, res) => {
  const { quoteId } = req.body;

  if (!quoteId) {
    return res.status(400).send("Quote ID is required");
  }

  const sql = "DELETE FROM quotes WHERE quoteId = ?";
  const [result] = await conn.query(sql, [quoteId]);

  if (result.affectedRows > 0) {
    res.status(200).send("Quote deleted successfully");
  } else {
    res.status(404).send("Quote not found");
  }
});

// delete author
app.delete("/deleteAuthor", isAuthenticated, async (req, res) => {
  const { authorId } = req.body;

  if (!authorId) {
    return res.status(400).send("Author ID is required");
  }

  const sql = "DELETE FROM authors WHERE authorId = ?";
  const [result] = await conn.query(sql, [authorId]);

  if (result.affectedRows > 0) {
    res.status(200).send("Author deleted successfully");
  } else {
    res.status(404).send("Author not found");
  }
});

// Middleware
function isAuthenticated(req, res, next) {
  if (req.session.authenticated) {
    next();
  } else {
    res.redirect("/");
  }
}

// db
app.get("/dbTest", async (req, res) => {
  let sql = "SELECT CURDATE()";
  const [rows] = await conn.query(sql);
  res.send(rows);
}); //dbTest

app.listen(10040, "0.0.0.0", () => {
  console.log("Express server running");
});
