require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("./generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// ─── USERS ────────────────────────────────────────────────────

app.get("/users", async (req, res) => {
  const users = await prisma.users.findMany({ include: { orders: true } });
  res.json(users);
});

app.get("/users/:id", async (req, res) => {
  const user = await prisma.users.findUnique({
    where: { id: Number(req.params.id) },
    include: { orders: true },
  });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

app.post("/users", async (req, res) => {
  const { name, email, city } = req.body;
  const user = await prisma.users.create({ data: { name, email, city } });
  res.status(201).json(user);
});

app.put("/users/:id", async (req, res) => {
  const { name, email, city } = req.body;
  const user = await prisma.users.update({
    where: { id: Number(req.params.id) },
    data: { name, email, city },
  });
  res.json(user);
});

app.delete("/users/:id", async (req, res) => {
  await prisma.users.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: "User deleted" });
});

// ─── TEACHERS ─────────────────────────────────────────────────

app.get("/teachers", async (req, res) => {
  const teachers = await prisma.teachers.findMany({ include: { students: true } });
  res.json(teachers);
});

app.get("/teachers/:id", async (req, res) => {
  const teacher = await prisma.teachers.findUnique({
    where: { id: Number(req.params.id) },
    include: { students: true },
  });
  if (!teacher) return res.status(404).json({ message: "Teacher not found" });
  res.json(teacher);
});

app.post("/teachers", async (req, res) => {
  const { name, email, subject, experience } = req.body;
  const teacher = await prisma.teachers.create({ data: { name, email, subject, experience } });
  res.status(201).json(teacher);
});

app.put("/teachers/:id", async (req, res) => {
  const { name, email, subject, experience } = req.body;
  const teacher = await prisma.teachers.update({
    where: { id: Number(req.params.id) },
    data: { name, email, subject, experience },
  });
  res.json(teacher);
});

app.delete("/teachers/:id", async (req, res) => {
  await prisma.teachers.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: "Teacher deleted" });
});

// ─── STUDENTS ─────────────────────────────────────────────────

app.get("/students", async (req, res) => {
  const students = await prisma.students.findMany({ include: { teachers: true } });
  res.json(students);
});

app.get("/students/:id", async (req, res) => {
  const student = await prisma.students.findUnique({
    where: { id: Number(req.params.id) },
    include: { teachers: true },
  });
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json(student);
});

app.post("/students", async (req, res) => {
  const { name, email, city, class: cls, teacher_id } = req.body;
  const student = await prisma.students.create({
    data: { name, email, city, class: cls, teacher_id },
  });
  res.status(201).json(student);
});

app.put("/students/:id", async (req, res) => {
  const { name, email, city, class: cls, teacher_id } = req.body;
  const student = await prisma.students.update({
    where: { id: Number(req.params.id) },
    data: { name, email, city, class: cls, teacher_id },
  });
  res.json(student);
});

app.delete("/students/:id", async (req, res) => {
  await prisma.students.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: "Student deleted" });
});

// ─── ORDERS ───────────────────────────────────────────────────

app.get("/orders", async (req, res) => {
  const orders = await prisma.orders.findMany({ include: { users: true } });
  res.json(orders);
});

app.get("/orders/:id", async (req, res) => {
  const order = await prisma.orders.findUnique({
    where: { id: Number(req.params.id) },
    include: { users: true },
  });
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
});

app.post("/orders", async (req, res) => {
  const { user_id, amount, status } = req.body;
  const order = await prisma.orders.create({ data: { user_id, amount, status } });
  res.status(201).json(order);
});

app.put("/orders/:id", async (req, res) => {
  const { user_id, amount, status } = req.body;
  const order = await prisma.orders.update({
    where: { id: Number(req.params.id) },
    data: { user_id, amount, status },
  });
  res.json(order);
});

app.delete("/orders/:id", async (req, res) => {
  await prisma.orders.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: "Order deleted" });
});

// ─── START ────────────────────────────────────────────────────

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
