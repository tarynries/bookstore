process.env.NODE_ENV = "test"
const request = require("supertest");
const db = require("../db");
const app = require("../app");

let book_isbn;


beforeEach(async function () {

    let result = await db.query(`
        INSERT INTO 
        books (isbn, amazon_url, author, laguage, pages, publisher, title, year)
        VALUES(
            '123432122',
            'https://amazon.com/taco',
            'Elie',
            'English',
            100,
            'Nothing publishers',
            'my first book', 2008)
            RETURNING isbn`);

    book_isbn = result.rows[0].isbn
});

// POST 
describe("POST /books", function () {
    test("creates new book", async function () {
        let response = await request(app)
            .post("/books")
            .send({
                isbn: '123456789',
                amazon_url: 'https://amazon.com/book',
                author: 'Bob',
                language: 'english',
                pages: 250,
                publisher: 'Box Press',
                title: 'Book 1',
                year: 2000
            });
        expect(response.statusCode).toBe(201)
        expect(res.body.book).toHaveProperty('isbn');
    });

    test("Prevents creating book without required title", async function () {
        let response = await request(app)
            .post("/books")
            .send({ year: 2000 })
        expect(response.statusCode).toBe(400)
    });
});

/** GET / => {books: [book, ...]}  */

describe("GET /books", function () {
    test("get list of books", async function () {
        let response = await request(app)
        let books = response.body.books;
        expect(books).toHaveLength(1);
        expect(books[0]).toHaveProperty('isbn')
        expect(books[0]).toHaveProperty('amazon_url')
    });
});

describe("GET /books/:isbn", function () {
    test("get a single book", async function () {
        let response = await request(app)
            .get(`/books/${book_isbn}`)
        expect(response.book.body).toHaveProperty('isbn');
        expect(response.body.book.isbn).toBe(book_isbn);
    });

    test("responds with a 404 if can't find a book in question", async function () {
        let response = await request(app)
            .get(`/books/999`)
        expect(response.statusCode).toBe(404);

    });
});

describe("PUT /books/:id", function () {
    test("updates a single book", async function () {
        let response = await request(app)
            .put(`/books/${book_isbn}`)
            .send({
                amazon_url: 'https://amazon.com/cook',
                author: 'Lily',
                language: 'english',
                pages: 400,
                publisher: 'Box Press',
                title: 'Updated Book',
                year: 2005
            });
        expect(res.body.book).toHaveProperty('isbn');
        expect(response.body.book.title).toBe('Updated Book');
    });

    test("Prevents a bad book update", async function () {
        let response = await request(app)
            .put(`/books/${book_isbn}`)
            .send({
                amazon_url: 'https://amazon.com/cook',
                bad: "do not add me",
                author: 'Lily',
                language: 'english',
                pages: 400,
                publisher: 'Box Press',
                title: 'Updated Book',
                year: 2005
            })
        expect(response.statusCode).toBe(400);
    })

    test("responds with 404 if can't find the book in question", async function () {
        await request(app)
            .delete(`/books/${book_isbn}`)
        const response = await request(app).delete(`/books/${book_isbn}`);
        expect(response.statusCode).toBe(404);
    });
});

describe("DELETE /books/:id", function () {
    test("Deletes a single book", async function () {
        let response = await request(app)
            .delete(`/books/${book_isbn}`)
        expect(response.body).toEqual({ message: "Book Deleted" });
    });
});

afterEach(async function () {
    await db.query("DELETE FROM BOOKS");
});


afterAll(async function () {
    await db.end()
});



