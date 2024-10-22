// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';
import { getFirestore, setDoc, doc, collection, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";  // Correct Storage import

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyADxi3zu6KuQE_o6VzaCZ5TUzSZ6efyQnU",
    authDomain: "memorylane-69159.firebaseapp.com",
    projectId: "memorylane-69159",
    storageBucket: "memorylane-69159.appspot.com",
    messagingSenderId: "993836375281",
    appId: "1:993836375281:web:b27fc58d0f3b7a67c21d50"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Function to show messages (notifications)
function showMessage(message, divId) {
    const messageDiv = document.getElementById(divId);
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
    messageDiv.style.opacity = 1;
    setTimeout(function () {
        messageDiv.style.opacity = 0;
    }, 5000);
}

// Fetch doctors from Firestore and populate the dropdown
async function fetchDoctors() {
    const doctorDropdown = document.getElementById('doctor-selection');
    doctorDropdown.innerHTML = ''; // Clear existing options

    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            // Check if the user's role is 'doctor'
            if (userData.role === 'doctor') {
                const option = document.createElement('option');
                option.value = doc.id; // Use doctor ID as the value
                option.textContent = userData.fullName; // Display doctor's name
                doctorDropdown.appendChild(option);
            }
        });
    } catch (error) {
        console.error("Error fetching doctors: ", error);
    }
}

// Fetch patients from Firestore and populate the dropdown
async function fetchPatients() {
    const patientDropdown = document.getElementById('patient-selection');
    patientDropdown.innerHTML = ''; // Clear existing options

    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            // Check if the user's role is 'patient'
            if (userData.role === 'patient') {
                const option = document.createElement('option');
                option.value = doc.id; // Use patient ID as the value
                option.textContent = userData.fullName; // Display patient's name
                patientDropdown.appendChild(option);
            }
        });
    } catch (error) {
        console.error("Error fetching patients: ", error);
    }
}

// Sign Up functionality
const signup = document.getElementById('submitSignUp');
if (signup) {
    signup.addEventListener("click", async (event) => {
        event.preventDefault();

        // Get form values
        const name = document.getElementById('fullname').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const age = document.getElementById('age').value;
        const gender = document.getElementById('gender').value;
        const role = document.getElementById('signup-role').value;
        const selectedDoctorId = document.getElementById('doctor-selection').value;
        const selectedPatientId = document.getElementById('patient-selection').value; // For caretakers
        const licenseNumber = document.getElementById('license-number').value; // For doctors

        // Validate role selection
        if (role === "") {
            showMessage("Please select a role", "signUpMessage");
            return;
        }

        // Prepare user data
        const userData = {
            email: email,
            fullName: name,
            age: age,
            gender: gender,
            role: role,
        };

        if (role === 'patient' && selectedDoctorId) {
            userData.selectedDoctorId = selectedDoctorId; // Link selected doctor to patient
        }

        if (role === 'caretaker' && selectedPatientId) {
            userData.selectedPatientId = selectedPatientId; // Link selected patient to caretaker
        }

        if (role === 'doctor') {
            userData.licenseNumber = licenseNumber; // Add license number for doctors
        }

        try {
            // Create the user with email and password
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            showMessage('Account Created Successfully', 'signUpMessage');

            // Save user data in Firestore
            const docRef = doc(db, 'users', user.uid);
            await setDoc(docRef, userData);

            // Redirect based on the role
            if (role === 'patient') {
                window.location.href = 'patient-dashboard.html';
            } else if (role === 'caretaker') {
                window.location.href = 'caretaker-dashboard.html';
            } else if (role === 'doctor') {
                window.location.href = 'doctor-dashboard.html';
            }
        } catch (error) {
            const errorCode = error.code;
            if (errorCode === 'auth/email-already-in-use') {
                showMessage('Email Already Exists', 'signUpMessage');
            } else {
                showMessage('Unable to create user', 'signUpMessage');
            }
        }
    });
}

