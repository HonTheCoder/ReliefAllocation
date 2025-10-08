// viewRes.js - Residents View Page JavaScript
// This file contains all the migrated functionality from the residents modal

import { 
    db, 
    collection, 
    query, 
    where, 
    getDocs,
    auth
} from './firebase.js';

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Global variables
let currentBarangayName = null;
let currentBarangayId = null;
let residentsDataTable = null;
let allResidentsData = [];
let filteredResidentsData = [];

// Show success message
function showSuccess(msg) {
    if (window.Swal) {
        Swal.fire({
            title: 'Success',
            text: msg,
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#16a34a'
        });
    } else {
        alert(msg);
    }
}

// Show error message
function showError(msg) {
    if (window.Swal) {
        Swal.fire({
            title: 'Error',
            text: msg,
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#ef4444'
        });
    } else {
        alert('Error: ' + msg);
    }
}

// Show loading screen
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden', 'fade-out');
        loadingScreen.style.display = 'flex';
        loadingScreen.style.opacity = '1';
        loadingScreen.style.visibility = 'visible';
    }
}

// Hide loading screen
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('fade-out');
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            loadingScreen.style.display = 'none';
        }, 300);
    }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('ViewRes page loaded');
    
    // Show loading screen
    showLoadingScreen();
    
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentBarangayName = urlParams.get('barangay');
    currentBarangayId = urlParams.get('id');
    
    console.log('URL params:', { barangayName: currentBarangayName, barangayId: currentBarangayId });
    
    if (!currentBarangayName) {
        showError('No barangay specified. Redirecting to main page.');
        setTimeout(() => {
            window.location.href = 'main.html';
        }, 2000);
        return;
    }
    
    // Update page title and subtitle
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    if (pageTitle) {
        pageTitle.textContent = `Residents of ${currentBarangayName}`;
    }
    if (pageSubtitle) {
        pageSubtitle.textContent = `Manage and view resident information for ${currentBarangayName}`;
    }
    
    // Initialize authentication check
    initializeAuth();
    
    // Load residents data
    loadResidentsData();
    
    // Setup event listeners
    setupEventListeners();
});

// Initialize authentication
function initializeAuth() {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            console.log('User not authenticated, redirecting to login');
            window.location.href = 'index.html';
        } else {
            console.log('User authenticated:', user.email);
        }
    });
}

// Load residents data from Firebase
async function loadResidentsData() {
    console.log('Loading residents data for:', currentBarangayName);
    
    try {
        // Clear table while loading
        const tableBody = document.getElementById('viewResidentsTableBody');
        if (tableBody) {
            tableBody.innerHTML = ''; // Just clear it, no loading message
        }
        
        // Query residents collection
        const residentsRef = collection(db, "residents");
        const residentsQuery = query(residentsRef, where("barangay", "==", currentBarangayName));
        const querySnapshot = await getDocs(residentsQuery);
        
        console.log(`Found ${querySnapshot.size} residents for ${currentBarangayName}`);
        
        // Clear loading message
        if (tableBody) {
            tableBody.innerHTML = '';
        }
        
        if (querySnapshot.empty) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="14" style="text-align: center; padding: 40px; color: #6b7280;">
                        No residents found for ${currentBarangayName}
                    </td>
                </tr>
            `;
            return;
        }
        
        // Process and display residents data
        const residentsData = [];
        querySnapshot.forEach((doc) => {
            const residentData = { id: doc.id, ...doc.data() };
            residentsData.push(residentData);
        });
        
        // Store data for export functions
        window.residentsData = residentsData;
        allResidentsData = residentsData;
        filteredResidentsData = residentsData;
        
        // Update statistics
        updateStatistics();
        
        // Populate table with residents data
        populateResidentsTable(residentsData);
        
        // Initialize DataTable after data is loaded
        initializeDataTable();
        
        // Setup zone filter after DataTable is initialized
        setTimeout(() => {
            setupZoneFilter();
        }, 100);
        
        // Hide loading screen after data is loaded
        hideLoadingScreen();
        
    } catch (error) {
        console.error('Error loading residents data:', error);
        showError('Failed to load residents data. Please try again.');
        hideLoadingScreen();
        
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="14" style="text-align: center; padding: 40px; color: #ef4444;">
                        Error loading residents data. Please refresh the page.
                    </td>
                </tr>
            `;
        }
    }
}

