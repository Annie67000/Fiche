# PDF Processor API - Complete Examples Guide

This guide provides detailed examples for testing each endpoint in the PDF Processor API, with special focus on the **Get Secure File (Decrypt on-the-fly)** functionality.

## 🚀 Quick Start

### 1. Start the API Server
```bash
cd pdf_separate_intelligent
docker-compose up -d
```

### 2. Base URL
```
http://localhost:8001
```

## 📋 Complete Endpoint Examples

### 1. 📤 Upload PDF for Processing

**Endpoint:** `POST /process`

**Purpose:** Upload a PDF file to be split into pages and renamed via OCR. The file will be encrypted during processing.

**Example Request:**
```bash
curl -X POST "http://localhost:8001/process" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@dec_2026.pdf"
```

**Postman Configuration:**
- Method: POST
- URL: `{{base_url}}/process`
- Headers: `Content-Type: multipart/form-data`
- Body: Form Data
  - Key: `file`
  - Type: File
  - Value: Select `dec_2026.pdf`

**Expected Response:**
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "Task started"
}
```

**Error Response (Invalid File Type):**
```json
{
  "error": "Only PDF files are allowed"
}
```

---

### 2. 🔍 Check Task Status

**Endpoint:** `GET /task/{task_id}`

**Purpose:** Check the status of a processing task.

**Example Request:**
```bash
curl "http://localhost:8001/task/550e8400-e29b-41d4-a716-446655440000"
```

**Postman Configuration:**
- Method: GET
- URL: `{{base_url}}/task/{{task_id}}`

**Status Examples:**

#### Pending Status
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "Pending"
}
```

#### Processing Status
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "En cours",
  "detail": "Splitting PDF into pages",
  "progress": "1/5 pages processed",
  "current": 1,
  "total": 5
}
```

#### Completed Status
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "Completed",
  "output_dir": "/app/output/550e8400-e29b-41d4-a716-446655440000",
  "file_count": 5,
  "employee_count": 3
}
```

#### Failed Status
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "Failed",
  "error": "OCR extraction failed"
}
```

---

### 3. 📥 Download Processed Files Structure

**Endpoint:** `GET /download/{task_id}`

**Purpose:** Get the processed pay slips organized by employee ID as folder structure.

**Example Request:**
```bash
curl "http://localhost:8001/download/550e8400-e29b-41d4-a716-446655440000"
```

**Postman Configuration:**
- Method: GET
- URL: `{{base_url}}/download/{{task_id}}`

**Expected Response:**
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "output_dir": "/app/output/550e8400-e29b-41d4-a716-446655440000",
  "folder_structure": {
    "EMP001": [
      "EMP001_2024-01.pdf",
      "EMP001_2024-02.pdf"
    ],
    "EMP002": [
      "EMP002_2024-01.pdf"
    ],
    "EMP003": [
      "EMP003_2024-01.pdf",
      "EMP003_2024-02.pdf",
      "EMP003_2024-03.pdf"
    ]
  },
  "total_folders": 3,
  "total_files": 6
}
```

**Error Response (Task Not Completed):**
```json
{
  "error": "Task is not completed or failed"
}
```

---

### 4. 📁 Get All Folders

**Endpoint:** `GET /folders`

**Purpose:** Get the list of all folder paths in the output directory organized by employee ID.

**Example Request:**
```bash
curl "http://localhost:8001/folders"
```

**Postman Configuration:**
- Method: GET
- URL: `{{base_url}}/folders`

**Expected Response:**
```json
{
  "folders": [
    "C:/Projet/projet/pdf_separate_intelligent/output/EMP001",
    "C:/Projet/projet/pdf_separate_intelligent/output/EMP002",
    "C:/Projet/projet/pdf_separate_intelligent/output/EMP003"
  ]
}
```

**No Folders Response:**
```json
{
  "folders": []
}
```

---

### 5. 📋 List Files in Employee Folder

**Endpoint:** `GET /list_files/{employee_id}`

**Purpose:** Get the list of encrypted PDF files (.enc) in a specific employee folder recursively.

**Example Request:**
```bash
curl "http://localhost:8001/list_files/EMP001"
```

**Postman Configuration:**
- Method: GET
- URL: `{{base_url}}/list_files/{{employee_id}}`
- Replace `{{employee_id}}` with actual employee ID (e.g., EMP001)

**Expected Response:**
```json
{
  "files": [
    "EMP001_2024-01.pdf",
    "EMP001_2024-02.pdf"
  ]
}
```

**No Files Response:**
```json
{
  "files": []
}
```

---

