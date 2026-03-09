#!/bin/bash

# Function to check if PostgreSQL is ready
check_postgres() {
    python3 -c "
import os
import sys
import psycopg2
from urllib.parse import urlparse

# Get database URL from environment
database_url = os.environ.get('DATABASE_URL')
if not database_url:
    print('DATABASE_URL not set')
    sys.exit(1)

try:
    # Parse the database URL
    result = urlparse(database_url)
    conn = psycopg2.connect(
        host=result.hostname,
        port=result.port or 5432,
        user=result.username,
        password=result.password,
        database=result.path[1:]
    )
    conn.close()
    print('PostgreSQL is ready!')
    sys.exit(0)
except Exception as e:
    print(f'PostgreSQL not ready: {e}')
    sys.exit(1)
"
}

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if check_postgres; then
        echo "PostgreSQL is ready!"
        exit 0
    fi
    
    echo "Attempt $attempt/$max_attempts: PostgreSQL not ready, waiting 2 seconds..."
    sleep 2
    attempt=$((attempt + 1))
done

echo "ERROR: PostgreSQL is not ready after $max_attempts attempts"
exit 1