// Populate residents table
function populateResidentsTable(residentsData) {
    const tableBody = document.getElementById('viewResidentsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    residentsData.forEach((resident) => {
        const row = document.createElement('tr');
        
        // Create table cells with resident data (removed Status column)
        const cells = [
            resident.name || 'N/A',
            resident.age || 'N/A',
            resident.addressZone || 'N/A',
            resident.householdNumber || 'N/A',
            resident.gender || 'N/A',
            resident.householdStatus || 'N/A',
            resident.houseMaterial || 'N/A',
            resident.barangayTerrain || 'N/A',
            resident.familyMembers || 'N/A',
            resident.monthlyIncome || 'N/A',
            resident.aidHistory || 'N/A',
            resident.evacueeHistory || 'N/A',
            getWorkStudentStatus(resident),
            resident.remarks || 'N/A'
        ];
        
        cells.forEach((cellData, index) => {
            const cell = document.createElement('td');
            cell.innerHTML = cellData;
            row.appendChild(cell);
        });
        
        tableBody.appendChild(row);
    });
    
    console.log(`Populated table with ${residentsData.length} residents`);
}

// Get work/student status
function getWorkStudentStatus(resident) {
    if (resident.isStudent && resident.isWorking) {
        return '<span class="status-badge status-both">Both</span>';
    } else if (resident.isStudent) {
        return '<span class="status-badge status-student">Student</span>';
    } else if (resident.isWorking) {
        return '<span class="status-badge status-worker">Working</span>';
    } else {
        return '<span class="status-badge status-none">None</span>';
    }
}

// Get work/student status as plain text (for exports)
function getWorkStudentStatusText(resident) {
    if (resident.isStudent && resident.isWorking) {
        return 'Both';
    } else if (resident.isStudent) {
        return 'Student';
    } else if (resident.isWorking) {
        return 'Working';
    } else {
        return 'None';
    }
}

// Update statistics display
function updateStatistics() {
    const totalResidents = document.getElementById('totalResidents');
    const filteredResidents = document.getElementById('filteredResidents');
    
    if (totalResidents) {
        totalResidents.textContent = allResidentsData.length;
    }
    
    if (filteredResidents) {
        filteredResidents.textContent = filteredResidentsData.length;
    }
}

// Initialize DataTable
function initializeDataTable() {
    console.log('Initializing DataTable...');
    
    // Destroy existing DataTable if it exists
    if (residentsDataTable) {
        residentsDataTable.destroy();
    }
    
    // Initialize DataTable with configurations (no pagination, no built-in search UI)
    residentsDataTable = $('#viewResidentsTable').DataTable({
        paging: false, // Disable pagination
        searching: true, // Keep search functionality enabled (but hide UI)
        info: false, // Hide "Showing X to Y of Z entries"
        lengthChange: false, // Hide "Show X entries" dropdown
        responsive: false,
        scrollX: true, // Only horizontal scroll
        scrollCollapse: false, // Remove scroll collapse to prevent double scrolling
        dom: 't', // Only show the table (t = table)
        language: {
            emptyTable: "No residents data available",
            zeroRecords: "No matching residents found"
        },
        order: [[0, 'asc']], // Sort by name by default
        columnDefs: [
            { targets: '_all', className: 'dt-head-center' }
        ]
    });
    
    console.log('DataTable initialized successfully');
}

