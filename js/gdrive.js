/* ============================================
   DuitKu - Google Drive & Excel Export
   ============================================ */

const GDrive = {
    FOLDER_NAME: 'DuitKu Backups',
    folderId: null,

    // Initialize Google Drive API
    async init() {
        // Load the Drive API
        return new Promise((resolve) => {
            if (typeof gapi !== 'undefined') {
                gapi.load('client', async () => {
                    try {
                        await gapi.client.init({
                            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
                        });
                        console.log('Google Drive API initialized');
                        resolve(true);
                    } catch (error) {
                        console.error('Drive API init error:', error);
                        resolve(false);
                    }
                });
            } else {
                console.log('GAPI not loaded yet');
                resolve(false);
            }
        });
    },

    // Get or create DuitKu folder in Drive
    async getOrCreateFolder() {
        const token = await Auth.getToken();
        if (!token) {
            alert('Please sign in to use Google Drive features');
            return null;
        }

        try {
            // Search for existing folder
            const searchResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            const searchData = await searchResponse.json();

            if (searchData.files && searchData.files.length > 0) {
                this.folderId = searchData.files[0].id;
                return this.folderId;
            }

            // Create new folder
            const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: this.FOLDER_NAME,
                    mimeType: 'application/vnd.google-apps.folder'
                })
            });
            const createData = await createResponse.json();
            this.folderId = createData.id;
            return this.folderId;

        } catch (error) {
            console.error('Folder error:', error);
            return null;
        }
    },

    // Sync data to Google Drive
    async syncToGDrive() {
        const token = await Auth.getToken();
        if (!token) {
            alert('Please sign in to sync to Google Drive');
            return false;
        }

        try {
            const folderId = await this.getOrCreateFolder();
            if (!folderId) return false;

            const data = Storage.exportAllData();
            const content = JSON.stringify(data, null, 2);
            const fileName = `duitku_backup_${new Date().toISOString().split('T')[0]}.json`;

            // Create file metadata
            const metadata = {
                name: fileName,
                parents: [folderId],
                mimeType: 'application/json'
            };

            // Create multipart request body
            const boundary = 'duitku_boundary';
            const body = `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${content}\r\n--${boundary}--`;

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': `multipart/related; boundary=${boundary}`
                },
                body
            });

            if (response.ok) {
                alert('✅ Data synced to Google Drive successfully!');
                return true;
            } else {
                throw new Error('Upload failed');
            }

        } catch (error) {
            console.error('Sync error:', error);
            alert('❌ Failed to sync to Google Drive');
            return false;
        }
    },

    // Restore data from Google Drive
    async restoreFromGDrive() {
        const token = await Auth.getToken();
        if (!token) {
            alert('Please sign in to restore from Google Drive');
            return false;
        }

        try {
            const folderId = await this.getOrCreateFolder();
            if (!folderId) return false;

            // Find latest backup file
            const searchResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and name contains 'duitku_backup' and trashed=false&orderBy=createdTime desc&pageSize=1`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            const searchData = await searchResponse.json();

            if (!searchData.files || searchData.files.length === 0) {
                alert('No backup found in Google Drive');
                return false;
            }

            // Download the file
            const fileId = searchData.files[0].id;
            const downloadResponse = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            const data = await downloadResponse.json();

            if (confirm('This will replace your current data. Continue?')) {
                Storage.importAllData(data);
                alert('✅ Data restored successfully! Refreshing...');
                location.reload();
                return true;
            }

        } catch (error) {
            console.error('Restore error:', error);
            alert('❌ Failed to restore from Google Drive');
            return false;
        }
    },

    // Export to Excel
    exportToExcel(type = 'all') {
        if (typeof XLSX === 'undefined') {
            alert('Excel library not loaded. Please refresh the page.');
            return;
        }

        const wb = XLSX.utils.book_new();
        const mode = Storage.getMode();

        if (type === 'all' || type === 'expenses') {
            const expenses = Storage.getExpenses();
            const expenseData = expenses.map(e => ({
                Date: e.date,
                Category: e.category,
                Amount: e.amount,
                Note: e.note || '',
                Mode: e.mode
            }));
            const expenseSheet = XLSX.utils.json_to_sheet(expenseData);
            XLSX.utils.book_append_sheet(wb, expenseSheet, 'Expenses');
        }

        if (type === 'all' || type === 'investments') {
            const investments = Storage.getInvestments();
            const investmentData = investments.map(i => ({
                Type: i.type,
                Name: i.name,
                'Buy Price': i.buyPrice,
                'Current Value': i.currentValue,
                Units: i.units || '',
                'Purchase Date': i.date,
                'Profit/Loss': i.currentValue - i.buyPrice,
                Mode: i.mode
            }));
            const investmentSheet = XLSX.utils.json_to_sheet(investmentData);
            XLSX.utils.book_append_sheet(wb, investmentSheet, 'Investments');
        }

        if (type === 'all') {
            const tabung = Storage.getTabung();
            const tabungData = tabung.map(t => ({
                Name: t.name,
                Target: t.target,
                Current: t.current,
                Progress: ((t.current / t.target) * 100).toFixed(1) + '%',
                Deadline: t.deadline,
                Mode: t.mode
            }));
            const tabungSheet = XLSX.utils.json_to_sheet(tabungData);
            XLSX.utils.book_append_sheet(wb, tabungSheet, 'Tabung');
        }

        // Generate filename
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `DuitKu_${type}_${dateStr}.xlsx`;

        // Download
        XLSX.writeFile(wb, fileName);

        return { wb, fileName };
    },

    // Save Excel to Google Drive
    async saveExcelToGDrive(type = 'all') {
        const token = await Auth.getToken();
        if (!token) {
            alert('Please sign in to save to Google Drive');
            return false;
        }

        try {
            const folderId = await this.getOrCreateFolder();
            if (!folderId) return false;

            // Generate Excel file
            const { wb, fileName } = this.exportToExcel(type);

            // Convert to blob
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            // Upload to Drive
            const metadata = {
                name: fileName,
                parents: [folderId],
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            };

            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            formData.append('file', blob);

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                alert(`✅ ${fileName} saved to Google Drive!`);
                return true;
            } else {
                throw new Error('Upload failed');
            }

        } catch (error) {
            console.error('Save Excel error:', error);
            alert('❌ Failed to save to Google Drive');
            return false;
        }
    }
};

// Global functions
function syncToGDrive() {
    GDrive.syncToGDrive();
}

function restoreFromGDrive() {
    GDrive.restoreFromGDrive();
}

function exportToExcel() {
    GDrive.exportToExcel('all');
}

function saveToGDrive() {
    GDrive.saveExcelToGDrive('all');
}

function exportAllData() {
    const data = Storage.exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duitku_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function clearAllData() {
    if (confirm('⚠️ This will delete ALL your data. This cannot be undone! Continue?')) {
        if (confirm('Are you REALLY sure?')) {
            Storage.clearAllData();
            alert('All data cleared. Refreshing...');
            location.reload();
        }
    }
}
