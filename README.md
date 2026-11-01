*# Expense Tracker – Personal Finance Dashboard*



*A web-based Expense Tracker that helps users manage their personal finances by tracking income, expenses, and available balance.*



*## Project Screenshot*



*!\[Expense Tracker Dashboard](screenshots/dashboard.png.png)*



*## Features*



*\* Add income and expense transactions.*

*\* Edit existing transactions.*

*\* Delete transactions.*

*\* View total income, expenses, and available balance.*

*\* Category-wise expense visualization.*

*\* Interactive dashboard.*

*\* Responsive design for desktop and mobile devices.*



*## Technologies Used*



*### Frontend*



*\* HTML*

*\* CSS*

*\* JavaScript*

*\* Chart.js*



*### Backend*



*\* Python*

*\* FastAPI*

*\* SQLite*



*## Project Structure*



*```text*

*ExpenseTracker/*

*├── backend/*

*│   ├── expense\_app.py*

*│   └── requirements.txt*

*├── frontend/*

*│   ├── expense.html*

*│   ├── style.css*

*│   └── script.js*

*├── screenshots/*

*│   └── dashboard.png.png*

*└── README.md*

*```*



*## How to Run*



*### Backend*



*Open PowerShell, navigate to the backend folder, activate your virtual environment, and run:*



*```powershell*

*uvicorn expense\_app:app --reload*

*```*



*### Frontend*



*Open another PowerShell window, navigate to the frontend folder, and run:*



*```powershell*

*python -m http.server 5502*

*```*



*Then open:*



*`http://localhost:5502/expense.html`*



*## Project Goal*



*To provide a simple and user-friendly platform for tracking personal income and expenses.*