// Show/hide additional fields based on role
document.addEventListener('DOMContentLoaded', function () {
    const signupRole = document.getElementById('signup-role');
    const doctorDropdownContainer = document.getElementById('doctor-dropdown-container');
    const licenseNumberContainer = document.getElementById('license-number-container');
    const patientDropdownContainer = document.getElementById('patient-dropdown-container'); // Container for patient selection

    if (signupRole && doctorDropdownContainer && licenseNumberContainer && patientDropdownContainer) {
        signupRole.addEventListener('change', function () {
            const role = this.value;

            // Show doctor selection for patients
            if (role === 'patient') {
                doctorDropdownContainer.classList.remove('hidden');
                fetchDoctors();  // Call function to populate dropdown with doctors
            } else {
                doctorDropdownContainer.classList.add('hidden');
            }

            // Show license number input for doctors
            if (role === 'doctor') {
                licenseNumberContainer.classList.remove('hidden');
            } else {
                licenseNumberContainer.classList.add('hidden');
            }

            // Show patient selection for caretakers
            if (role === 'caretaker') {
                patientDropdownContainer.classList.remove('hidden');
                fetchPatients();  // Call function to populate dropdown with patients
            } else {
                patientDropdownContainer.classList.add('hidden');
            }
        });
    }
});


// Sign In functionality
const signIn = document.getElementById('loginsubmit');
if (signIn) {
    signIn.addEventListener('click', (event) => {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const role = document.getElementById('login-role').value;

        if (role === "") {
            showMessage("Please select a role", "signInMessage");
            return; // Prevent further execution if no role is selected
        }

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                showMessage('Login is successful', 'signInMessage');
                localStorage.setItem('loggedInUserId', user.uid);

                // Redirect based on the selected role
                if (role === 'patient') {
                    window.location.href = 'patient-dashboard.html';
                } else if (role === 'caretaker') {
                    window.location.href = 'caretaker-dashboard.html';
                } else if (role === 'doctor') {
                    window.location.href = 'doctor-dashboard.html';
                }
            })
            .catch((error) => {
                const errorCode = error.code;
                if (errorCode === 'auth/invalid-credential') {
                    showMessage('Incorrect Email or Password', 'signInMessage');
                } else {
                    showMessage('Account does not exist', 'signInMessage');
                }
            });
    });
}

// Ensure the script starts with selecting necessary HTML elements
const userAuthSection = document.getElementById('user-auth-section'); // Ensure this matches your HTML ID
const userDetailsContainer = document.getElementById('user-details'); // Ensure this matches your HTML ID
const patientsContainer = document.getElementById('patient-list'); // Updated to match your provided HTML

// Check if user is logged in when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Firebase Auth State Change Listener
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Update Auth Section to show Logout button
            userAuthSection.innerHTML = `
                <button class="btn-accent w-[120px] h-[50px] lg:p-0 p-2 rounded-lg text-white hover:text-black" id="logout-btn">
                    Logout
                </button>
            `;

            // Add logout functionality
            const logoutBtn = document.getElementById('logout-btn');
            logoutBtn.addEventListener('click', () => {
                signOut(auth).then(() => {
                    localStorage.removeItem('loggedInUserId');
                    window.location.href = 'index.html';  // Redirect to home page after logout
                }).catch((error) => {
                    console.error('Logout failed:', error);
                });
            });

            // Fetch user details
            await fetchUserDetails(user.uid); // Fetch and display user details
            await fetchPatientsForDoctor(user.uid); // Fetch patients for the logged-in doctor
        } else {
            // No user is signed in, show "Sign In" button
            userAuthSection.innerHTML = `
                <button class="btn-accent w-[120px] h-[50px] lg:p-0 p-2 rounded-lg">
                    <a href="../sign-up.html" class="text-white hover:text-black">Sign In</a>
                </button>
            `;
            userDetailsContainer.innerHTML = ''; // Clear user details
            patientsContainer.innerHTML = ''; // Clear patient list
        }
    });
});

