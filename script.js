// PDF Knowledge Base - Dynamic chatbot that scans PDFs
let pdfIndex = {}; // Stores extracted text from all PDFs
let isIndexing = false;
let indexingProgress = 0;

// List of PDF files to scan
const pdfFiles = [
    'documents/JavaScriptNotesForProfessionals.pdf',
    'documents/PythonNotesForProfessionals.pdf',
    'documents/JavaNotesForProfessionals.pdf',
    'documents/CSharpNotesForProfessionals.pdf',
    'documents/ReactJSNotesForProfessionals.pdf',
    'documents/NodeJSNotesForProfessionals.pdf',
    'documents/TypeScriptNotesForProfessionals.pdf',
    'documents/SQLNotesForProfessionals.pdf',
    'documents/MySQLNotesForProfessionals.pdf',
    'documents/PostgreSQLNotesForProfessionals.pdf',
    'documents/MongoDBNotesForProfessionals.pdf',
    'documents/CSSNotesForProfessionals.pdf',
    'documents/GitNotesForProfessionals.pdf',
    'documents/LinuxNotesForProfessionals.pdf',
    'documents/PowerShellNotesForProfessionals.pdf',
    'documents/PHPNotesForProfessionals.pdf',
    'documents/AngularJSNotesForProfessionals.pdf',
    'documents/ReactNativeNotesForProfessionals.pdf',
    'documents/MicrosoftSQLServerNotesForProfessionals.pdf',
    'documents/DotNETFrameworkNotesForProfessionals.pdf',
    'documents/AlgorithmsNotesForProfessionals.pdf'
];

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/**
 * Extracts text from a PDF file with page tracking
 */
async function extractTextFromPDF(pdfPath) {
    try {
        const loadingTask = pdfjsLib.getDocument(pdfPath);
        const pdf = await loadingTask.promise;
        let fullText = '';
        const pageTexts = {}; // Store text per page for page number tracking
        
        // Extract text from first 50 pages (to avoid memory issues with very large PDFs)
        const maxPages = Math.min(pdf.numPages, 50);
        
        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            pageTexts[pageNum] = pageText;
            fullText += pageText + ' ';
        }
        
        return {
            text: fullText.trim(),
            pageTexts: pageTexts,
            totalPages: maxPages
        };
    } catch (error) {
        console.error(`Error extracting text from ${pdfPath}:`, error);
        return { text: '', pageTexts: {}, totalPages: 0 };
    }
}

/**
 * Indexes all PDFs and stores their content
 */
