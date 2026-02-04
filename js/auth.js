/* ============================================
   DuitKu - Google Authentication
   ============================================ */

const Auth = {
    // Replace with your Google Cloud Console Client ID
    CLIENT_ID: '327643652169-dh82c8f4kadl2qdvkrkv2e9nf2pq1b0q.apps.googleusercontent.com',

    // Scopes needed for the app
    SCOPES: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/calendar.events'
    ].join(' '),

    tokenClient: null,
    accessToken: null,

    // Initialize Google Sign-In
    init() {
        // Wait for Google Identity Services to load
        if (typeof google === 'undefined') {
            console.log('Waiting for Google Identity Services...');
            setTimeout(() => this.init(), 100);
            return;
        }

        try {
            // Initialize the Google Identity Services
            google.accounts.id.initialize({
                client_id: this.CLIENT_ID,
                callback: this.handleCredentialResponse.bind(this),
                auto_select: true
            });

            // Render the Google Sign-In button
            google.accounts.id.renderButton(
                document.getElementById('google-signin-btn'),
                {
                    theme: 'filled_blue',
                    size: 'large',
                    width: 280,
                    text: 'signin_with'
                }
            );

            // Check if user is already signed in
            const savedUser = Storage.getUser();
            if (savedUser) {
                this.onSignIn(savedUser);
            }

            // Initialize OAuth2 token client for API access
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.CLIENT_ID,
                scope: this.SCOPES,
                callback: (response) => {
                    if (response.access_token) {
                        this.accessToken = response.access_token;
                        console.log('Access token obtained');
                    }
                }
            });

        } catch (error) {
            console.error('Google Sign-In init error:', error);
        }
    },

    // Handle the credential response from Google Sign-In
    handleCredentialResponse(response) {
        try {
            // Decode the JWT token to get user info
            const payload = this.parseJwt(response.credential);

            const user = {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                token: response.credential
            };

            Storage.setUser(user);
            this.onSignIn(user);

            // Get access token for API calls
            this.getAccessToken();

        } catch (error) {
            console.error('Error parsing credential:', error);
        }
    },

    // Parse JWT token
    parseJwt(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    },

    // Get access token for API calls
    getAccessToken() {
        if (this.tokenClient) {
            this.tokenClient.requestAccessToken();
        }
    },

    // Called when user successfully signs in
    onSignIn(user) {
        console.log('User signed in:', user.name);

        // Hide login screen, show app
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');

        // Update user profile in header
        document.getElementById('user-avatar').src = user.picture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name);
        document.getElementById('user-name').textContent = user.name.split(' ')[0];

        // Initialize app
        if (typeof App !== 'undefined') {
            App.init();
        }
    },

    // Sign out
    signOut() {
        if (confirm('Are you sure you want to sign out?')) {
            google.accounts.id.disableAutoSelect();
            Storage.clearUser();
            this.accessToken = null;

            // Show login screen, hide app
            document.getElementById('login-screen').classList.remove('hidden');
            document.getElementById('app').classList.add('hidden');

            // Reload page to reset state
            location.reload();
        }
    },

    // Check if user is signed in
    isSignedIn() {
        return Storage.getUser() !== null;
    },

    // Get current user
    getUser() {
        return Storage.getUser();
    },

    // Get access token (request new one if needed)
    async getToken() {
        return new Promise((resolve) => {
            if (this.accessToken) {
                resolve(this.accessToken);
            } else if (this.tokenClient) {
                this.tokenClient.callback = (response) => {
                    if (response.access_token) {
                        this.accessToken = response.access_token;
                        resolve(this.accessToken);
                    } else {
                        resolve(null);
                    }
                };
                this.tokenClient.requestAccessToken();
            } else {
                resolve(null);
            }
        });
    }
};

// Global sign out function
function signOut() {
    Auth.signOut();
}

// Initialize auth when page loads
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
