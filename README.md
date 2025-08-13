# Capture-The-Flag
This repository is a CTF Challenge Project for Selfmade Ninja Academy.
This is a CTF web application designed for testing and learning common web vulnerabilities. It includes multiple challenges like SQLi, XSS, IDOR, command injection, insecure file upload and JWT manipulation.

## Vulnerabilities

1. SQL Injection (SQLi)  
The login page is vulnerable to SQL injection.  
Exploiting it can reveal admin credentials and flags.

2. Cross-Site Scripting (XSS)  
Inject JavaScript in the /chat feature.  
Successfully executing XSS will store the flag in /flag.txt.

3. Command Injection  
The /lookup endpoint uses ping without proper input sanitization.  
Appending ; or & allows arbitrary command injection.  
Performing Command injection successfully displays the flag.

4. Insecure Direct Object Reference (IDOR)  
The /profile endpoint takes ?username= as parameter allowing users to view other user's profiles when tampered with other usernames.  
Admin profile reveals a hidden flag.

5. Insecure File Upload  
The /upload allows only .jpg and .png.  
Filename tricks like shell.jpg.php are accepted.  
Uploading these types of shells provides the flag.

6. JWT Flag  
The flag is stored in JWT payload.  
Users can decode the cookie to retrieve the flag.

---

## Setup Instructions

1. **Clone the repository**  
```bash
git clone https://github.com/GodofConquest04/Capture-The-Flag.git;
cd Capture-The-Flag;
docker-compose up --build;
