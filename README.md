<div align="center">

# 🏫 HSCAP Auto-Finder 

**An automated DOM-traversal Chrome Extension to locate Kerala Plus-One allotments by Name.**

[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)]()
[![Chrome Extensions](https://img.shields.io/badge/Chrome_Extension-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white)]()
[![Open Source](https://img.shields.io/badge/Open_Source-Success?style=for-the-badge)]()

</div>

---

## 📖 The Story: Finding a Needle in a Haystack

The Kerala HSCAP (Higher Secondary Centralised Allotment Process) portal is the gateway for students to find their Plus-One school allotments. But there's a catch: to check your result, you need your exact Registration Number and Date of Birth. 

**But what happens if you lose your application details?** A close friend of mine found themselves in exactly this situation. They had lost their registration details right before the allotment results were published, and we had no way to contact anyone who had the number. We needed to find out which school and stream they were allotted to, but we only had their name.

The HSCAP portal does offer a "School-wise" public list, but searching it manually is a nightmare. You have to:
1. Select a District.
2. Select a School from a massive dropdown.
3. Select a specific Stream (Science, Commerce, Humanities) within that school.
4. Manually hit `Ctrl + F` to search the list of admitted students.
5. Repeat for *every single stream* in *every single school*.

Doing this manually across hundreds of schools would take days. As a developer, I knew this was a problem meant for automation. 

I built this Chrome Extension to automate the exact human workflow of clicking, loading, and scanning. You give it a Name and a District, and it acts as an automated search party—traversing through every school and stream, scanning the DOM until it finds a match, and returning the complete allotment details. 

---

## ✨ Features & Interface

### 1. The Command Center Dashboard
The extension isn't just a background script; it features a fully styled Command Center to give you real-time feedback on the scraping process. 
* **Live Counters:** Tracks the number of `Schools Scanned` and `Matches Found`.
* **Status Indicators:** Tells you exactly what the scraper is doing (Idle, Scanning, Paused).
* **Target Logging:** Displays the exact school and stream currently being analyzed.

*(Add your Command Center screenshot here)*
<div align="center">
  <img src="https://i.ibb.co/SDqHK2KR/image.png" alt="HSCAP Command Center" width="600"/>
</div>

### 2. Deep DOM Traversal
The extension accurately mimics human navigation:
* Selects the target district.
* Automatically triggers the asynchronous network requests to load school lists.
* Iterates through the stream tabs inside a loaded school.
* Extracts the HTML table data, searching for the target string (the student's name).

*(Add your simple UI screenshot here)*
<div align="center">
  <img src="https://i.ibb.co/yBZPGChm/image.png" alt="HSCAP Finder V2 UI" width="400"/>
</div>

### 3. Match Alert System
Once the target name is located, the script immediately halts the search and generates a popup containing all the extracted details (Registration Number, School Name, Stream, and Allotment Status). 

---

## 🚀 How to Install (Developer Mode)

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/fadilp5x/hscap-auto-finder.git](https://github.com/fadilp5x/hscap-auto-finder.git)
