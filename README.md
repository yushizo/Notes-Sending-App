# 🔥 Burn-After-Reading Secret Notes Sending App

A secure, zero-dependency web application utilizing a Python (FastAPI) backend and a local SQLite database to facilitate the safe transfer of sensitive text. 

The application features **Client-Side End-to-End Encryption (E2EE)** via CryptoJS and implements a strict "burn-after-reading" data lifecycle architecture. By coupling database `SELECT` and `DELETE` operations within a single API routing event, the system guarantees that confidential payloads are permanently purged from storage upon their first access.

## Features
* **Zero-Knowledge Architecture:** The server only stores AES ciphertext. The decryption key is passed via the URL hash fragment and is never seen by the backend.
* **Self-Destruct Mechanism:** Notes set to 'Burn' are permanently deleted from the database the millisecond they are accessed.
* **Custom Passwords & URLs:** Users can optionally lock notes with a custom password and define a custom URL slug.

## Quick Start Guide

### Prerequisites
* Python 3.8+ installed on your machine.

### Installation
1. Clone the repository:
   ```bash
   git clone [https://github.com/YOUR-USERNAME/secret-note.git](https://github.com/YOUR-USERNAME/secret-note.git)
   cd secret-note
