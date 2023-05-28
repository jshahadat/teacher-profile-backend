const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.qhhqtot.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {
    try {
        const productsCollection = client.db('oldGolden').collection('products');


        const categoriesProductCollection = client.db('oldGolden').collection('categoriesProduct');

        const productCollection = client.db('oldGolden').collection('product');

        const assignmentCollection = client.db('oldGolden').collection('assignment');

        const presentationCollection = client.db('oldGolden').collection('presentation');


        const coursesCollection = client.db('oldGolden').collection('courses');

        const questionCollection = client.db('oldGolden').collection('question');

        const profileCollection = client.db('oldGolden').collection('profile');

        const advertiseCollection = client.db('oldGolden').collection('advertise');


        const usersCollection = client.db('oldGolden').collection('users');

        const questionNumber = client.db('oldGolden').collection('questionNumber');

        const bookingsCollection = client.db('oldGolden').collection('bookings');

        const paymentsCollection = client.db('oldGolden').collection('payments');




        // JWT 
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });


        // 2ND TRY CATEGORY PRODUCT 
        app.get('/categories', async (req, res) => {
            const query = {}
            const cursor = categoriesProductCollection.find(query);
            const categories = await cursor.toArray();
            res.send(categories);
        });



        app.get('/categories/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const products = await categoriesProductCollection.findOne(query);
            res.send(products);
        });


        // ORDERS POST 
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const query = {
                email: booking.email,
                productName: booking.productName
            }

            const alreadyBooked = await bookingsCollection.find(query).toArray();

            if (alreadyBooked.length) {
                const message = `You already have a Order on ${booking.appointmentDate}`
                return res.send({ acknowledged: false, message })
            }

            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });
        // Semester 

        app.get('/semester', async (req, res) => {
            const courses = req.body;
            console.log(courses);
            const query = {
                semeaster: courses.semeaster,
                year: courses.year
            }

            const alreadyBooked = await coursesCollection.find(query).toArray();

            if (alreadyBooked.length) {
                const message = `You already have a Order on ${booking.appointmentDate}`
                return res.send({ acknowledged: false, message })
            }

            const result = await coursesCollection.findOne(courses);
            res.send(result);
        });

        app.get('/myorders', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }

            const query = { email: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        });


        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await bookingsCollection.findOne(query);
            res.send(order);
        })


        // PAYMENT 
        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });


        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })

        // ALL USERS 
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        // all Question Number 
        app.get('/number', async (req, res) => {
            const query = {};
            const number = await questionNumber.find(query).toArray();
            res.send(number);
        });


        //GET ALL SELLERS 
        app.get('/allsellers', async (req, res) => {
            let query = {};
            if (req.query.role === "Seller") {
                query = {
                    role: req.query.role
                }
            }
            const cursor = usersCollection.find(query);
            const allSeller = await cursor.toArray();
            res.send(allSeller);
        });

        // GET ALL CHAPTER_1 
        app.get('/chapterone', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "1CSE-321Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterOne = await cursor.toArray();
            res.send(chapterOne);
        });
        // GET ALL CHAPTER_2 
        app.get('/chaptertwo', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "2CSE-321Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterTwo = await cursor.toArray();
            res.send(chapterTwo);
        });
        // GET ALL CHAPTER_3
        app.get('/chapterthree', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "3CSE-321Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterThree = await cursor.toArray();
            res.send(chapterThree);
        });
        // GET ALL CHAPTER_4
        app.get('/chapterfour', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "4CSE-321Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterFour = await cursor.toArray();
            res.send(chapterFour);
        });
        // GET ALL CHAPTER_5
        app.get('/chapterfive', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "5CSE-321Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterFive = await cursor.toArray();
            res.send(chapterFive);
        });

        // GET ALL CHAPTER_1 course-213 
        app.get('/twoonethreechapterone', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "1CSE-213Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterOne = await cursor.toArray();
            res.send(chapterOne);
        });

        // GET ALL CHAPTER_2 course-213 
        app.get('/twoonethreechaptertwo', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "2CSE-213Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterTwo = await cursor.toArray();
            res.send(chapterTwo);
        });

        // GET ALL CHAPTER_3  course-213 
        app.get('/twoonethreechapterthree', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "3CSE-213Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterThree = await cursor.toArray();
            res.send(chapterThree);
        });
        // GET ALL CHAPTER_4  course-213 
        app.get('/twoonethreechapterfour', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "4CSE-213Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterFour = await cursor.toArray();
            res.send(chapterFour);
        });
        // GET ALL CHAPTER_5  course-213 
        app.get('/twoonethreechapterfive', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "5CSE-213Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterFive = await cursor.toArray();
            res.send(chapterFive);
        });


        // GET ALL CHAPTER_1 course-226 
        app.get('/twotwosixchapterone', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "1CSE-226Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterOne = await cursor.toArray();
            res.send(chapterOne);
        });
        // GET ALL CHAPTER_2 course-226 
        app.get('/twotwosixchaptertwo', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "2CSE-226Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterTwo = await cursor.toArray();
            res.send(chapterTwo);
        });
        // GET ALL CHAPTER_3 course-226 
        app.get('/twotwosixchapterthree', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "3CSE-226Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterThree = await cursor.toArray();
            res.send(chapterThree);
        });
        // GET ALL CHAPTER_4 course-226 
        app.get('/twotwosixchapterfour', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "4CSE-226Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterFour = await cursor.toArray();
            res.send(chapterFour);
        });
        // GET ALL CHAPTER_5 course-226 
        app.get('/twotwosixchapterfive', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "5CSE-226Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterFive = await cursor.toArray();
            res.send(chapterFive);
        });

        // GET ALL CHAPTER_1 course-221 
        app.get('/twotwoonechapterone', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "1CSE-221Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterOne = await cursor.toArray();
            res.send(chapterOne);
        });
        // GET ALL CHAPTER_2 course-221 
        app.get('/twotwoonechaptertwo', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "2CSE-221Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterTwo = await cursor.toArray();
            res.send(chapterTwo);
        });
        // GET ALL CHAPTER_3 course-221 
        app.get('/twotwoonechapterthree', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "3CSE-221Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterThree = await cursor.toArray();
            res.send(chapterThree);
        });
        // GET ALL CHAPTER_4 course-221 
        app.get('/twotwoonechapterfour', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "4CSE-221Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterFour = await cursor.toArray();
            res.send(chapterFour);
        });
        // GET ALL CHAPTER_5 course-221 
        app.get('/twotwoonechapterfive', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "5CSE-221Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterFive = await cursor.toArray();
            res.send(chapterFive);
        });


        // GET ALL CHAPTER_1 course-325 
        app.get('/threetwofivechapterone', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "1CSE-325Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterOne = await cursor.toArray();
            res.send(chapterOne);
        });
        // GET ALL CHAPTER_2 course-325 
        app.get('/threetwofivechaptertwo', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "2CSE-325Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterTwo = await cursor.toArray();
            res.send(chapterTwo);
        });
        // GET ALL CHAPTER_3 course-325 
        app.get('/threetwofivechapterthree', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "3CSE-325Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterThree = await cursor.toArray();
            res.send(chapterThree);
        });
        // GET ALL CHAPTER_4 course-325 
        app.get('/threetwofivechapterone', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "4CSE-325Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterFour = await cursor.toArray();
            res.send(chapterFour);
        });
        // GET ALL CHAPTER_1 course-325 
        app.get('/threetwofivechapterfive', async (req, res) => {
            let query = {};
            if (req.query.chapCode === "5CSE-325Spring") {
                query = {
                    chapCode: req.query.chapCode

                }
            }
            const cursor = questionCollection.find(query);
            const chapterFive = await cursor.toArray();
            res.send(chapterFive);
        });

        // GETT COURSES FOR ASSIGNMENT 
        app.get('/assigncourses', async (req, res) => {
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = coursesCollection.find(query);
            const assigncourses = await cursor.toArray();
            res.send(assigncourses);
        });
        // GETT COURSES FOR PRESENTATION 
        app.get('/presentationcourses', async (req, res) => {
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = coursesCollection.find(query);
            const assigncourses = await cursor.toArray();
            res.send(assigncourses);
        });

        app.get('/mycourses', async (req, res) => {
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = coursesCollection.find(query);
            const mycourses = await cursor.toArray();
            res.send(mycourses);
        });

        // ALLL COURSES FOR ALL QUESTION 
        app.get('/allcourses', async (req, res) => {
            const query = {};
            const courses = await coursesCollection.find(query).toArray();
            res.send(courses);
        });


        // GET  ASSIGNMENT TOPICS 
        app.get('/assigmenttopics', async (req, res) => {
            let query = {};
            if (req.query.courseCode) {
                query = {
                    courseCode: req.query.courseCode
                }
            }
            const cursor = assignmentCollection.find(query);
            const assigmenttopics = await cursor.toArray();
            res.send(assigmenttopics);
        });
        // GET  PRESENTATION TOPICS 
        app.get('/presentationtopics', async (req, res) => {
            let query = {};
            if (req.query.courseCode) {
                query = {
                    courseCode: req.query.courseCode
                }
            }
            const cursor = presentationCollection.find(query);
            const presentationtopics = await cursor.toArray();
            res.send(presentationtopics);
        });

        app.get('/chpters', async (req, res) => {
            let query = {};
            if (req.query.courseCode && req.query.email) {
                query = {
                    courseCode: req.query.courseCode,
                    email: req.query.email
                }
            }
            const cursor = questionCollection.find(query);
            const chpters = await cursor.toArray();
            res.send(chpters);
        });
        // chpter wise question 
        app.get('/chptersquestions', async (req, res) => {
            let query = {};
            if (req.query.chapCode) {
                query = {
                    chapCode: req.query.chapCode
                }
            }
            const cursor = questionCollection.find(query);
            const chptersquestions = await cursor.toArray();
            res.send(chptersquestions);
        });


        app.get('/questionemail', async (req, res) => {
            let query = {};
            if (req.query.chapCode && req.query.email) {
                query = {
                    chapCode: req.query.chapCode,
                    email: req.query.email
                }
            }
            const cursor = questionCollection.find(query);
            const questionemail = await cursor.toArray();
            res.send(questionemail);
        });



        app.get('/chapquestion/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const chapquestion = await questionCollection.findOne(query);
            res.send(chapquestion);
        })

        //   FOR   ALL QUESTION BANK
        app.get('/allquestionchapter/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const question = await coursesCollection.findOne(query);
            res.send(question);
        })
        //   FOR   ALL QUESTION BANK

        app.get('/allquestionchapquestion/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const chapquestion = await questionCollection.findOne(query);
            res.send(chapquestion);
        })

        // get sylabus for chapter  question
        // app.get('/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: ObjectId(id) };
        //     const chapter = await questionCollection.findOne(query);
        //     res.send(chapter);
        // })
        // get sylabus for chapter 
        app.get('/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const question = await coursesCollection.findOne(query);
            res.send(question);
        })

        // get for assignment 
        app.get('/assigncourse/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const question = await coursesCollection.findOne(query);
            res.send(question);
        })
        // get for assignment 
        app.get('/prsentationcourse/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const question = await coursesCollection.findOne(query);
            res.send(question);
        })

        // get question for edit 
        // EDIT 
        app.get('/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const question = await productCollection.findOne(query);
            res.send(question);
        })

        // EDIT QUESTION 
        app.put('/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const question = req.body;
            const option = { upsert: true };
            const updatedquestion = {
                $set: {
                    question: question.question,
                    number: question.number,
                }
            }
            const result = await productCollection.updateOne(filter, updatedquestion, option);
            res.send(result);
        })


        // GET ALL BUYER 
        app.get('/department', async (req, res) => {
            let query = {};
            if (req.query.department === "CE") {
                query = {
                    department: req.query.department
                }
            }
            const cursor = usersCollection.find(query);
            const department = await cursor.toArray();
            res.send(department);
        });

        // check buyer 
        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isBuyer: user?.role === 'Buyer' });
        })



        // check Seller 
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'Seller' });
        })

        // check admin 
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'Admin' });
        })
        // user 
        // app.get('/:email', async (req, res) => {
        //     const email = req.params.email;
        //     const query = { email }
        //     const user = await usersCollection.findOne(query);
        //     // res.send({ isAdmin: user?.role === 'Admin' });
        //     res.send(user);
        // })

        app.get('/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await profileCollection.findOne(query);
            // res.send({ isAdmin: user?.role === 'Admin' });
            res.send(user);
        })

        // Add COURSES  new add
        app.post('/addcourses', async (req, res) => {
            const courses = req.body;
            const result = await coursesCollection.insertOne(courses)
            res.send(result);
        })


        // Add question 
        app.post('/addquestion', async (req, res) => {
            const question = req.body;
            const result = await questionCollection.insertOne(question)
            res.send(result);
        })
        // Add chapters
        app.post('/addchapter', async (req, res) => {
            const question = req.body;
            const result = await questionCollection.insertOne(question)
            res.send(result);
        })
        // Add Product 
        app.post('/product', async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product)
            res.send(result);
        })
        // Add assignment 
        app.post('/addassignment', async (req, res) => {
            const assignment = req.body;
            const result = await assignmentCollection.insertOne(assignment)
            res.send(result);
        })

        // Add presentation 
        app.post('/addpresentation', async (req, res) => {
            const presentation = req.body;
            const result = await presentationCollection.insertOne(presentation)
            res.send(result);
        })
        // Add updateProfile 

        app.post('/profile', async (req, res) => {
            const profile = req.body;
            const result = await profileCollection.insertOne(profile)
            res.send(result);
        })



        // GET MY PRODUCTS 
        app.get('/myproducts', async (req, res) => {
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = productCollection.find(query);
            const product = await cursor.toArray();
            res.send(product);
        });
        // app.get('/myproducts', async (req, res) => {
        //     let query = {};
        //     if (req.query.email) {
        //         query = {
        //             email: req.query.email
        //         }
        //     }
        //     const cursor = productCollection.find(query);
        //     const product = await cursor.toArray();
        //     res.send(product);
        // });


        // GET MY add courses 
        // app.get('/mycourses', async (req, res) => {
        //     let query = {};
        //     if (req.query.email) {
        //         query = {
        //             email: req.query.email
        //         }
        //     }
        //     const cursor = coursesCollection.find(query);
        //     const course = await cursor.toArray();
        //     res.send(course);
        // });






        // GET ALL PRODUCTS IN CATEGORY PAGE 
        app.get('/allproducts', async (req, res) => {
            let query = {};
            if (req.query.categoryName) {
                query = {
                    categoryName: req.query.categoryName
                }
            }
            const cursor = productCollection.find(query);
            const allProduct = await cursor.toArray();
            res.send(allProduct);
        });



        // Users 
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })




        // REPORT PRODUCT 
        app.put('/adertiseproduct/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    reported: 'yes'
                }
            }
            const result = await productCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

        // GET REPORTED PRODUCTS 
        app.get('/repotedproducts', async (req, res) => {
            let query = {};
            if (req.query.reported = "yes") {
                query = {
                    reported: req.query.reported
                }
            }
            const cursor = productCollection.find(query);
            const reportedproduct = await cursor.toArray();
            res.send(reportedproduct);
        });

        // EDIT PRODUCT STATUS 
        app.put('/dashboard/myproduct/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    status: 'sold'
                }
            }
            const result = await productCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });


        // get ADVERTISE PRODUCT WITH YES 
        app.get('/advertiseproduct', async (req, res) => {
            let query = {};
            if (req.query.advertise = "yes") {
                query = {
                    advertise: req.query.advertise
                }
            }
            const cursor = productCollection.find(query);
            const advertiseproduct = await cursor.toArray();
            res.send(advertiseproduct);
        });


        // app.get('/advertiseproduct', async (req, res) => {
        //     let query = {};
        //     if (req.query.reported = "yes") {
        //         query = {
        //             reported: req.query.reported
        //         }
        //     }
        //     const cursor = productCollection.find(query);
        //     const reportedproduct = await cursor.toArray();
        //     res.send(reportedproduct);
        // });

        // 2Nd TRY ADVERtise 
        app.put('/dashboard/advertise/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    advertise: 'yes'
                }
            }
            const result = await productCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });


        // GET ALL PRODUCT 
        app.get('/allproducts', async (req, res) => {
            const query = {};
            const allProducts = await productCollection.find(query).toArray();
            res.send(allProducts);
        });


        // GET ADVERTISE PRODUCT 
        app.get('/advertise', async (req, res) => {
            const query = {};
            const advertise = await advertiseCollection.find(query).toArray();
            res.send(advertise);
        });

        // USERS UPDATE 
        app.put('/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const user = req.body;
            const option = { upsert: true };
            const updateduser = {
                $set: {
                    name: todo.name,
                    date: todo.date,
                }
            }
            const result = await usersCollection.updateOne(filter, updateduser, option);
            res.send(result);
        })


        // VERIFIED SELLER 
        app.put('/dashboard/alluser/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    status: 'Verified'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });


        // DELETE SELLER 
        app.delete('/allseller/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })

        // DELETE BUYERS 
        app.delete('/dashboard/allbuyers/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })


        // DELETE PRODUCT 
        app.delete('/product/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result);
        })

    }
    finally {

    }

}
run().catch(console.log);


app.get('/', async (req, res) => {
    res.send('server is running ')
})

app.listen(port, () => console.log(`server is running ${port}`))