// Function to fetch user details
async function fetchUserDetails(userId) {
    const userDoc = doc(db, 'users', userId);
    const userData = await getDoc(userDoc);

    if (userData.exists()) {
        const user = userData.data();
        userDetailsContainer.innerHTML = `
            <h3>${user.fullName}</h3>
            <p>Email: ${user.email}</p>
            <p>Age: ${user.age}</p>
            <p>Gender: ${user.gender}</p>
            <p>License Number: ${user.licenseNumber}</p>
        `;
    } else {
        console.log("No such user data!");
    }
}


// Fetch patients for the logged-in doctor
async function fetchPatientsForDoctor(doctorId) {
    const patientsContainer = document.getElementById('patient-table-body');
    patientsContainer.innerHTML = ''; // Clear existing list

    try {
        const patientsSnapshot = await getDocs(collection(db, "users"));
        console.log("Fetched users:", patientsSnapshot.docs.length);

        let patientFound = false; // Flag to check if any patients are found

        patientsSnapshot.forEach((patientDoc) => {
            const patientData = patientDoc.data();
            // Check if the user is a patient and if the selectedDoctorId matches
            if (patientData.role === 'patient' && patientData.selectedDoctorId === doctorId) {
                patientFound = true; // Set flag to true since a patient is found

                // Create a new row for the patient
                const patientRow = document.createElement('tr');
                patientRow.innerHTML = `
                   <td class="border border-gray-300 px-4 py-2">
                        <a href="/patient-document.html" class="text-blue-500 hover:underline">
                            ${patientData.fullName}
                        </a>
                    </td>
                    <td class="border border-gray-300 px-4 py-2">${patientData.email}</td>
                    <td class="border border-gray-300 px-4 py-2">${patientData.age || 'N/A'}</td>
                    <td class="border border-gray-300 px-4 py-2">${patientData.gender || 'N/A'}</td>
                    
                `;
                patientsContainer.appendChild(patientRow);
            }
        });

        // If no patients were found, display a message
        if (!patientFound) {
            const noPatientRow = document.createElement('tr');
            noPatientRow.innerHTML = '<td colspan="5" class="border border-gray-300 px-4 py-2 text-center">No patients found for this doctor.</td>';
            patientsContainer.appendChild(noPatientRow);
        }

    } catch (error) {
        console.error("Error fetching patients:", error);
    }
}

// Function to load patients for the logged-in doctor
async function loadPatients() {
    const user = auth.currentUser; // Get the currently logged-in user

    if (!user) {
        document.getElementById('patient-list').innerHTML = '<p>User not authenticated. Please log in.</p>';
        return;
    }

    // Display table structure before fetching patients
    document.getElementById('patient-list').innerHTML = `
        <h2 class="h2 flex justify-center items-center">Patient List</h2>
        <table class="table-auto w-full border-collapse border border-gray-400">
            <thead class="bg-gray-100">
                <tr>
                    <th class="border border-gray-300 px-4 py-2 text-left">Name</th>
                    <th class="border border-gray-300 px-4 py-2 text-left">Email</th>
                    <th class="border border-gray-300 px-4 py-2 text-left">Age</th>
                    <th class="border border-gray-300 px-4 py-2 text-left">Gender</th>
                    
                </tr>
            </thead>
            <tbody id="patient-table-body">
                <!-- Patient data rows will be added here dynamically -->
            </tbody>
        </table>
    `;

    const doctorId = user.uid; // Use the logged-in user's UID as doctorId
    fetchPatientsForDoctor(doctorId); // Fetch patients for this doctor
}

// Call the loadPatients function when the page loads
auth.onAuthStateChanged((user) => {
    if (user) {
        loadPatients(); // Load patients when the user is authenticated
    } else {
        document.getElementById('patient-list').innerHTML = '<p>No user is logged in.</p>';
    }
});