async function indexAllPDFs() {
    isIndexing = true;
    const chatBox = document.getElementById("chat-box");
    const totalPDFs = pdfFiles.length;
    
    // Enticing loading messages
    const loadingMessages = [
        "🚀 Initializing knowledge base...",
        "📚 Preparing learning materials...",
        "🔍 Scanning educational resources...",
        "⚡ Processing content...",
        "✨ Almost ready..."
    ];
    
    chatBox.innerHTML = `<p><strong>Bot:</strong> ${loadingMessages[0]} <span class="loading-percent">0%</span></p>`;
    
    for (let i = 0; i < pdfFiles.length; i++) {
        const pdfPath = pdfFiles[i];
        const pdfName = pdfPath.split('/').pop().replace('.pdf', '');
        
        indexingProgress = Math.round(((i + 1) / totalPDFs) * 100);
        
        // Show different messages based on progress
        let message = "";
        if (indexingProgress < 20) {
            message = `📖 Loading content library... ${indexingProgress}%`;
        } else if (indexingProgress < 40) {
            message = `🔍 Indexing documents... ${indexingProgress}%`;
        } else if (indexingProgress < 60) {
            message = `⚡ Processing pages... ${indexingProgress}%`;
        } else if (indexingProgress < 80) {
            message = `✨ Organizing knowledge... ${indexingProgress}%`;
        } else if (indexingProgress < 100) {
            message = `🎯 Finalizing setup... ${indexingProgress}%`;
        } else {
            message = `✅ Complete! ${indexingProgress}%`;
        }
        
        chatBox.innerHTML = `<p><strong>Bot:</strong> ${message}<br><small>📄 ${pdfName} (${i + 1}/${totalPDFs})</small></p>`;
        chatBox.scrollTop = chatBox.scrollHeight;
        
        const pdfData = await extractTextFromPDF(pdfPath);
        if (pdfData.text) {
            pdfIndex[pdfName] = {
                path: pdfPath,
                text: pdfData.text.toLowerCase(),
                words: pdfData.text.toLowerCase().split(/\s+/),
                pageTexts: pdfData.pageTexts, // Store page-by-page text
                totalPages: pdfData.totalPages
            };
        }
        
        // Small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    isIndexing = false;
    chatBox.innerHTML = `<p><strong>Bot:</strong> 🎉 <strong>Knowledge base ready!</strong><br>✅ Successfully indexed ${Object.keys(pdfIndex).length} PDFs with ${Object.values(pdfIndex).reduce((sum, pdf) => sum + pdf.totalPages, 0)} pages of content.<br><br>💬 How can I help you learn today?</p>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

/**
 * Finds relevant content from PDFs based on user query
 */
function findRelevantContent(query) {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const results = [];
    
    // Search through each PDF
    for (const [pdfName, pdfData] of Object.entries(pdfIndex)) {
        let relevanceScore = 0;
        let matchedWords = [];
        
        // Count how many query words appear in this PDF
        for (const word of queryWords) {
            const wordCount = (pdfData.text.match(new RegExp(`\\b${word}\\b`, 'gi')) || []).length;
            if (wordCount > 0) {
                relevanceScore += wordCount;
                matchedWords.push(word);
            }
        }
        
        if (relevanceScore > 0) {
            // Extract a relevant snippet around the matched words
            const snippetData = extractRelevantSnippet(pdfData, queryWords);
            results.push({
                pdfName,
                path: pdfData.path,
                score: relevanceScore,
                matchedWords,
                snippet: snippetData.snippet,
                pageNumber: snippetData.pageNumber,
                fullPageContent: snippetData.fullPageContent
            });
        }
    }
    
    // Sort by relevance score
    results.sort((a, b) => b.score - a.score);
    return results;
}

/**
 * Extracts a relevant snippet from PDF text around matched keywords and finds the page number
 */
function extractRelevantSnippet(pdfData, keywords, snippetLength = 300) {
    const text = pdfData.text;
    // Find the first occurrence of any keyword
    let bestIndex = -1;
    let minIndex = Infinity;
    
    for (const keyword of keywords) {
        const index = text.indexOf(keyword);
        if (index !== -1 && index < minIndex) {
            minIndex = index;
            bestIndex = index;
        }
    }
    
    if (bestIndex === -1) {
        // If no keyword found, return beginning of text
        return {
            snippet: text.substring(0, snippetLength) + '...',
            pageNumber: 1,
            fullPageContent: pdfData.pageTexts[1] || ''
        };
    }
    
    // Find which page this text is on
    let currentCharCount = 0;
    let foundPage = 1;
    for (let pageNum = 1; pageNum <= pdfData.totalPages; pageNum++) {
        const pageText = pdfData.pageTexts[pageNum] || '';
        const pageCharCount = pageText.length;
        if (currentCharCount + pageCharCount >= bestIndex) {
            foundPage = pageNum;
            break;
        }
        currentCharCount += pageCharCount + 1; // +1 for space between pages
    }
    
    // Extract snippet around the keyword
    const start = Math.max(0, bestIndex - snippetLength / 2);
    const end = Math.min(text.length, bestIndex + snippetLength / 2);
    let snippet = text.substring(start, end);
    
    // Clean up the snippet
    snippet = snippet.trim();
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    
    // Get the full page content
    const fullPageContent = pdfData.pageTexts[foundPage] || '';
    
    return {
        snippet: snippet,
        pageNumber: foundPage,
        fullPageContent: fullPageContent
    };
}

/**
 * Generates a response based on PDF content
 */
function generateResponse(query) {
    const results = findRelevantContent(query);
    
    if (results.length === 0) {
        return {
            message: "I couldn't find relevant information about that topic in my knowledge base. Try asking about programming concepts, languages, or technologies!",
            source: null,
            pageContent: null
        };
    }
    
    const topResult = results[0];
    const otherResults = results.slice(1, 3); // Get top 2-3 additional results
    
    let message = `I found relevant information in ${topResult.pdfName}.\n\n`;
    message += `Click the source link below to view the full page content.`;
    
    if (otherResults.length > 0) {
        message += `\n\nAlso found in: ${otherResults.map(r => r.pdfName).join(', ')}`;
    }
    
    return {
        message: message,
        source: topResult.path,
        pdfName: topResult.pdfName,
        pageNumber: topResult.pageNumber,
        pageContent: topResult.fullPageContent || ''
    };
}

/**
 * Displays PDF page content in the lesson view
 */
function displayPageContent(pdfName, pageNumber, pageContent, pdfPath) {
    const lessonView = document.getElementById('lesson-view');
    if (!lessonView) return;
    
    if (!pageContent || pageContent.trim() === '') {
        lessonView.innerHTML = `
            <h2>No Content Found</h2>
            <p>Unable to retrieve page content. Please try clicking the source link to view the PDF directly.</p>
        `;
        return;
    }
    
    // Format the page content - split into paragraphs and format
    let formattedContent = pageContent
        .split(/\n\s*\n/) // Split by double newlines (paragraphs)
        .filter(p => p.trim().length > 0)
        .map(p => `<p>${p.trim()}</p>`)
        .join('');
    
    // If no paragraphs found, just display as is with line breaks
    if (!formattedContent) {
        formattedContent = pageContent.split('\n').map(line => line.trim()).filter(line => line).map(line => `<p>${line}</p>`).join('');
    }
    
    lessonView.innerHTML = `
        <div class="lesson-header">
            <h2>${pdfName}</h2>
            <p class="page-info">📄 Page ${pageNumber}</p>
        </div>
        <div class="lesson-content">
            ${formattedContent}
        </div>
        <div class="lesson-footer">
            <a href="${pdfPath}#page=${pageNumber}" target="_blank" class="source-link" onclick="openPDFAtPage(event, '${pdfPath}', ${pageNumber})">
                📖 View Full PDF Source
            </a>
        </div>
    `;
}

/**
 * Main chatbot function
 */
async function askBot() {
    if (isIndexing) {
        const chatBox = document.getElementById("chat-box");
        chatBox.innerHTML += `<p><strong>Bot:</strong> Please wait, I'm still loading the knowledge base...</p>`;
        return;
    }
    
    let inputField = document.getElementById("user-msg");
    let chatBox = document.getElementById("chat-box");
    let userText = inputField.value.trim();
    
    if (userText === "") return;
    
    // Display user message
    chatBox.innerHTML += `<p><strong>You:</strong> ${userText}</p>`;
    
    // Show thinking indicator
    chatBox.innerHTML += `<p><strong>Bot:</strong> <em>Searching knowledge base...</em></p>`;
    chatBox.scrollTop = chatBox.scrollHeight;
    
    // Generate response
    setTimeout(() => {
        const response = generateResponse(userText);
        
        // Update lesson view with page content
        if (response.pageContent && response.source) {
            displayPageContent(response.pdfName, response.pageNumber, response.pageContent, response.source);
        } else {
            // If no content found, show a message
            const lessonView = document.getElementById('lesson-view');
            if (lessonView) {
                lessonView.innerHTML = `
                    <h2>No Results Found</h2>
                    <p>I couldn't find relevant information about that topic. Try asking about programming concepts, languages, or technologies!</p>
                `;
            }
        }
        
        let responseHTML = `<p><strong>Bot:</strong> ${response.message.replace(/\n/g, '<br>')}`;
        if (response.source) {
            // Create link with page number parameter
            const pdfUrl = response.pageNumber 
                ? `${response.source}#page=${response.pageNumber}`
                : response.source;
            responseHTML += `<br><br><small>📄 Source: <a href="${pdfUrl}" target="_blank" onclick="openPDFAtPage(event, '${response.source}', ${response.pageNumber || 1})">${response.pdfName}${response.pageNumber ? ` (Page ${response.pageNumber})` : ''}</a></small>`;
        }
        responseHTML += `</p>`;
        
        // Remove thinking indicator and add actual response
        const lastP = chatBox.querySelector('p:last-child');
        if (lastP && lastP.innerHTML.includes('Searching')) {
            lastP.outerHTML = responseHTML;
        } else {
            chatBox.innerHTML += responseHTML;
        }
        
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 500);
    
    inputField.value = "";
}

/**
 * Generates a friendly display name from PDF filename
 */
function getPDFDisplayName(pdfPath) {
    const filename = pdfPath.split('/').pop().replace('.pdf', '');
    // Convert "JavaScriptNotesForProfessionals" to "JavaScript Notes"
    // Remove "NotesForProfessionals" and split camelCase
    let displayName = filename
        .replace(/NotesForProfessionals$/i, '')
        .replace(/([A-Z])/g, ' $1')
        .trim();
    
    // Handle special cases
    if (displayName.includes('JS')) {
        displayName = displayName.replace(/\bJS\b/, 'JavaScript');
    }
    if (displayName.includes('SQL')) {
        displayName = displayName.replace(/\bSQL\b/, 'SQL');
    }
    if (displayName.includes('NET')) {
        displayName = displayName.replace(/\bNET\b/, '.NET');
    }
    
    return displayName || filename;
}

/**
 * Toggles the modules dropdown
 */
function toggleModules() {
    const dropdown = document.getElementById('pdf-dropdown');
    const header = document.querySelector('.modules-header');
    dropdown.classList.toggle('show');
    header.classList.toggle('collapsed');
}

/**
 * Toggles the sidebar on mobile devices
 */
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('mobile-open');
}

