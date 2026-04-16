const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1l-gOnFv7jHAhJlxwT8Z9bPwhNsMeGjhjxBsCPTbe5vA/export?format=csv';

// App State
let processedRowsCount = 0;
let leavesData = [];

// DOM Elements
const clockElement = document.getElementById('clock');
const totalBooksElement = document.getElementById('total-books');
const lastUpdateElement = document.getElementById('last-update');
const recentActivityElement = document.getElementById('recent-activity');
const leavesLayer = document.getElementById('leaves-layer');
const leafTemplate = document.getElementById('leaf-template');

// Initialize Clock
function updateClock() {
    const now = new Date();
    clockElement.textContent = now.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
}
setInterval(updateClock, 1000);
updateClock();

// Fetch Data
function fetchSheetData() {
    // Thêm timestamp để trình duyệt không lưu cache bản cũ
    const currentUrl = SHEET_CSV_URL + '&t=' + Date.now();
    
    Papa.parse(currentUrl, {
        download: true,
        header: false,
        skipEmptyLines: true,
        complete: function(results) {
            processData(results.data);
            
            const now = new Date();
            lastUpdateElement.textContent = now.toLocaleTimeString('vi-VN');
        },
        error: function(error) {
            console.error("Error fetching data:", error);
            lastUpdateElement.textContent = "Lỗi kết nối!";
        }
    });
}

// Process Data and Render Tree
function processData(data) {
    if (!data || data.length <= 1) return; // No data or just header
    
    const rows = data.slice(1); // Skip header row
    
    // Check if we have new rows
    if (rows.length > processedRowsCount) {
        const newRows = rows.slice(processedRowsCount);
        
        newRows.forEach((row, index) => {
            // Mapping based on CSV columns:
            // 0: Timestamp, 1: Name, 2: Grade, 3: Pages, 4: Book Name, 5: Impression
            const timestamp = row[0];
            const name = row[1] ? row[1].trim() : 'Ẩn danh';
            const grade = row[2] ? row[2].trim() : 'Chưa rõ';
            const pages = row[3] ? row[3].trim() : 'Chưa rõ';
            const bookName = row[4] ? row[4].trim() : 'Sách chưa rõ tên';
            const impression = row[5] ? row[5].trim() : 'Không chia sẻ';
            
            const detailedData = { name, grade, pages, bookName, impression };
            
            // Add Leaf to Tree
            addLeafToTree(detailedData);
            
            // Add Activity Log
            addActivitySnippet(name, bookName, timestamp);
        });
        
        processedRowsCount = rows.length;
        
        // Update stats
        animateValue(totalBooksElement, parseInt(totalBooksElement.textContent), processedRowsCount, 1000);
    }
}

// Add Leaf Graphic to SVG Container
function addLeafToTree(data) {
    // Clone template
    const leafNode = document.importNode(leafTemplate.content, true);
    const leafElement = leafNode.querySelector('.leaf');
    
    // Populate Tooltip
    leafElement.querySelector('.leaf-author').textContent = data.name;
    leafElement.querySelector('.leaf-book').textContent = data.bookName;
    
    // Add Click listener for Modal
    leafElement.addEventListener('click', () => openModal(data));
    
    // Assign Random Color variation (1 to 5)
    leafElement.dataset.color = Math.floor(Math.random() * 5) + 1;
    
    // Calculate Random Position on Tree Canopy
    // Tree Container width/height boundaries logic
    // We roughly know the tree is centered. 
    // Container is relative. Position in % for responsiveness.
    const containerRect = leavesLayer.parentElement.getBoundingClientRect();
    
    // Canopy area roughly 20% to 80% width, 10% to 60% height
    const randomX = 20 + Math.random() * 60; 
    const randomY = 10 + Math.random() * 50;
    
    leafElement.style.left = `${randomX}%`;
    leafElement.style.top = `${randomY}%`;
    
    // Random initial rotation for variety
    const rotation = -30 + Math.random() * 60;
    leafElement.style.transform = `scale(0) rotate(${rotation}deg)`;
    
    // Minor delay so leaves don't all pop at the exact same ms during initial load
    setTimeout(() => {
        leavesLayer.appendChild(leafElement);
    }, Math.random() * 1000);
}

// Add Item to Sidebar
function addActivitySnippet(name, bookName, timestamp) {
    const div = document.createElement('div');
    div.className = 'activity-item';
    div.innerHTML = `
        <strong>${name}</strong>
        <span>Đã đọc: ${bookName}</span>
    `;
    
    // Insert at top
    recentActivityElement.insertBefore(div, recentActivityElement.firstChild);
    
    // Keep only latest 10
    if (recentActivityElement.children.length > 10) {
        recentActivityElement.removeChild(recentActivityElement.lastChild);
    }
}

// Stats Animation Helper
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Initialize Application
function initApp() {
    // Add SVG Gradients dynamically mapped
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
        <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#4e342e" />
            <stop offset="50%" stop-color="#5d4037" />
            <stop offset="100%" stop-color="#3e2723" />
        </linearGradient>
    `;
    document.querySelector('.tree-svg').prepend(defs);

    // Initial Fetch
    fetchSheetData();
    
    // Set Interval to Poll every 5 seconds (5000ms)
    setInterval(fetchSheetData, 5000);
}

// Start
initApp();

// --- Modal Logic ---
const leafModal = document.getElementById('leaf-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalName = document.getElementById('modal-name');
const modalGrade = document.getElementById('modal-grade');
const modalBook = document.getElementById('modal-book');
const modalPages = document.getElementById('modal-pages');
const modalReview = document.getElementById('modal-review');

function openModal(data) {
    modalName.textContent = data.name;
    modalGrade.textContent = data.grade;
    modalBook.textContent = data.bookName;
    modalPages.textContent = data.pages;
    modalReview.textContent = data.impression || 'Không chia sẻ';
    
    leafModal.classList.add('show');
}

closeModalBtn.addEventListener('click', () => {
    leafModal.classList.remove('show');
});

// Click outside modal to close
leafModal.addEventListener('click', (e) => {
    if (e.target === leafModal) {
        leafModal.classList.remove('show');
    }
});
