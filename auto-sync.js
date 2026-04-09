// Auto-Sync System untuk data permanent
// Inject script ini ke semua halaman untuk sync otomatis

(function() {
  'use strict';

  // Konstanta
  const SYNC_CHANNEL = 'osis-data-sync';
  const SYNC_INTERVAL = 30000; // 30 detik
  const STORAGE_KEYS = {
    MEMBERS: 'local_members',
    STRUCTURE: 'local_osis_structure',
    PHOTOS: 'local_photos'
  };

  class DataSyncManager {
    constructor() {
      this.channel = null;
      this.interval = null;
      this.lastSync = null;
      this.isInitialized = false;

      this.init();
    }

    init() {
      if (this.isInitialized) return;

      try {
        // Setup BroadcastChannel
        this.channel = new BroadcastChannel(SYNC_CHANNEL);

        // Listen for messages
        this.channel.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        // Start periodic sync
        this.startPeriodicSync();

        // Mark initialized
        this.isInitialized = true;

        console.log('🔄 Data Sync Manager initialized');

        // Initial broadcast
        setTimeout(() => {
          this.broadcastData();
        }, 1000);

      } catch (error) {
        console.error('❌ Error initializing sync:', error);
      }
    }

    startPeriodicSync() {
      this.interval = setInterval(() => {
        this.broadcastData();
      }, SYNC_INTERVAL);
    }

    stopPeriodicSync() {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    }

    broadcastData() {
      try {
        const data = this.getLocalData();
        if (!data || (data.members.length === 0 && data.structure.length === 0)) {
          return; // Skip if no data
        }

        const message = {
          type: 'data-sync',
          data: data,
          timestamp: Date.now(),
          source: window.location.href
        };

        this.channel.postMessage(message);
        this.lastSync = Date.now();

        console.log('📤 Broadcasted data sync');
      } catch (error) {
        console.error('❌ Error broadcasting data:', error);
      }
    }

    handleMessage(message) {
      try {
        if (message.type === 'data-sync') {
          // Skip if message from self (within last 5 seconds)
          if (message.timestamp && (Date.now() - message.timestamp) < 5000) {
            return;
          }

          this.receiveData(message.data);
        }
      } catch (error) {
        console.error('❌ Error handling sync message:', error);
      }
    }

    getLocalData() {
      try {
        const members = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS) || '[]');
        const structure = JSON.parse(localStorage.getItem(STORAGE_KEYS.STRUCTURE) || '[]');
        const photos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PHOTOS) || '{}');

        return {
          members,
          structure,
          photos,
          lastModified: Date.now()
        };
      } catch (error) {
        console.error('❌ Error getting local data:', error);
        return null;
      }
    }

    receiveData(data) {
      try {
        if (!data) return;

        let updated = false;

        // Update members if newer
        if (data.members && Array.isArray(data.members)) {
          const currentMembers = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS) || '[]');
          if (data.members.length > currentMembers.length) {
            localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(data.members));
            updated = true;
            console.log(`📥 Synced ${data.members.length} members`);
          }
        }

        // Update structure if newer
        if (data.structure && Array.isArray(data.structure)) {
          const currentStructure = JSON.parse(localStorage.getItem(STORAGE_KEYS.STRUCTURE) || '[]');
          if (data.structure.length > currentStructure.length) {
            localStorage.setItem(STORAGE_KEYS.STRUCTURE, JSON.stringify(data.structure));
            updated = true;
            console.log(`📥 Synced ${data.structure.length} structure items`);
          }
        }

        // Update photos
        if (data.photos && typeof data.photos === 'object') {
          localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(data.photos));
        }

        if (updated) {
          console.log('🔄 Data synced from another browser');

          // Optional: Show notification
          this.showSyncNotification();
        }

      } catch (error) {
        console.error('❌ Error receiving sync data:', error);
      }
    }

    showSyncNotification() {
      // Create notification element
      const notification = document.createElement('div');
      notification.innerHTML = '🔄 Data synced from another browser';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 10000;
        font-family: Arial, sans-serif;
        animation: slideIn 0.3s ease;
      `;

      document.body.appendChild(notification);

      // Remove after 3 seconds
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 3000);
    }

    destroy() {
      this.stopPeriodicSync();
      if (this.channel) {
        this.channel.close();
        this.channel = null;
      }
      this.isInitialized = false;
      console.log('🛑 Data Sync Manager destroyed');
    }
  }

  // Inject CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // Initialize sync manager
  const syncManager = new DataSyncManager();

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    syncManager.destroy();
  });

  // Expose to global scope for debugging
  window.DataSyncManager = syncManager;

  console.log('🚀 Auto-Sync System loaded! Data akan tersinkron otomatis antar browser.');

})();