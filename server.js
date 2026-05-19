require("dotenv").config();
// .env file se saari environment variables load karta hai (jaise DATABASE_URL)

const express = require("express");
// Express framework load kiya — isse hi server aur routes banate hain

const cors = require("cors");
// CORS load kiya — ye allow karta hai ki frontend (alag port/domain) se request aa sake

const { PrismaClient } = require("./generated/prisma");
// Prisma ka generated client load kiya — isse DB ke saath baat karte hain

const { PrismaPg } = require("@prisma/adapter-pg");
// PostgreSQL ke liye Prisma adapter load kiya — ye Prisma ko pg se connect karta hai

const Redis = require("ioredis");
// ioredis library load kiya — ye Redis server se connect karne ke liye use hoti hai

const redis = new Redis({ lazyConnect: true, retryStrategy: () => null });
// Redis ka instance banaya — lazyConnect matlab connect tabhi hoga jab zarurat ho, retryStrategy null matlab fail hone pe baar baar retry nahi karega

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
// PostgreSQL adapter banaya — DATABASE_URL .env se liya aur pg connection setup kiya

const prisma = new PrismaClient({ adapter });
// PrismaClient ka instance banaya — ab is prisma variable se DB queries chalenge

const app = express();
// Express app banaya — ye hi hamara actual server hai

const port = 5000;
// Server kis port pe chalega — yahan 5000 set kiya

app.use(cors());
// Har route pe CORS enable kiya — frontend se requests allow hongi

app.use(express.json());
// Incoming request ka body JSON format mein parse karega — req.body kaam karega

// ─── USERS ────────────────────────────────────────────────────

app.get("/users", async (req, res) => {
  // GET /users — saare users fetch karne ka route

  const cached = await redis.get("users");
  // Redis mein "users" key ka data check kiya — agar pehle se saved hai toh wahi return karega

  if (cached) return res.json(JSON.parse(cached));
  // Agar Redis mein data mila (cache hit) toh DB skip karke seedha return kar do

  const users = await prisma.users.findMany({ include: { orders: true } });
  // DB se saare users fetch kiye, saath mein unke orders bhi include kiye

  await redis.set("users", JSON.stringify(users), "EX", 60);
  // Fetched data ko Redis mein 60 seconds ke liye save kiya — agli baar DB nahi jayega

  res.json(users);
  // Users ka data JSON mein response mein bheja
});

app.get("/users/:id", async (req, res) => {
  // GET /users/:id — ek specific user fetch karne ka route

  const user = await prisma.users.findUnique({
    where: { id: Number(req.params.id) },
    // URL se id liya aur Number mein convert kiya kyunki params string hoti hai

    include: { orders: true },
    // Us user ke orders bhi saath mein fetch kiye
  });

  if (!user) return res.status(404).json({ message: "User not found" });
  // Agar user nahi mila toh 404 error return karo

  res.json(user);
  // User ka data JSON mein bheja
});

app.post("/create", async (req, res) => {
  // POST /create — naya user create karne ka route

  const { name, email, city } = req.body;
  // Request body se name, email, city nikala

  const user = await prisma.users.create({ data: { name, email, city } });
  // DB mein naya user insert kiya

  res.status(201).json(user);
  // 201 = Created, naya bana hua user return kiya
});

app.put("/users/:id", async (req, res) => {
  // PUT /users/:id — existing user update karne ka route

  const { name, email, city } = req.body;
  // Request body se updated values nikali

  const user = await prisma.users.update({
    where: { id: Number(req.params.id) },
    // Kis user ko update karna hai — id se identify kiya

    data: { name, email, city },
    // Ye naya data save hoga
  });

  res.json(user);
  // Updated user return kiya
});

app.delete("/users/:id", async (req, res) => {
  // DELETE /users/:id — user delete karne ka route

  await prisma.users.delete({ where: { id: Number(req.params.id) } });
  // DB se us id wala user delete kiya

  res.json({ message: "User deleted" });
  // Confirmation message bheja
});

// ─── TEACHERS ─────────────────────────────────────────────────

app.get("/teachers", async (req, res) => {
  // GET /teachers — saare teachers fetch karne ka route

  const teachers = await prisma.teachers.findMany({
    include: { students: true },
    // Har teacher ke saath uske students bhi fetch kiye
  });

  res.json(teachers);
  // Teachers ka data return kiya
});

