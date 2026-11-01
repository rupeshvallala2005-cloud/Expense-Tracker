from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sqlite3
from datetime import date

app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to SQLite database
def get_connection():
    conn = sqlite3.connect("expenses.db")
    conn.row_factory = sqlite3.Row
    return conn


# Create database table
def create_table():
    conn = get_connection()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            transaction_type TEXT NOT NULL,
            transaction_date TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


create_table()


# Transaction details
class Transaction(BaseModel):
    title: str
    amount: float
    category: str
    transaction_type: str
    transaction_date: date


# Home route
@app.get("/")
def home():
    return {"message": "Expense Tracker Backend is Running"}


# Add transaction
@app.post("/transactions")
def add_transaction(transaction: Transaction):

    if transaction.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Amount must be greater than zero"
        )

    if transaction.transaction_type not in ["income", "expense"]:
        raise HTTPException(
            status_code=400,
            detail="Type must be income or expense"
        )

    conn = get_connection()

    conn.execute("""
        INSERT INTO transactions
        (title, amount, category, transaction_type, transaction_date)
        VALUES (?, ?, ?, ?, ?)
    """, (
        transaction.title,
        transaction.amount,
        transaction.category,
        transaction.transaction_type,
        str(transaction.transaction_date)
    ))

    conn.commit()
    conn.close()

    return {"message": "Transaction added successfully"}


# View all transactions
@app.get("/transactions")
def get_transactions():

    conn = get_connection()

    transactions = conn.execute("""
        SELECT * FROM transactions
        ORDER BY transaction_date DESC, id DESC
    """).fetchall()

    conn.close()

    return [dict(row) for row in transactions]


# Dashboard summary
@app.get("/summary")
def get_summary():

    conn = get_connection()

    income = conn.execute("""
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions
        WHERE transaction_type = 'income'
    """).fetchone()[0]

    expenses = conn.execute("""
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions
        WHERE transaction_type = 'expense'
    """).fetchone()[0]

    conn.close()

    return {
        "total_income": income,
        "total_expenses": expenses,
        "balance": income - expenses
    }


# Delete transaction
@app.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: int):

    conn = get_connection()

    result = conn.execute(
        "DELETE FROM transactions WHERE id = ?",
        (transaction_id,)
    )

    conn.commit()
    deleted = result.rowcount
    conn.close()

    if deleted == 0:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    return {"message": "Transaction deleted successfully"}


# Edit transaction
@app.put("/transactions/{transaction_id}")
def update_transaction(
    transaction_id: int,
    transaction: Transaction
):

    if transaction.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Amount must be greater than zero"
        )

    if transaction.transaction_type not in ["income", "expense"]:
        raise HTTPException(
            status_code=400,
            detail="Type must be income or expense"
        )

    conn = get_connection()

    result = conn.execute("""
        UPDATE transactions
        SET title = ?,
            amount = ?,
            category = ?,
            transaction_type = ?,
            transaction_date = ?
        WHERE id = ?
    """, (
        transaction.title,
        transaction.amount,
        transaction.category,
        transaction.transaction_type,
        str(transaction.transaction_date),
        transaction_id
    ))

    conn.commit()
    updated = result.rowcount
    conn.close()

    if updated == 0:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    return {"message": "Transaction updated successfully"}
