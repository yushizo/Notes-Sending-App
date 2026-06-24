const API_BASE = '/api/notes';
const urlParams = new URLSearchParams(window.location.search);
const noteId = urlParams.get('id');
const urlHashKey = window.location.hash.substring(1);

let encryptedPayload = null;
let isBurnNote = false;

// Initialization logic on page load
if (noteId) {
    document.getElementById('write-view').classList.add('hidden');
    document.getElementById('read-view').classList.remove('hidden');
    fetchNoteFromServer(noteId);
}

function generateKey() {
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
}

async function createNote() {
    const input = document.getElementById('note-input');
    const customTitle = document.getElementById('custom-title').value.trim();
    const customPassword = document.getElementById('custom-password').value;
    const isBurn = document.getElementById('burn-toggle').checked;
    const btn = document.getElementById('submit-btn');
    const rawContent = input.value.trim();

    if (!rawContent) return alert("You can't send an empty message.");

    btn.innerText = "Encrypting...";
    btn.disabled = true;

    try {
        const secretKey = customPassword ? customPassword : generateKey();
        const encryptedContent = CryptoJS.AES.encrypt(rawContent, secretKey).toString();

        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                content: encryptedContent, 
                is_burn: isBurn,
                title: customTitle // Pass the title to the backend
            })
        });
        
        const data = await response.json();
        
        // Handle Title Collision Error (HTTP 400)
        if (!response.ok) {
            throw new Error(data.detail || "Failed to create note.");
        }
        
        let secretUrl = `${window.location.origin}/static/index.html?id=${data.id}`;
        const instructions = document.getElementById('link-instructions');

        if (!customPassword) {
            secretUrl += `#${secretKey}`;
            instructions.innerText = "Share this link (it contains the auto-decryption key):";
        } else {
            instructions.innerText = "Share this link. The recipient will need the password you just set:";
        }
        
        document.getElementById('link-container').classList.remove('hidden');
        const linkElement = document.getElementById('secret-link');
        linkElement.href = secretUrl;
        linkElement.innerText = secretUrl;
        
        // Clear inputs
        input.value = ''; 
        document.getElementById('custom-title').value = '';
        document.getElementById('custom-password').value = '';
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        btn.innerText = "Encrypt & Create Link";
        btn.disabled = false;
    }
}

async function fetchNoteFromServer(id) {
    try {
        const response = await fetch(`${API_BASE}/${id}`);
        const data = await response.json();

        document.getElementById('loading-msg').classList.add('hidden');

        if (!response.ok) {
            const errorDiv = document.getElementById('error-msg');
            errorDiv.innerText = data.detail || "Note not found.";
            errorDiv.classList.remove('hidden');
            return;
        }

        encryptedPayload = data.content;
        isBurnNote = data.is_burn;

        if (urlHashKey) {
            attemptDecryption(urlHashKey);
        } else {
            document.getElementById('password-prompt').classList.remove('hidden');
        }
        
    } catch (error) {
        document.getElementById('loading-msg').innerText = "Failed to connect to server.";
    }
}

function manualDecrypt() {
    const passwordInput = document.getElementById('decrypt-password').value;
    if (!passwordInput) return alert("Please enter a password.");
    attemptDecryption(passwordInput);
}

function attemptDecryption(key) {
    try {
        const decryptedBytes = CryptoJS.AES.decrypt(encryptedPayload, key);
        const originalText = decryptedBytes.toString(CryptoJS.enc.Utf8);
        
        if (!originalText) throw new Error("Invalid password");

        document.getElementById('password-prompt').classList.add('hidden');
        document.getElementById('error-msg').classList.add('hidden');
        document.getElementById('display-container').classList.remove('hidden');

        document.getElementById('note-display').value = originalText;
        
        if (isBurnNote) {
            document.getElementById('destroyed-warning').classList.remove('hidden');
        } else {
            document.getElementById('saved-msg').classList.remove('hidden');
        }
        
    } catch (error) {
        if (urlHashKey) {
            document.getElementById('error-msg').innerText = "The decryption key in the URL is invalid.";
            document.getElementById('error-msg').classList.remove('hidden');
        } else {
            document.getElementById('error-msg').innerText = "Incorrect password. Try again.";
            document.getElementById('error-msg').classList.remove('hidden');
        }
    }
}