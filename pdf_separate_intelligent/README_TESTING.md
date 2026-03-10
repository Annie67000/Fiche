# PDF Processor API - Testing Guide

This guide provides comprehensive examples and testing instructions for all endpoints in the PDF Processor API, with special focus on the **Get Secure File (Decrypt on-the-fly)** functionality.

## 📁 Files Created

1. **`API_Examples_Guide.md`** - Complete examples for all endpoints
2. **`test_endpoints.py`** - Python test script for automated testing
3. **`run_postman_tests.sh`** - Shell script to run Postman collection tests
4. **`README_TESTING.md`** - This summary guide

## 🚀 Quick Start

### 1. Start the API Server
```bash
cd pdf_separate_intelligent
docker-compose up -d
```

### 2. Verify Server is Running
```bash
curl http://localhost:8001/
```

Expected response: `{"message":"PDF Processor API is running"}`

## 🧪 Testing Methods

### Method 1: Python Test Script (Recommended)
```bash
cd pdf_separate_intelligent
python test_endpoints.py
```

**Features:**
- ✅ Tests all endpoints automatically
- ✅ Focus on Get Secure File functionality
- ✅ Error handling and validation
- ✅ Downloads decrypted files for verification
- ✅ Comprehensive test reporting

### Method 2: Postman Collection
```bash
cd pdf_separate_intelligent
./run_postman_tests.sh
```

**Prerequisites:**
- Install Node.js and npm
- Install Newman: `npm install -g newman`

**Features:**
- ✅ Uses the provided Postman collection
- ✅ Generates HTML test reports
- ✅ Environment variable management

### Method 3: Manual Testing with curl
See `API_Examples_Guide.md` for detailed curl examples for each endpoint.

## 🔐 Get Secure File (Decrypt on-the-fly) - Key Examples

### Basic Usage
```bash
# Access encrypted file securely
curl -O "http://localhost:8001/secure_file/EMP001/EMP001_2024-01.pdf"
```

### Browser View
```bash
# Open PDF directly in browser
open "http://localhost:8001/secure_file/EMP002/EMP002_2024-01.pdf"
```

### Programmatic Access (Python)
```python
import requests

def get_secure_pdf(employee_id, filename):
    url = f"http://localhost:8001/secure_file/{employee_id}/{filename}"
    response = requests.get(url)
    
    if response.status_code == 200:
        with open(f"{employee_id}_{filename}", 'wb') as f:
            f.write(response.content)
        print(f"✓ Downloaded {filename}")
    else:
        print(f"✗ Error: {response.status_code}")

# Usage
get_secure_pdf("EMP001", "EMP001_2024-01.pdf")
```

### Programmatic Access (JavaScript)
```javascript
async function getSecurePDF(employeeId, filename) {
    const url = `http://localhost:8001/secure_file/${employeeId}/${filename}`;
    const response = await fetch(url);
    
    if (response.ok) {
        const pdfBlob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(downloadUrl);
    }
}
```

## 🛡️ Security Features of Get Secure File

1. **AES-256-CBC Encryption**: Files are encrypted at rest with enterprise-grade encryption
2. **On-the-fly Decryption**: Files are decrypted only when accessed, never stored decrypted
3. **Memory-only Processing**: Decrypted content never touches the filesystem
4. **File Extension Validation**: Only `.pdf` requests are accepted (converted to `.enc` internally)
5. **Path Traversal Protection**: Prevents access to files outside employee folders
6. **Error Handling**: Graceful handling of decryption failures

## 📊 Expected Workflow

### Complete Processing Flow
1. **Upload PDF** → Get `task_id`
2. **Poll Status** → Wait for "Completed"
3. **Get Structure** → See folder organization
4. **List Files** → See available encrypted files
5. **Access Securely** → Decrypt and view/download files

### Example Session
```bash
# 1. Upload PDF
task_id=$(curl -s -X POST "http://localhost:8001/process" \
  -F "file=@dec_2026.pdf" | jq -r '.task_id')

# 2. Wait for completion
while [ "$(curl -s "http://localhost:8001/task/$task_id" | jq -r '.status')" != "Completed" ]; do
    sleep 2
done

# 3. Get structure
structure=$(curl -s "http://localhost:8001/download/$task_id")

# 4. Access first file securely
employee=$(echo $structure | jq -r '.folder_structure | keys[0]')
file=$(echo $structure | jq -r ".folder_structure[\"$employee\"][0]")

# 5. Download decrypted file
curl -O "http://localhost:8001/secure_file/$employee/$file"
```

## ⚠️ Common Issues and Solutions

### Issue 1: Server Not Running
```bash
# Check if server is running
curl http://localhost:8001/

# If not running, start it
cd pdf_separate_intelligent
docker-compose up -d
```

### Issue 2: Task Still Processing
```bash
# Check task status
curl "http://localhost:8001/task/your-task-id"

# Wait for "Completed" status before proceeding
```

### Issue 3: File Not Found (404)
```bash
# Verify employee ID and filename
curl "http://localhost:8001/download/your-task-id"

# Check available files
curl "http://localhost:8001/list_files/employee-id"
```

### Issue 4: Decryption Failed (500)
```bash
# This usually means the file was corrupted during processing
# Try re-uploading the PDF and processing again
```

## 📈 Performance Notes

- **Large Files**: The API uses streaming responses for efficient handling of large PDFs
- **Concurrent Access**: Multiple users can access different encrypted files simultaneously
- **Memory Usage**: Decryption happens in memory, so very large files may require more RAM
- **Processing Time**: Depends on PDF size and number of pages (OCR processing)

## 🔧 Advanced Testing

### Load Testing Get Secure File
```bash
# Test concurrent access to the same file
for i in {1..10}; do
    curl -O "http://localhost:8001/secure_file/EMP001/EMP001_2024-01.pdf" &
done
wait
```

### Testing Different File Types
```bash
# Test error handling with invalid files
curl -X POST "http://localhost:8001/process" -F "file=@text.txt"
# Should return: {"error": "Only PDF files are allowed"}
```

### Testing Authentication (Future Enhancement)
The current API doesn't have authentication, but you can add it by:
1. Adding JWT token validation to the `get_secure_file` endpoint
2. Checking user permissions before allowing file access
3. Logging access attempts for audit trails

## 📋 Test Coverage

The test scripts cover:

- ✅ **Upload PDF** - File validation and processing initiation
- ✅ **Task Status** - Async processing monitoring
- ✅ **Download Structure** - Folder organization verification
- ✅ **Get Folders** - Directory listing functionality
- ✅ **List Files** - File enumeration in employee folders
- ✅ **Get Secure File** - Core decryption and access functionality
- ✅ **Error Handling** - Invalid inputs and edge cases
- ✅ **Multiple Files** - Batch processing and access
- ✅ **Browser Compatibility** - PDF viewing in browsers
- ✅ **File Integrity** - PDF format validation

## 🎯 Key Takeaways

1. **Security First**: All files are encrypted at rest, decrypted only on-demand
2. **RESTful Design**: Clean, predictable API endpoints
3. **Async Processing**: Long-running tasks handled efficiently
4. **Error Handling**: Comprehensive error responses
5. **Memory Efficiency**: Large files handled via streaming
6. **Enterprise Ready**: Production-grade encryption and security

This API provides a secure and efficient solution for processing, organizing, and accessing sensitive PDF documents like pay slips with enterprise-grade security.