// Setup zone filter functionality
function setupZoneFilter() {
    console.log('Setting up zone filter...');
    
    const zoneFilterInput = document.getElementById('modalZoneFilterInput');
    const clearZoneBtn = document.getElementById('clearModalZoneFilter');
    
    if (!zoneFilterInput || !residentsDataTable) {
        console.warn('Zone filter elements or DataTable not found');
        return;
    }
    
    // Zone filter function (exact match)
    function isExactZoneMatch(data, searchValue) {
        if (!searchValue || searchValue.trim() === '') return true;
        
        const addressZone = data[2] || ''; // Address Zone is column index 2
        const normalizedZone = addressZone.toString().toLowerCase().replace(/zone\s*/i, '').trim();
        const normalizedSearch = searchValue.toLowerCase().trim();
        
        return normalizedZone === normalizedSearch;
    }
    
    // Add DataTable search extension for zone filtering
    $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
        // Only apply this filter to our specific table
        if (settings.nTable.id !== 'viewResidentsTable') {
            return true;
        }
        
        const searchValue = zoneFilterInput.value;
        return isExactZoneMatch(data, searchValue);
    });
    
    // Zone filter input event
    zoneFilterInput.addEventListener('input', function() {
        console.log('Zone filter input:', this.value);
        residentsDataTable.draw();
        
        // Update filtered data for statistics
        const zoneValue = this.value.trim();
        if (zoneValue === '') {
            filteredResidentsData = allResidentsData;
        } else {
            filteredResidentsData = allResidentsData.filter(resident => 
                resident.addressZone && resident.addressZone.toString() === zoneValue
            );
        }
        
        // Update statistics
        updateStatistics();
    });
    
    // Clear zone filter button
    if (clearZoneBtn) {
        clearZoneBtn.addEventListener('click', function() {
            console.log('Clearing zone filter');
            zoneFilterInput.value = '';
            residentsDataTable.draw();
            filteredResidentsData = allResidentsData;
            updateStatistics();
            zoneFilterInput.focus();
        });
    }
    
    console.log('Zone filter setup complete');
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Export buttons
    const exportExcelBtn = document.getElementById('exportResidentsExcelBtn');
    const exportPdfBtn = document.getElementById('exportResidentsPDFBtn');
    const printBtn = document.getElementById('printResidentsBtn');
    
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', exportToExcel);
    }
    
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', exportToPDF);
    }
    
    if (printBtn) {
        printBtn.addEventListener('click', printTable);
    }
    
    // Global search functionality
    const globalSearchInput = document.getElementById('globalSearchInput');
    if (globalSearchInput) {
        globalSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            console.log('Global search:', searchTerm);
            
            if (residentsDataTable) {
                // Use DataTable's built-in search even though searching is disabled for UI
                // We'll enable it programmatically for our custom search
                residentsDataTable.search(searchTerm).draw();
            }
        });
    }
    
    console.log('Event listeners setup complete');
}