app.get("/teachers/:id", async (req, res) => {
  // GET /teachers/:id — ek specific teacher fetch karne ka route

  const teacher = await prisma.teachers.findUnique({
    where: { id: Number(req.params.id) },
    include: { students: true },
  });

  if (!teacher) return res.status(404).json({ message: "Teacher not found" });
  // Teacher nahi mila toh 404 return karo

  res.json(teacher);
});

app.post("/teachers", async (req, res) => {
  // POST /teachers — naya teacher create karne ka route

  const { name, email, subject, experience } = req.body;
  // Body se teacher ki details nikali

  const teacher = await prisma.teachers.create({
    data: { name, email, subject, experience },
    // DB mein naya teacher insert kiya
  });

  res.status(201).json(teacher);
  // Naya teacher return kiya
});

app.put("/teachers/:id", async (req, res) => {
  // PUT /teachers/:id — teacher update karne ka route

  const { name, email, subject, experience } = req.body;

  const teacher = await prisma.teachers.update({
    where: { id: Number(req.params.id) },
    data: { name, email, subject, experience },
  });

  res.json(teacher);
});

app.delete("/teachers/:id", async (req, res) => {
  // DELETE /teachers/:id — teacher delete karne ka route

  await prisma.teachers.delete({ where: { id: Number(req.params.id) } });

  res.json({ message: "Teacher deleted" });
});

// ─── STUDENTS ─────────────────────────────────────────────────

app.get("/students", async (req, res) => {
  // GET /students — saare students fetch karne ka route

  const students = await prisma.students.findMany({
    include: { teachers: true },
    // Har student ke saath uska teacher bhi fetch kiya
  });

  res.json(students);
});

app.get("/students/:id", async (req, res) => {
  // GET /students/:id — ek specific student fetch karne ka route

  const student = await prisma.students.findUnique({
    where: { id: Number(req.params.id) },
    include: { teachers: true },
  });

  if (!student) return res.status(404).json({ message: "Student not found" });

  res.json(student);
});

app.post("/students", async (req, res) => {
  // POST /students — naya student create karne ka route

  const { name, email, city, class: cls, teacher_id } = req.body;
  // class ek reserved word hai JS mein isliye cls naam diya

  const student = await prisma.students.create({
    data: { name, email, city, class: cls, teacher_id },
  });

  res.status(201).json(student);
});

app.put("/students/:id", async (req, res) => {
  // PUT /students/:id — student update karne ka route

  const { name, email, city, class: cls, teacher_id } = req.body;

  const student = await prisma.students.update({
    where: { id: Number(req.params.id) },
    data: { name, email, city, class: cls, teacher_id },
  });

  res.json(student);
});

app.delete("/students/:id", async (req, res) => {
  // DELETE /students/:id — student delete karne ka route

  await prisma.students.delete({ where: { id: Number(req.params.id) } });

  res.json({ message: "Student deleted" });
});

// ─── ORDERS ───────────────────────────────────────────────────

app.get("/orders", async (req, res) => {
  // GET /orders — saare orders fetch karne ka route

  const orders = await prisma.orders.findMany({ include: { users: true } });
  // Har order ke saath uska user bhi fetch kiya

  res.json(orders);
});

app.get("/orders/:id", async (req, res) => {
  // GET /orders/:id — ek specific order fetch karne ka route

  const order = await prisma.orders.findUnique({
    where: { id: Number(req.params.id) },
    include: { users: true },
  });

  if (!order) return res.status(404).json({ message: "Order not found" });

  res.json(order);
});

app.post("/orders", async (req, res) => {
  // POST /orders — naya order create karne ka route

  const { user_id, amount, status } = req.body;
  // Body se order ki details nikali

  const order = await prisma.orders.create({
    data: { user_id, amount, status },
  });

  res.status(201).json(order);
});

app.put("/orders/:id", async (req, res) => {
  // PUT /orders/:id — order update karne ka route

  const { user_id, amount, status } = req.body;

  const order = await prisma.orders.update({
    where: { id: Number(req.params.id) },
    data: { user_id, amount, status },
  });

  res.json(order);
});

app.delete("/orders/:id", async (req, res) => {
  // DELETE /orders/:id — order delete karne ka route

  await prisma.orders.delete({ where: { id: Number(req.params.id) } });

  res.json({ message: "Order deleted" });
});

// ─── START ────────────────────────────────────────────────────

app.listen(port, () => {
  // Server start karo aur port 5000 pe listen karo

  console.log(`Server running on http://localhost:${port}`);
  // Console mein print karo ki server chal raha hai
});
