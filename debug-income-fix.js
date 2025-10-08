// Debug script to test the income categorization fix
// Run this in the browser console when on the statistics page

console.log('🔧 Starting Income Categorization Debug Test');

// Test the categorization logic
function testIncomeCategorizationLogic() {
    console.log('\n📊 Testing Income Categorization Logic:');
    
    // Sample test data similar to your actual residents
    const testResidents = [
        { name: "Mark John Alvarez", isStudent: true, monthlyIncome: 0 },
        { name: "Test Student 2", isStudent: true, monthlyIncome: 5000 }, // Student with income should still be "Student"
        { name: "Low Income Worker", isStudent: false, monthlyIncome: 10000 },
        { name: "Zero Income Non-Student", isStudent: false, monthlyIncome: 0 },
        { name: "Mid Income Worker", isStudent: false, monthlyIncome: 20000 },
        { name: "High Income Worker", isStudent: false, monthlyIncome: 50000 }
    ];
    
    const categories = { student: 0, low: 0, mid: 0, high: 0 };
    
    testResidents.forEach((r, index) => {
        const monthlyIncome = Number(r.monthlyIncome) || 0;
        const isStudent = r.isStudent === true;
        
        let category = '';
        
        if (isStudent) {
            categories.student += 1;
            category = 'Student';
        } else {
            if (monthlyIncome === 0 || monthlyIncome < 15000) {
                categories.low += 1;
                category = 'Low Income';
            } else if (monthlyIncome >= 15000 && monthlyIncome < 30000) {
                categories.mid += 1;
                category = 'Mid Income';
            } else {
                categories.high += 1;
                category = 'High Income';
            }
        }
        
        console.log(`${index + 1}. ${r.name}: ${isStudent ? 'Student✓' : 'Student✗'}, Income: ₱${monthlyIncome} → ${category}`);
    });
    
    console.log('\n📈 Final Categories:');
    console.log(`👨‍🎓 Students: ${categories.student}`);
    console.log(`🔴 Low Income: ${categories.low}`);
    console.log(`🟡 Mid Income: ${categories.mid}`);
    console.log(`🟢 High Income: ${categories.high}`);
    console.log(`📊 Total: ${categories.student + categories.low + categories.mid + categories.high}`);
}

// Check if required elements exist
function checkRequiredElements() {
    console.log('\n🔍 Checking Required Elements:');
    
    const elements = [
        { id: 'incomeCategorizationChart', description: 'Income Chart Canvas' },
        { id: 'incomeLegend', description: 'Income Chart Legend' },
        { id: 'incomeStatsSummary', description: 'Income Stats Summary' },
        { id: 'barangayStatisticsContainer', description: 'Barangay Statistics Container' }
    ];
    
    elements.forEach(el => {
        const element = document.getElementById(el.id);
        const exists = element !== null;
        const visible = exists ? getComputedStyle(element).display !== 'none' : false;
        console.log(`${exists ? '✅' : '❌'} ${el.description} (${el.id}): ${exists ? 'Found' : 'Missing'}${exists ? ` - ${visible ? 'Visible' : 'Hidden'}` : ''}`);
    });
}

// Check if functions are available
function checkFunctions() {
    console.log('\n🔧 Checking Functions:');
    
    const functions = [
        'loadIncomeCategorizationChart',
        'toggleIncome'
    ];
    
    functions.forEach(funcName => {
        const exists = typeof window[funcName] === 'function';
        console.log(`${exists ? '✅' : '❌'} ${funcName}: ${exists ? 'Available' : 'Missing'}`);
    });
}

// Check current user and section
function checkCurrentState() {
    console.log('\n📋 Current State:');
    
    // Check if we're in statistics section
    const statsSection = document.getElementById('statistics');
    const barangayContainer = document.getElementById('barangayStatisticsContainer');
    
    const statsVisible = statsSection && !statsSection.classList.contains('hidden');
    const barangayVisible = barangayContainer && !barangayContainer.classList.contains('hidden');
    
    console.log(`📊 Statistics Section: ${statsVisible ? 'Active' : 'Inactive'}`);
    console.log(`🏘️ Barangay Container: ${barangayVisible ? 'Visible' : 'Hidden'}`);
    
    // Check user role if available
    if (typeof loggedInUserData !== 'undefined' && loggedInUserData) {
        console.log(`👤 User Role: ${loggedInUserData.role}`);
        if (loggedInUserData.role === 'barangay') {
            const barangayName = loggedInUserData.username.replace('barangay_', '');
            console.log(`🏘️ Barangay Name: ${barangayName}`);
        }
    } else {
        console.log('👤 User Data: Not available');
    }
}

// Main debug function
function runDebugTest() {
    console.log('🔬 Running Complete Debug Test\n');
    
    testIncomeCategorizationLogic();
    checkRequiredElements();
    checkFunctions();
    checkCurrentState();
    
    console.log('\n💡 Instructions:');
    console.log('1. Make sure you are logged in as a barangay user');
    console.log('2. Navigate to "Priority Statistics" section');
    console.log('3. Scroll down to see the "Income Distribution Analysis" chart');
    console.log('4. If elements are missing, refresh the page and try again');
    console.log('5. Check browser console for any error messages');
}

// Auto-run the debug test
runDebugTest();

// Make functions available globally for manual testing
window.debugIncomeCategorizationLogic = testIncomeCategorizationLogic;
window.debugCheckElements = checkRequiredElements;
window.debugCheckFunctions = checkFunctions;
window.debugCurrentState = checkCurrentState;
window.runIncomeDebugTest = runDebugTest;