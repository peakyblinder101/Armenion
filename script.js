const beepSound = new Audio('beep-sound.mp3'); // Replace with the correct path to your beep sound file

// Barcode mapping based on provided barcodes
const productAllergyMapping = {
    "2903819405791": ["milk"],
    "6294714805264": ["eggs"],
    "5138462047525": ["fish"],
    "8128404758272": ["shellfish"],
    "7092394074388": ["tree nuts"],
    "3074291483092": ["peanuts"],
    "4082610402470": ["wheat"],
    "2857291437422": ["soybeans"],
};

let registeredUser = null;
let isScanning = false; // Track if scanning is active
let recentScans = []; // Array to store recent scans

// Registration functionality
document.getElementById('registerButton').addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const selectedAllergies = Array.from(document.querySelectorAll('#allergyForm input:checked')).map(input => input.value);

    if (username && password && selectedAllergies.length > 0) {
        registeredUser = { username, password, allergies: selectedAllergies };
        document.getElementById('message').innerText = "Registration Successful! Please log in.";
        document.getElementById('registration').style.display = 'none';
        document.getElementById('login').style.display = 'block';
    } else {
        document.getElementById('message').innerText = "Please fill all fields.";
    }
});

// Login functionality
document.getElementById('loginButton').addEventListener('click', () => {
    const loginUsername = document.getElementById('loginUsername').value;
    const loginPassword = document.getElementById('loginPassword').value;

    if (registeredUser && loginUsername === registeredUser.username && loginPassword === registeredUser.password) {
        document.getElementById('loginMessage').innerText = "Login Successful!";
        document.getElementById('login').style.display = 'none';
        document.getElementById('home').style.display = 'block';
        document.getElementById('profileInfo').innerText = `${registeredUser.username} (Allergies: ${registeredUser.allergies.join(', ')})`;
    } else {
        document.getElementById('loginMessage').innerText = "Invalid username or password.";
    }
});

// Update the profile modal with user info
function updateProfileModal() {
    if (registeredUser) {
        document.getElementById('modalUsername').textContent = registeredUser.username;
        document.getElementById('modalAllergies').textContent = registeredUser.allergies.join(', ') || 'None';
    }
}

// Open profile modal
document.getElementById('profileButton').addEventListener('click', () => {
    updateProfileModal();
    document.getElementById('profileModal').style.display = 'block';
});

// Close modal
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('profileModal').style.display = 'none';
});

// Functionality for scanner
document.getElementById('startScanner').addEventListener('click', () => {
    document.getElementById('scanMessage').innerText = '';
    const scannerContainer = document.getElementById('barcode-scanner');
    scannerContainer.style.display = 'block';
    isScanning = true;

    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: scannerContainer,
        },
        decoder: {
            readers: ["ean_reader"] // Add more readers if needed
        }
    }, (err) => {
        if (err) {
            console.error(err);
            return;
        }
        Quagga.start();
    });

    Quagga.onDetected((result) => {
        if (isScanning) {
            const barcode = result.codeResult.code;
            handleScan(barcode);
        }
    });
});

// Handle barcode scan (both manual and scanner)
function handleScan(barcode) {
    const allergensInBarcode = productAllergyMapping[barcode] || [];

    // Play beep sound after a scan is detected
    beepSound.play();

    // Check for any common allergies between the scanned product and the registered user's allergies
    const commonAllergies = allergensInBarcode.filter(allergy => registeredUser.allergies.includes(allergy));

    if (commonAllergies.length > 0) {
        document.getElementById('scanMessage').innerText = `Warning: This product contains your allergy: ${commonAllergies.join(', ')}`;
    } else {
        document.getElementById('scanMessage').innerText = "Product is safe.";
    }

    // Add to recent scans
    recentScans.unshift(barcode); // Add new scan to the beginning of the array
    updateRecentScans();

    // Stop scanner after a scan is detected
    Quagga.stop();
    document.getElementById('barcode-scanner').style.display = 'none'; // Hide scanner after use
    isScanning = false; // Reset scanning status
}

// Update the recent scans container in the UI
function updateRecentScans() {
    const recentScansContainer = document.getElementById('recentScans');
    recentScansContainer.innerHTML = ''; // Clear previous entries

    // Add each scan to the container
    recentScans.forEach((scan) => {
        const scanItem = document.createElement('div');
        scanItem.className = 'recent-scan-item';
        scanItem.innerText = scan; // Set text to the scanned barcode
        recentScansContainer.appendChild(scanItem);
    });
}

// Handle manual barcode submission
document.getElementById('submitBarcode').addEventListener('click', () => {
    const manualBarcode = document.getElementById('manualBarcode').value;
    if (manualBarcode) {
        handleScan(manualBarcode);
        document.getElementById('manualBarcode').value = ''; // Clear input
    } else {
        document.getElementById('scanMessage').innerText = "Please enter a barcode.";
    }
});

// Logout functionality
document.getElementById('logoutButton').addEventListener('click', () => {
    registeredUser = null;
    document.getElementById('home').style.display = 'none';
    document.getElementById('registration').style.display = 'block';
    document.getElementById('message').innerText = '';
    document.getElementById('loginMessage').innerText = '';

    // Stop the scanner if it's active
    if (isScanning) {
        Quagga.stop();
        document.getElementById('barcode-scanner').style.display = 'none'; // Hide scanner
        isScanning = false; // Reset scanning status
    }

    // Clear previous input fields
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('scanMessage').innerText = '';
    recentScans = []; // Clear recent scans
    updateRecentScans(); // Update recent scans display

    // Reset allergy checkboxes
    const allergyCheckboxes = document.querySelectorAll('#allergyForm input[type="checkbox"]');
    allergyCheckboxes.forEach(checkbox => {
        checkbox.checked = false; // Uncheck all allergy checkboxes
    });
});