/**
 * Generates sidebar buttons for all PDFs
 */
function generatePDFButtons() {
    const container = document.getElementById('pdf-dropdown');
    if (!container) return;
    
    container.innerHTML = ''; // Clear existing buttons
    
    pdfFiles.forEach(pdfPath => {
        const displayName = getPDFDisplayName(pdfPath);
        const button = document.createElement('button');
        button.textContent = `📜 ${displayName}`;
        button.onclick = () => window.open(pdfPath);
        button.title = `Open ${displayName}`;
        container.appendChild(button);
    });
}

/**
 * Opens PDF at a specific page number
 */
function openPDFAtPage(event, pdfPath, pageNumber) {
    event.preventDefault();
    const url = `${pdfPath}#page=${pageNumber}`;
    window.open(url, '_blank');
}

// Viewer count tracking
let viewerCount = 0;
let viewerId = null;
let viewerCountInterval = null;
let viewerPingInterval = null;
// Automatically detect server URL based on current page location
const SERVER_URL = window.location.origin; // Uses current host (works for localhost or IP access)

/**
 * Updates viewer count from server
 */
async function updateViewerCount() {
    try {
        const response = await fetch(`${SERVER_URL}/api/viewers`);
        if (response.ok) {
            const data = await response.json();
            viewerCount = data.count || 0;
            updateViewerCountDisplay();
        }
    } catch (error) {
        // Server not available - use fallback
        console.log('Viewer count server not available');
        viewerCount = 0;
        updateViewerCountDisplay();
    }
}