## 🔐 Get Secure File (Decrypt on-the-fly) - DETAILED EXAMPLES

This is the most important endpoint for secure file access. It decrypts encrypted PDF files on-the-fly for authorized access.

### 6. 🔓 Get Secure File (Decrypt on-the-fly)

**Endpoint:** `GET /secure_file/{employee_id}/{filename}`

**Purpose:** Serve an encrypted PDF file by decrypting it on the fly. The actual files on disk remain encrypted.

**IMPORTANT:** This endpoint decrypts files on-the-fly for secure access. The actual files on disk remain encrypted.

### 🔧 Technical Implementation Details

The secure file endpoint uses AES-256-CBC encryption with the following process:

1. **File Storage:** All processed PDFs are stored with `.enc` extension
2. **On-the-fly Decryption:** When accessed via this endpoint, files are decrypted in memory
3. **Memory Management:** Decrypted content is never written to disk
4. **Streaming Response:** File is served as a streaming response to handle large files efficiently

### 📁 File Structure Example

After processing, your output directory will look like this:
```
output/
├── EMP001/
│   ├── EMP001_2024-01.enc  (encrypted)
│   └── EMP001_2024-02.enc  (encrypted)
├── EMP002/
│   └── EMP002_2024-01.enc  (encrypted)
└── EMP003/
    ├── EMP003_2024-01.enc  (encrypted)
    ├── EMP003_2024-02.enc  (encrypted)
    └── EMP003_2024-03.enc  (encrypted)
```

### 🚀 Usage Examples

#### Example 1: Basic Secure File Access

**Request:**
```bash
curl -O "http://localhost:8001/secure_file/EMP001/EMP001_2024-01.pdf"
```

**Postman Configuration:**
- Method: GET
- URL: `{{base_url}}/secure_file/{{employee_id}}/{{encrypted_filename}}`
- Replace `{{employee_id}}` with `EMP001`
- Replace `{{encrypted_filename}}` with `EMP001_2024-01.pdf`

**What Happens:**
1. API receives request for `EMP001_2024-01.pdf`
2. Converts filename to `EMP001_2024-01.enc` (actual file on disk)
3. Reads encrypted file from `output/EMP001/EMP001_2024-01.enc`
4. Decrypts file in memory using AES-256-CBC
5. Returns decrypted PDF as streaming response
6. Original encrypted file remains unchanged on disk

#### Example 2: View PDF in Browser

**Request:**
```bash
# Open in browser
open "http://localhost:8001/secure_file/EMP002/EMP002_2024-01.pdf"
```

**Response Headers:**
```
Content-Type: application/pdf
Content-Disposition: inline; filename=EMP002_2024-01.pdf
```

This will display the PDF directly in the browser.

#### Example 3: Download PDF File

**Request:**
```bash
curl -L -o "EMP003_Janvier_2024.pdf" "http://localhost:8001/secure_file/EMP003/EMP003_2024-01.pdf"
```

This downloads the decrypted PDF with a custom filename.

#### Example 4: Programmatic Access with Python

```python
import requests

def get_secure_pdf(employee_id, filename):
    url = f"http://localhost:8001/secure_file/{employee_id}/{filename}"
    
    response = requests.get(url)
    
    if response.status_code == 200:
        # Save the decrypted PDF
        with open(f"{employee_id}_{filename}", 'wb') as f:
            f.write(response.content)
        print(f"Successfully downloaded {filename}")
    else:
        print(f"Error: {response.status_code} - {response.text}")

# Usage
get_secure_pdf("EMP001", "EMP001_2024-01.pdf")
```

#### Example 5: Programmatic Access with JavaScript/Fetch

```javascript
async function getSecurePDF(employeeId, filename) {
    const url = `http://localhost:8001/secure_file/${employeeId}/${filename}`;
    
    try {
        const response = await fetch(url);
        
        if (response.ok) {
            // Get the PDF blob
            const pdfBlob = await response.blob();
            
            // Create download link
            const downloadUrl = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            link.click();
            
            // Clean up
            window.URL.revokeObjectURL(downloadUrl);
        } else {
            console.error('Error:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Network error:', error);
    }
}

