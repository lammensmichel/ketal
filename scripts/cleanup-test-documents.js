// Cleanup script for stale Appwrite test documents using Node.js http module
// Usage: node scripts/cleanup-test-documents.js

const http = require('http');

// Configuration - matches environment.ts
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'http://127.0.0.1/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || 'fug';
const DATABASE_ID = 'fug';
const API_KEY = process.env.APPWRITE_API_KEY || ''; // Empty for guest access (may need auth for listing)

// Collections used by Realtime tests
const SESSION_COLLECTION_ID = 'ketal_sessions';
const ROOMS_COLLECTION_ID = 'fug_game_rooms';

// Document ID patterns to clean up - for ketal_sessions
const KETAL_SESSION_PATTERNS = [
  'test-session-',
  'test-collection-',
  'test-session-update-',
];

// Document ID patterns to clean up - for fug_game_rooms
const FUG_ROOM_PATTERNS = [
  'test-realtime-',
  'test-unsubscribe-',
  'test-update-',
];

// Any document starting with these should be deleted
const WILDCARD_PATTERNS = [
  'room-',
  '6a0',
];

/**
 * Parse the Appwrite endpoint URL
 */
function parseEndpoint() {
  const url = new URL(ENDPOINT);
  return {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    protocol: url.protocol.replace(':', ''),
    pathname: url.pathname.replace(/\/+$/, ''),
  };
}

/**
 * Make a REST API call to Appwrite
 */
function appwriteRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const endpoint = parseEndpoint();
    
    const url = path.includes('://') ? path : `${endpoint.pathname}${path}`;
    
    const requestOptions = {
      hostname: endpoint.hostname,
      port: endpoint.port,
      protocol: endpoint.protocol + ':',
      path: url,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
        ...(options.headers || {}),
      },
    };
    
    if (API_KEY) {
      requestOptions.headers['X-Appwrite-Key'] = API_KEY;
    }
    
    const req = (endpoint.protocol === 'https' ? require('https') : require('http')).request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(result);
          } else {
            reject(new Error(`Appwrite API error: ${res.statusCode} ${res.statusMessage} - ${data}`));
          }
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

/**
 * List all documents in a collection
 */
async function listDocuments(databaseId, collectionId) {
  const url = `/databases/${encodeURIComponent(databaseId)}/collections/${encodeURIComponent(collectionId)}/documents`;
  let allDocuments = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const path = `${url}?offset=${offset}&limit=${limit}`;
    const result = await appwriteRequest(path);
    
    allDocuments = allDocuments.concat(result.documents);
    
    console.log('  Fetched ' + result.documents.length + ' documents (total: ' + allDocuments.length + ')');
    
    if (result.documents.length < limit) {
      break;
    }
    
    offset += limit;
  }

  return allDocuments;
}

/**
 * Delete a document
 */
async function deleteDocument(databaseId, collectionId, documentId) {
  const url = `/databases/${encodeURIComponent(databaseId)}/collections/${encodeURIComponent(collectionId)}/documents/${encodeURIComponent(documentId)}`;
  await appwriteRequest(url, { method: 'DELETE' });
}

/**
 * Check if document ID matches any cleanup pattern
 */
function matchesPattern(docId, patterns) {
  return patterns.some(function(pattern) {
    return docId.startsWith(pattern);
  });
}

/**
 * Check if document ID matches any wildcard pattern
 */
function matchesWildcard(docId) {
  return WILDCARD_PATTERNS.some(function(pattern) {
    return docId.startsWith(pattern);
  });
}

/**
 * Cleanup stale test documents
 */
async function cleanupTestDocuments() {
  console.log('='.repeat(60));
  console.log('Appwrite Test Document Cleanup (REST API)');
  console.log('='.repeat(60));
  console.log('Endpoint: ' + ENDPOINT);
  console.log('Project: ' + PROJECT_ID);
  console.log('Database: ' + DATABASE_ID);
  console.log('ketal_sessions patterns: ' + KETAL_SESSION_PATTERNS.join(', '));
  console.log('fug_game_rooms patterns: ' + FUG_ROOM_PATTERNS.join(', '));
  console.log('Wildcard patterns: ' + WILDCARD_PATTERNS.join(', '));
  console.log('='.repeat(60));

  let totalDeleted = 0;
  let totalChecked = 0;

  // Function to cleanup a single collection
  async function cleanupCollection(collectionId, patterns) {
    console.log('\n--- Checking collection: ' + collectionId + ' ---');
    console.log('Patterns: ' + patterns.join(', '));

    try {
      const documents = await listDocuments(DATABASE_ID, collectionId);
      console.log('Found ' + documents.length + ' documents in collection');
      
      // Debug: show document IDs
      console.log('  Document IDs:');
      for (var j = 0; j < documents.length && j < 5; j++) {
        console.log('    - ' + documents[j]['$id']);
      }
      if (documents.length > 5) {
        console.log('    ... and ' + (documents.length - 5) + ' more');
      }

      // Filter and delete stale test documents
      var deletedCount = 0;
      for (var i = 0; i < documents.length; i++) {
        var doc = documents[i];
        totalChecked++;
        var docId = doc['$id'];
        
        // Check if document matches patterns or wildcards
        if (matchesPattern(docId, patterns) || matchesWildcard(docId)) {
          try {
            await deleteDocument(DATABASE_ID, collectionId, docId);
            console.log('  ✓ Deleted: ' + docId);
            totalDeleted++;
            deletedCount++;
          } catch (deleteError) {
            console.log('  ✗ Failed to delete ' + docId + ': ' + deleteError.message);
          }
        }
      }
      console.log('Deleted ' + deletedCount + ' stale test documents from ' + collectionId);
    } catch (error) {
      console.log('  Error: ' + error.message);
    }
  }

  // Cleanup both test collections
  await cleanupCollection(SESSION_COLLECTION_ID, KETAL_SESSION_PATTERNS);
  await cleanupCollection(ROOMS_COLLECTION_ID, FUG_ROOM_PATTERNS);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Cleanup Summary');
  console.log('='.repeat(60));
  console.log('Documents checked: ' + totalChecked);
  console.log('Documents deleted: ' + totalDeleted);
  console.log('='.repeat(60));
}

// Run cleanup
cleanupTestDocuments()
  .then(function() {
    console.log('\nCleanup completed successfully!');
    process.exit(0);
  })
  .catch(function(error) {
    console.error('\nCleanup failed:', error);
    process.exit(1);
  });
