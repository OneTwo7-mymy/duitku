/* ============================================
   DuitKu - Sharing & Collaboration
   ============================================ */

const Sharing = {
    // Invite a collaborator
    inviteCollaborator() {
        const email = document.getElementById('invite-email').value.trim();
        const permission = document.getElementById('permission-level').value;

        if (!email) {
            alert('Please enter an email address');
            return;
        }

        if (!this.validateEmail(email)) {
            alert('Please enter a valid email address');
            return;
        }

        // Check if already added
        const collaborators = Storage.getCollaborators();
        if (collaborators.find(c => c.email === email)) {
            alert('This email is already a collaborator');
            return;
        }

        // Add collaborator
        const collaborator = Storage.addCollaborator({
            email,
            permission,
            name: email.split('@')[0]
        });

        // Clear input
        document.getElementById('invite-email').value = '';

        // Refresh list
        this.renderCollaborators();

        alert(`✅ Invitation sent to ${email} with ${permission === 'view' ? 'View Only' : 'Edit & View'} permission`);
    },

    // Remove collaborator
    removeCollaborator(id) {
        if (confirm('Remove this collaborator?')) {
            Storage.removeCollaborator(id);
            this.renderCollaborators();
        }
    },

    // Validate email
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // Render collaborators list
    renderCollaborators() {
        const container = document.getElementById('collaborators-list');
        const collaborators = Storage.getCollaborators();

        if (collaborators.length === 0) {
            container.innerHTML = '<p class="text-muted">No collaborators yet</p>';
            return;
        }

        container.innerHTML = collaborators.map(c => `
      <div class="flex items-center justify-between p-sm" style="background: var(--bg-input); border-radius: var(--radius-md); margin-bottom: var(--space-sm);">
        <div class="flex items-center gap-sm">
          <div style="width: 32px; height: 32px; background: var(--gradient-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.875rem;">
            ${c.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p class="text-sm font-semibold">${c.email}</p>
            <p class="text-sm text-muted">${c.permission === 'view' ? '👁️ View Only' : '✏️ Edit & View'}</p>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="Sharing.removeCollaborator('${c.id}')">✕</button>
      </div>
    `).join('');
    },

    // Initialize
    init() {
        this.renderCollaborators();
    }
};

// Global function
function inviteCollaborator() {
    Sharing.inviteCollaborator();
}
