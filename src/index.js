const express = require("express");
const { v4: uuid } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

function verifyIfAccountExists(req, res, next) {
    const { cpf } = req.headers;

    const customer = customers.find(customer => customer.cpf === cpf);

    if (!customer) {
        return res.status(400).json({
            error: "User not found"
        })
    }

    req.customer = customer;

    return next();
}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === "credit")
            acc += operation.amount;
        else
            acc -= operation.amount;

        return acc;
    }, 0);

    return balance;
}

app.get("/account", verifyIfAccountExists, (req, res) => {
    const { customer } = req;

    return res.status(200).json(customer);
});

app.post("/account", (req, res) => {
    const { cpf, name } = req.body;
    const customerAlreadyExists = customers.some(customer => customer.cpf === cpf);

    if (customerAlreadyExists) {
        return res.status(400).json({
            error: "User already exists"
        });
    }

    customers.push({
        id: uuid(),
        name,
        cpf,
        statement: []
    });

    return res.status(201).send();
});

app.put("/account", verifyIfAccountExists, (req, res) => {
    const { customer } = req;
    const { name } = req.body;

    customer.name = name;

    return res.status(201).send();
});

app.delete("/account", verifyIfAccountExists, (req, res) => {
    const { customer } = req;

    customers.splice(customers.indexOf(customer), 1);

    return res.status(204).send();
});

app.get("/statement", verifyIfAccountExists, (req, res) => {

    const { customer } = req;

    return res.status(200).json(customer.statement);
});

app.post("/deposit", verifyIfAccountExists, (req, res) => {
    const { customer } = req;
    const { description, amount } = req.body;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    };

    customer.statement.push(statementOperation);

    return res.status(201).send();
});

app.post("/withdraw", verifyIfAccountExists, (req, res) => {
    const { customer } = req;
    const { amount } = req.body;
    const balance = getBalance(customer.statement);

    if (balance < amount) {
        return res.status(400).json({
            error: "Insufficient funds"
        });
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    };

    customer.statement.push(statementOperation);

    return res.status(201).send();
});

app.get("/balance", verifyIfAccountExists, (req, res) => {
    const { customer } = req;

    return res.status(200).json(getBalance(customer.statement));
});

app.get("/statement/date", verifyIfAccountExists, (req, res) => {
    const { customer } = req;
    const { date } = req.query;

    const dateFormat = new Date(date + " 00:00");

    const statements = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString())

    return res.status(200).json(statements);
})


app.listen(3333);