/**
 * Registers this client as a viewer
 */
async function registerViewer() {
    try {
        const response = await fetch(`${SERVER_URL}/api/viewers/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timestamp: Date.now() })
        });
        if (response.ok) {
            const data = await response.json();
            viewerId = data.viewerId;
            viewerCount = data.count || 0;
            updateViewerCountDisplay();
            
            // Start pinging server to keep viewer active
            viewerPingInterval = setInterval(pingServer, 5000); // Ping every 5 seconds
        }
    } catch (error) {
        console.log('Could not register viewer - server may not be running');
    }
}

/**
 * Pings server to keep viewer active
 */
async function pingServer() {
    if (!viewerId) return;
    
    try {
        const response = await fetch(`${SERVER_URL}/api/viewers/ping`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ viewerId: viewerId, timestamp: Date.now() })
        });
        if (response.ok) {
            const data = await response.json();
            viewerCount = data.count || 0;
            updateViewerCountDisplay();
        }
    } catch (error) {
        // Server not available
    }
}

/**
 * Unregisters this client as a viewer
 */
async function unregisterViewer() {
    if (viewerPingInterval) {
        clearInterval(viewerPingInterval);
    }
    // Note: In a real implementation, you'd send a leave request
    // For now, the server will timeout inactive viewers
}

/**
 * Updates viewer count display
 */
function updateViewerCountDisplay() {
    const viewerNumber = document.getElementById('viewer-number');
    const classroomViewerCount = document.getElementById('classroom-viewer-count');
    
    if (viewerNumber) {
        viewerNumber.textContent = viewerCount;
    }
    if (classroomViewerCount) {
        classroomViewerCount.textContent = viewerCount;
    }
}

/**
 * Fetches classroom files from server
 */
async function fetchClassroomFiles() {
    try {
        const response = await fetch(`${SERVER_URL}/api/classroom/files`);
        if (response.ok) {
            const files = await response.json();
            displayClassroomFiles(files);
            return files;
        }
    } catch (error) {
        console.error('Error fetching classroom files:', error);
        const materialsDiv = document.getElementById('classroom-materials');
        if (materialsDiv) {
            materialsDiv.innerHTML = '<p>⚠️ Could not load classroom materials. Make sure the server is running.</p>';
        }
    }
    return [];
}

/**
 * Displays classroom files
 */
function displayClassroomFiles(files) {
    const studentView = document.getElementById('classroom-materials');
    const teacherView = document.getElementById('uploaded-materials');
    
    if (!studentView && !teacherView) return;
    
    if (files.length === 0) {
        const message = '<p>No materials available in the classroom folder.</p>';
        if (studentView) studentView.innerHTML = message;
        if (teacherView) teacherView.innerHTML = message;
        return;
    }
    
    // Format file size
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    // Create HTML for files
    let html = '<div class="materials-grid">';
    files.forEach(file => {
        html += `
            <div class="material-card">
                <div class="material-icon">${file.icon}</div>
                <div class="material-info">
                    <h4>${file.name}</h4>
                    <p class="material-meta">${formatFileSize(file.size)} • 👁️ ${file.views} views</p>
                </div>
                <div class="material-actions">
                    <a href="${SERVER_URL}${file.url}" target="_blank" 
                       onclick="trackFileView('${file.name.replace(/'/g, "\\'")}')" 
                       class="view-button">
                        📖 View
                    </a>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    if (studentView) studentView.innerHTML = html;
    if (teacherView) teacherView.innerHTML = html;
}

/**
 * Tracks when a file is viewed
 */
async function trackFileView(filename) {
    try {
        const encodedFilename = encodeURIComponent(filename);
        await fetch(`${SERVER_URL}/api/classroom/view/${encodedFilename}`, {
            method: 'GET'
        });
        // Refresh file list to update view counts
        setTimeout(() => fetchClassroomFiles(), 500);
    } catch (error) {
        console.error('Error tracking file view:', error);
    }
}

/**
 * Shows classroom view
 */
function showClassroom() {
    document.getElementById('lesson-view').style.display = 'none';
    document.getElementById('chat-container').style.display = 'none';
    document.getElementById('classroom-view').style.display = 'block';
    
    // Fetch and display classroom files
    fetchClassroomFiles();
    
    // Set up auto-refresh every 5 seconds to update view counts
    if (window.classroomRefreshInterval) {
        clearInterval(window.classroomRefreshInterval);
    }
    window.classroomRefreshInterval = setInterval(() => {
        fetchClassroomFiles();
    }, 5000);
    
    // Check if user is teacher (you can implement authentication later)
    const isTeacher = localStorage.getItem('isTeacher') === 'true';
    if (isTeacher) {
        document.getElementById('teacher-panel').style.display = 'block';
    }
}

/**
 * Hides classroom view
 */
function hideClassroom() {
    document.getElementById('classroom-view').style.display = 'none';
    document.getElementById('lesson-view').style.display = 'block';
    document.getElementById('chat-container').style.display = 'flex';
    
    // Stop auto-refresh
    if (window.classroomRefreshInterval) {
        clearInterval(window.classroomRefreshInterval);
        window.classroomRefreshInterval = null;
    }
}

/**
 * Uploads classroom file (Note: Files should be placed in classroom/ folder manually on server)
 */
function uploadClassroomFile() {
    alert('To add files to the classroom:\n\n1. Place files in the "classroom" folder on the Raspberry Pi\n2. Files will automatically appear here\n3. All file types are supported (PDF, PPTX, images, etc.)');
    
    // Refresh the file list
    fetchClassroomFiles();
}

// Initialize the PDF index when page loads
window.addEventListener('DOMContentLoaded', () => {
    generatePDFButtons(); // Generate buttons first
    // Start with modules dropdown open
    const dropdown = document.getElementById('pdf-dropdown');
    const header = document.querySelector('.modules-header');
    if (dropdown && header) {
        dropdown.classList.add('show');
    }
    
    // Initialize viewer tracking
    registerViewer();
    updateViewerCount();
    viewerCountInterval = setInterval(updateViewerCount, 3000); // Update every 3 seconds
    
    indexAllPDFs(); // Then index PDFs
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    unregisterViewer();
    if (viewerCountInterval) {
        clearInterval(viewerCountInterval);
    }
});
