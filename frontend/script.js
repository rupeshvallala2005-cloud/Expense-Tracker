const API_URL = "http://127.0.0.1:8000";

// HTML elements
const transactionForm = document.getElementById("transactionForm");
const transactionList = document.getElementById("transactionList");

const totalIncome = document.getElementById("totalIncome");
const totalExpenses = document.getElementById("totalExpenses");
const balance = document.getElementById("balance");

const submitButton = document.getElementById("submitButton");
const cancelEdit = document.getElementById("cancelEdit");

let editingTransactionId = null;


// Set today's date automatically
document.getElementById("transactionDate").value =
    new Date().toISOString().split("T")[0];


// Format currency
function formatCurrency(amount) {
    return "₹" + Number(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


// Show dashboard summary
async function loadSummary() {

    try {
        const response = await fetch(`${API_URL}/summary`);

        if (!response.ok) {
            throw new Error("Unable to load summary");
        }

        const data = await response.json();

        totalIncome.textContent = formatCurrency(data.total_income);
        totalExpenses.textContent = formatCurrency(data.total_expenses);
        balance.textContent = formatCurrency(data.balance);

    } catch (error) {
        console.error("Summary error:", error);
    }
}


// Display transactions
async function loadTransactions() {

    try {
        const response = await fetch(`${API_URL}/transactions`);

        if (!response.ok) {
            throw new Error("Unable to load transactions");
        }

        const transactions = await response.json();

        transactionList.innerHTML = "";

        if (transactions.length === 0) {
            transactionList.innerHTML =
                '<tr><td colspan="6">No transactions found.</td></tr>';
            return;
        }

        transactions.forEach(function(transaction) {

            const row = document.createElement("tr");

            const typeClass =
                transaction.transaction_type === "income"
                ? "income-text"
                : "expense-text";

            row.innerHTML = `
                <td>${escapeHTML(transaction.title)}</td>
                <td>${escapeHTML(transaction.category)}</td>

                <td class="${typeClass}">
                    ${escapeHTML(transaction.transaction_type)}
                </td>

                <td class="${typeClass}">
                    ${formatCurrency(transaction.amount)}
                </td>

                <td>${escapeHTML(transaction.transaction_date)}</td>

                <td>
                    <button class="edit-btn"
                        onclick="editTransaction(${transaction.id})">
                        Edit
                    </button>

                    <button class="delete-btn"
                        onclick="deleteTransaction(${transaction.id})">
                        Delete
                    </button>
                </td>
            `;

            transactionList.appendChild(row);

        });

    } catch (error) {
        console.error("Transaction error:", error);

        transactionList.innerHTML =
            '<tr><td colspan="6">Unable to connect to backend.</td></tr>';
    }
}


// Escape text before displaying it
function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, function(character) {

        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return characters[character];

    });
}


// Add or update transaction
transactionForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const transaction = {

        title: document.getElementById("title").value.trim(),

        amount: Number(document.getElementById("amount").value),

        category: document.getElementById("category").value,

        transaction_type:
            document.getElementById("transactionType").value,

        transaction_date:
            document.getElementById("transactionDate").value

    };

    if (!transaction.title || transaction.amount <= 0) {
        alert("Please enter valid transaction details.");
        return;
    }

    const url = editingTransactionId
        ? `${API_URL}/transactions/${editingTransactionId}`
        : `${API_URL}/transactions`;

    const method = editingTransactionId ? "PUT" : "POST";

    try {

        const response = await fetch(url, {

            method: method,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(transaction)

        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || "Transaction failed");
        }

        alert(result.message);

        resetForm();

        await refreshDashboard();

    } catch (error) {

        alert(error.message);

    }

});


// Edit transaction
async function editTransaction(id) {

    try {

        const response = await fetch(`${API_URL}/transactions`);

        const transactions = await response.json();

        const transaction = transactions.find(function(item) {
            return item.id === id;
        });

        if (!transaction) {
            alert("Transaction not found.");
            return;
        }

        document.getElementById("title").value = transaction.title;

        document.getElementById("amount").value = transaction.amount;

        document.getElementById("category").value = transaction.category;

        document.getElementById("transactionType").value =
            transaction.transaction_type;

        document.getElementById("transactionDate").value =
            transaction.transaction_date;

        editingTransactionId = id;

        submitButton.textContent = "Update Transaction";

        cancelEdit.hidden = false;

        document.querySelector(".form-section").scrollIntoView({
            behavior: "smooth"
        });

    } catch (error) {

        alert("Unable to edit transaction.");

    }
}


// Delete transaction
async function deleteTransaction(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/transactions/${id}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || "Delete failed");
        }

        alert(result.message);

        await refreshDashboard();

    } catch (error) {

        alert(error.message);

    }
}


// Reset form
function resetForm() {

    transactionForm.reset();

    editingTransactionId = null;

    submitButton.textContent = "Add Transaction";

    cancelEdit.hidden = true;

    document.getElementById("transactionDate").value =
        new Date().toISOString().split("T")[0];
}


// Cancel editing
cancelEdit.addEventListener("click", function() {
    resetForm();
});


// Refresh dashboard
async function refreshDashboard() {

    await loadSummary();

    await loadTransactions();

    await loadExpenseChart();

}
	let expenseChart = null;


// Load expense chart
async function loadExpenseChart() {

    try {
        const response = await fetch(`${API_URL}/transactions`);

        if (!response.ok) {
            throw new Error("Unable to load chart data");
        }

        const transactions = await response.json();

        // Keep only expense transactions
        const expenses = transactions.filter(function(transaction) {
            return transaction.transaction_type === "expense";
        });

        // Calculate total expenses for each category
        const categoryTotals = {};

        expenses.forEach(function(transaction) {

            if (categoryTotals[transaction.category]) {
                categoryTotals[transaction.category] += transaction.amount;
            } else {
                categoryTotals[transaction.category] = transaction.amount;
            }

        });

        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);

        const chartCanvas = document.getElementById("expenseChart");

        // Remove the old chart before creating a new one
        if (expenseChart) {
            expenseChart.destroy();
        }

        expenseChart = new Chart(chartCanvas, {
            type: "doughnut",

            data: {
                labels: labels,
                datasets: [{
                    label: "Expenses",
                    data: data,
                    backgroundColor: [
                        "#2563eb",
                        "#dc2626",
                        "#f59e0b",
                        "#16a34a",
                        "#7c3aed",
                        "#0891b2",
                        "#db2777"
                    ],
                    borderWidth: 2
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        });

    } catch (error) {
        console.error("Chart error:", error);
    }
}

// Initial loading
refreshDashboard();