// Export to Excel functionality
function exportToExcel() {
    console.log('Exporting to Excel...');
    
    try {
        // Use the actual residents data
        let dataToExport = filteredResidentsData.length > 0 ? filteredResidentsData : allResidentsData;
        
        if (dataToExport.length === 0) {
            showError('No data to export');
            return;
        }
        
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws_data = [
            ['Name', 'Age', 'Address Zone', 'Household No', 'Gender', 'Household Status', 
             'House Material', 'Terrain', 'Family Members', 'Monthly Income', 'Aid History', 
             'Evacuee History', 'Work/Student Status', 'Remarks']
        ];
        
        // Add data rows from resident objects
        dataToExport.forEach(resident => {
            const row = [
                resident.name || 'N/A',
                resident.age || 'N/A',
                resident.addressZone || 'N/A',
                resident.householdNumber || 'N/A',
                resident.gender || 'N/A',
                resident.householdStatus || 'N/A',
                resident.houseMaterial || 'N/A',
                resident.barangayTerrain || 'N/A',
                resident.familyMembers || 'N/A',
                resident.monthlyIncome || 'N/A',
                resident.aidHistory || 'N/A',
                resident.evacueeHistory || 'N/A',
                getWorkStudentStatusText(resident),
                resident.remarks || 'N/A'
            ];
            ws_data.push(row);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(wb, ws, "Residents");
        
        // Save file
        const fileName = `${currentBarangayName}_Residents_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showSuccess(`Exported ${dataToExport.length} residents to Excel successfully!`);
        
    } catch (error) {
        console.error('Excel export error:', error);
        showError('Failed to export to Excel. Please try again.');
    }
}

// Debug function to check PDF libraries
function debugPDFLibraries() {
    console.log('=== PDF Library Debug Info ===');
    console.log('window.jsPDF:', window.jsPDF);
    console.log('window.jspdf:', window.jspdf);
    console.log('window.jsPDF?.jsPDF:', window.jsPDF?.jsPDF);
    
    if (window.jsPDF) {
        console.log('jsPDF object keys:', Object.keys(window.jsPDF));
    }
    
    // Check for autoTable
    console.log('autoTable available:', typeof window.jsPDF?.jsPDF?.prototype?.autoTable !== 'undefined');
    console.log('==============================');
}

// Simple, reliable PDF export functionality
function exportToPDF() {
    console.log('Exporting to PDF...');
    
    // Debug the available libraries first
    debugPDFLibraries();
    
    try {
        // Use actual residents data
        let dataToExport = filteredResidentsData.length > 0 ? filteredResidentsData : allResidentsData;
        
        if (dataToExport.length === 0) {
            showError('No data to export');
            return;
        }
        
        // Check if jsPDF is available with better detection
        if (!window.jsPDF && !window.jspdf) {
            console.error('jsPDF not found in window object');
            // Fallback to print method
            printTable();
            return;
        }
        
        // Try different ways to access jsPDF based on the UMD build pattern
        let jsPDF;
        
        // The jsPDF UMD build typically exposes as window.jsPDF.jsPDF
        if (window.jsPDF && typeof window.jsPDF.jsPDF === 'function') {
            jsPDF = window.jsPDF.jsPDF;
            console.log('Found jsPDF at window.jsPDF.jsPDF');
        } else if (typeof window.jsPDF === 'function') {
            jsPDF = window.jsPDF;
            console.log('Found jsPDF at window.jsPDF');
        } else if (window.jspdf && typeof window.jspdf.jsPDF === 'function') {
            jsPDF = window.jspdf.jsPDF;
            console.log('Found jsPDF at window.jspdf.jsPDF');
        } else if (typeof window.jspdf === 'function') {
            jsPDF = window.jspdf;
            console.log('Found jsPDF at window.jspdf');
        }
        
        if (!jsPDF) {
            console.error('Could not access jsPDF constructor');
            console.log('Available constructors:');
            console.log('- window.jsPDF:', typeof window.jsPDF, window.jsPDF);
            console.log('- window.jspdf:', typeof window.jspdf, window.jspdf);
            showError('PDF library not properly loaded. Using print instead.');
            printTable();
            return;
        }
        
        console.log('jsPDF found, creating document...');
        
        // Create new PDF document
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        console.log('PDF document created');
        
        // Simple header
        doc.setFontSize(16);
        doc.text(`Residents of ${currentBarangayName}`, 20, 20);
        
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
        
        // Prepare simple table data
        const headers = ['Name', 'Age', 'Zone', 'Household', 'Gender', 'Status', 'Material', 'Terrain', 'Family', 'Income', 'Aid', 'Evacuee', 'Work/Study', 'Remarks'];
        
        const tableData = [];
        dataToExport.forEach(resident => {
            tableData.push([
                resident.name || 'N/A',
                resident.age || 'N/A', 
                resident.addressZone || 'N/A',
                resident.householdNumber || 'N/A',
                resident.gender || 'N/A',
                resident.householdStatus || 'N/A',
                resident.houseMaterial || 'N/A',
                resident.barangayTerrain || 'N/A',
                resident.familyMembers || 'N/A',
                resident.monthlyIncome || 'N/A',
                resident.aidHistory || 'N/A',
                resident.evacueeHistory || 'N/A',
                getWorkStudentStatusText(resident),
                resident.remarks || 'N/A'
            ]);
        });
        
        console.log('Table data prepared, rows:', tableData.length);
        
        // Add table using autoTable if available
        if (doc.autoTable) {
            console.log('Using autoTable plugin...');
            doc.autoTable({
                head: [headers],
                body: tableData,
                startY: 40,
                styles: { fontSize: 6, cellPadding: 1 },
                headStyles: { fillColor: [37, 99, 235], textColor: 255 },
                margin: { top: 40 }
            });
        } else {
            console.log('autoTable not available, using simple text...');
            // Simple fallback without autoTable
            let yPos = 40;
            
            // Add headers
            doc.setFontSize(8);
            let headerText = headers.join(' | ');
            doc.text(headerText, 20, yPos);
            yPos += 10;
            
            // Add data rows (limit to prevent overflow)
            tableData.slice(0, 20).forEach(row => {
                let rowText = row.map(cell => String(cell).substring(0, 10)).join(' | ');
                doc.text(rowText, 20, yPos);
                yPos += 5;
            });
        }
        
        console.log('Table added to PDF');
        
        // Save the PDF
        const fileName = `${currentBarangayName.replace(/\s+/g, '_')}_Residents_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        console.log('PDF saved:', fileName);
        showSuccess(`PDF exported successfully! File: ${fileName}`);
        
    } catch (error) {
        console.error('PDF export failed:', error);
        console.error('Error details:', error.message, error.stack);
        showError(`PDF export failed: ${error.message}. Trying print instead...`);
        
        // Fallback to print
        setTimeout(() => {
            printTable();
        }, 1000);
    }
}

// Print table functionality
function printTable() {
    console.log('Printing table...');
    
    if (!residentsDataTable) {
        showError('Table not initialized. Please wait and try again.');
        return;
    }
    
    try {
        // Get filtered data
        const data = residentsDataTable.rows({ search: 'applied' }).data().toArray();
        
        if (data.length === 0) {
            showError('No data to print');
            return;
        }
        
        // Create printable content
        const printWindow = window.open('', '_blank');
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Residents of ${currentBarangayName}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #2563eb; text-align: center; }
                    .meta { text-align: center; margin-bottom: 20px; color: #6b7280; }
                    table { width: 100%; border-collapse: collapse; font-size: 10px; }
                    th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
                    th { background-color: #f3f4f6; font-weight: bold; }
                    tr:nth-child(even) { background-color: #f9fafb; }
                    .status-badge { padding: 2px 6px; border-radius: 4px; font-size: 8px; }
                    .status-student { background: #3b82f6; color: white; }
                    .status-worker { background: #10b981; color: white; }
                    .status-both { background: #f59e0b; color: white; }
                    .status-none { background: #6b7280; color: white; }
                    .status-active { background: #16a34a; color: white; }
                    @media print {
                        body { margin: 10px; }
                        table { font-size: 8px; }
                        th, td { padding: 2px; }
                    }
                </style>
            </head>
            <body>
                <h1>Residents of ${currentBarangayName}</h1>
                <div class="meta">
                    <p>Total Residents: ${data.length}</p>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Age</th>
                            <th>Zone</th>
                            <th>Household</th>
                            <th>Gender</th>
                            <th>Status</th>
                            <th>Material</th>
                            <th>Terrain</th>
                            <th>Family</th>
                            <th>Income</th>
                            <th>Aid</th>
                            <th>Evacuee</th>
                            <th>Work/Study</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `
                            <tr>
                                ${row.map(cell => `<td>${cell || 'N/A'}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Wait for content to load then print
        printWindow.onload = function() {
            printWindow.print();
            printWindow.close();
        };
        
        showSuccess(`Prepared print view for ${data.length} residents`);
        
    } catch (error) {
        console.error('Print error:', error);
        showError('Failed to prepare print view. Please try again.');
    }
}

// Cleanup function when leaving the page
window.addEventListener('beforeunload', function() {
    // Cleanup DataTable search extension
    if ($.fn.dataTable && $.fn.dataTable.ext && $.fn.dataTable.ext.search) {
        $.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(function(fn) {
            return fn.toString().indexOf('modalZoneFilterInput') === -1;
        });
    }
    
    console.log('ViewRes page cleanup completed');
});

// Simple test PDF function for debugging
function testSimplePDF() {
    console.log('Testing simple PDF generation...');
    
    try {
        debugPDFLibraries();
        
        let jsPDF;
        if (window.jsPDF && window.jsPDF.jsPDF) {
            jsPDF = window.jsPDF.jsPDF;
        } else if (window.jsPDF) {
            jsPDF = window.jsPDF;
        }
        
        if (!jsPDF) {
            console.error('jsPDF not available for test');
            return;
        }
        
        const doc = new jsPDF();
        doc.text('Hello World - PDF Test', 20, 20);
        doc.text('This is a simple test to verify jsPDF works', 20, 30);
        doc.save('test.pdf');
        
        console.log('Simple PDF test successful!');
        showSuccess('PDF test successful! Check your downloads.');
        
    } catch (error) {
        console.error('PDF test failed:', error);
        showError('PDF test failed: ' + error.message);
    }
}

// Make functions available globally if needed
window.exportToExcel = exportToExcel;
window.exportToPDF = exportToPDF;
window.printTable = printTable;
window.debugPDFLibraries = debugPDFLibraries;
window.testSimplePDF = testSimplePDF;

console.log('ViewRes.js loaded successfully');