// Usage
getSecurePDF('EMP001', 'EMP001_2024-01.pdf');
```

### 🛡️ Security Features

1. **File Extension Validation:** Only `.enc` files can be accessed
2. **Path Traversal Protection:** Prevents access to files outside employee folders
3. **Memory-only Decryption:** Decrypted content never touches the filesystem
4. **Error Handling:** Graceful handling of decryption failures

### ⚠️ Error Responses

#### File Not Found
```json
{
  "detail": "File not found"
}
```
**HTTP Status:** 404 Not Found

**Common Causes:**
- Wrong employee ID
- Wrong filename
- File doesn't exist in the specified folder

#### Decryption Failed
```json
{
  "detail": "Error decrypting file: Invalid encryption key"
}
```
**HTTP Status:** 500 Internal Server Error

**Common Causes:**
- Corrupted encrypted file
- Wrong encryption key
- File was not properly encrypted

### 🔍 Testing the Secure File Endpoint

#### Step 1: Upload and Process a PDF
```bash
# Upload the sample PDF
curl -X POST "http://localhost:8001/process" \
  -F "file=@dec_2026.pdf"
```

#### Step 2: Wait for Processing to Complete
```bash
# Check status (replace with actual task_id)
curl "http://localhost:8001/task/your-task-id-here"
```

#### Step 3: Get Folder Structure
```bash
curl "http://localhost:8001/download/your-task-id-here"
```

#### Step 4: List Files in Employee Folder
```bash
# Replace EMPXXX with actual employee ID from step 3
curl "http://localhost:8001/list_files/EMPXXX"
```

#### Step 5: Access Secure File
```bash
# Replace with actual employee ID and filename
curl -O "http://localhost:8001/secure_file/EMPXXX/filename.pdf"
```

### 🧪 Complete Test Script

Create a test script to verify the entire workflow:

```bash
#!/bin/bash

echo "=== PDF Processor API Test Script ==="

# Step 1: Upload PDF
echo "1. Uploading PDF..."
response=$(curl -s -X POST "http://localhost:8001/process" \
  -F "file=@dec_2026.pdf")

task_id=$(echo $response | grep -o '"task_id":"[^"]*"' | cut -d'"' -f4)
echo "Task ID: $task_id"

# Step 2: Wait for completion
echo "2. Waiting for processing to complete..."
while true; do
    status_response=$(curl -s "http://localhost:8001/task/$task_id")
    status=$(echo $status_response | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$status" = "Completed" ]; then
        echo "Processing completed!"
        break
    elif [ "$status" = "Failed" ]; then
        echo "Processing failed!"
        echo $status_response
        exit 1
    else
        echo "Status: $status - waiting..."
        sleep 2
    fi
done

# Step 3: Get folder structure
echo "3. Getting folder structure..."
folder_response=$(curl -s "http://localhost:8001/download/$task_id")
echo $folder_response | jq '.'

# Step 4: Test secure file access
echo "4. Testing secure file access..."
# Extract first employee and file from response
employee_id=$(echo $folder_response | jq -r '.folder_structure | keys[0]')
filename=$(echo $folder_response | jq -r ".folder_structure[\"$employee_id\"][0]")

if [ "$employee_id" != "null" ] && [ "$filename" != "null" ]; then
    echo "Testing access to $employee_id/$filename"
    curl -I "http://localhost:8001/secure_file/$employee_id/$filename"
    echo "File access test completed!"
else
    echo "No files found to test"
fi

echo "=== Test completed ==="
```

Save this as `test_api.sh`, make it executable (`chmod +x test_api.sh`), and run it to test the complete workflow.

## 🔄 Complete Workflow Example

Here's the complete workflow from upload to secure file access:

```bash
# 1. Upload PDF
upload_response=$(curl -s -X POST "http://localhost:8001/process" \
  -F "file=@dec_2026.pdf")
task_id=$(echo $upload_response | jq -r '.task_id')

# 2. Poll for completion
while true; do
    status=$(curl -s "http://localhost:8001/task/$task_id" | jq -r '.status')
    if [ "$status" = "Completed" ]; then break; fi
    sleep 2
done

# 3. Get processed files structure
structure=$(curl -s "http://localhost:8001/download/$task_id")

# 4. Access first employee's first file securely
employee=$(echo $structure | jq -r '.folder_structure | keys[0]')
file=$(echo $structure | jq -r ".folder_structure[\"$employee\"][0]")

# 5. Download the decrypted file
curl -O "http://localhost:8001/secure_file/$employee/$file"

echo "Successfully downloaded: $file"
```

## 🎯 Key Points

1. **Security First:** All files are encrypted at rest and decrypted only on-demand
2. **Memory Efficiency:** Large files are handled via streaming responses
3. **Error Handling:** Comprehensive error responses for debugging
4. **RESTful Design:** Clean, predictable API endpoints
5. **Async Processing:** Long-running tasks are handled asynchronously

This API provides a secure and efficient way to process, organize, and access sensitive PDF documents like pay slips with enterprise-grade security.