/**
 * Storage System untuk Aplikasi Absensi OSIS
 * Hybrid: Firebase untuk absensi/kode akses/admin, Local Storage untuk anggota/struktur
 */

const Storage = {
  COLLECTIONS: {
    MEMBERS: 'members',
    ACCESS_CODES: 'access_codes',
    ATTENDANCE: 'attendance',
    ADMIN_PASSWORD: 'admin_password',
    OSIS_STRUCTURE: 'osis_structure'
  },

  // Local storage keys
  LOCAL_KEYS: {
    MEMBERS: 'local_members',
    OSIS_STRUCTURE: 'local_osis_structure',
    PHOTOS: 'local_photos'
  },

  ready: null,

  async init() {
    try {
      if (!window.db) {
        throw new Error('Firebase belum dikonfigurasi. Pastikan kode Firebase dimuat sebelum js/storage.js');
      }

      // Initialize local storage
      this.initLocalStorage();

      // Initialize Firebase data
      const adminDoc = await this.getDocData('admin', 'password');
      if (!adminDoc) {
        await this.setDocData('admin', 'password', { password: 'admin123' });
      }

      return true;
    } catch (error) {
      console.error('Error initializing storage:', error);
      return false;
    }
  },

  // Initialize local storage structure
  initLocalStorage() {
    if (!localStorage.getItem(this.LOCAL_KEYS.MEMBERS)) {
      localStorage.setItem(this.LOCAL_KEYS.MEMBERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.LOCAL_KEYS.OSIS_STRUCTURE)) {
      localStorage.setItem(this.LOCAL_KEYS.OSIS_STRUCTURE, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.LOCAL_KEYS.PHOTOS)) {
      localStorage.setItem(this.LOCAL_KEYS.PHOTOS, JSON.stringify({}));
    }
  },

  // Local storage helper methods
  getLocalData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting local data:', error);
      return null;
    }
  },

  setLocalData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error setting local data:', error);
      return false;
    }
  },

  // Firebase methods (for attendance, access codes, admin password)
  async getDocData(collectionName, docId) {
    try {
      const docRef = doc(window.db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error('Error getting document:', error);
      return null;
    }
  },

  async setDocData(collectionName, docId, data) {
    try {
      await setDoc(doc(window.db, collectionName, docId), data);
      return true;
    } catch (error) {
      console.error('Error setting document:', error);
      return false;
    }
  },

  async getCollectionData(collectionName) {
    try {
      const querySnapshot = await getDocs(collection(window.db, collectionName));
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      return data;
    } catch (error) {
      console.error('Error getting collection:', error);
      return [];
    }
  },

  async deleteDocData(collectionName, docId) {
    try {
      await deleteDoc(doc(window.db, collectionName, docId));
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  },

  // Local storage methods (for members and osis structure)
  async getAllMembers() {
    return this.getLocalData(this.LOCAL_KEYS.MEMBERS) || [];
  },

  async addMember(name, position = '') {
    const members = await this.getAllMembers();
    if (members.find(m => m.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('Nama anggota sudah terdaftar!');
    }

    const newMember = {
      id: Date.now().toString(),
      name: name.trim(),
      position: position.trim(),
      createdAt: new Date().toISOString()
    };

    members.push(newMember);
    const success = this.setLocalData(this.LOCAL_KEYS.MEMBERS, members);
    if (success) return newMember;
    throw new Error('Gagal menambahkan anggota');
  },

  async getMemberById(id) {
    const members = await this.getAllMembers();
    return members.find(m => m.id === id) || null;
  },

  async deleteMember(id) {
    const members = await this.getAllMembers();
    const filteredMembers = members.filter(m => m.id !== id);
    return this.setLocalData(this.LOCAL_KEYS.MEMBERS, filteredMembers);
  },

  async setAccessCode(code, date) {
    const docId = `code_${date}`;
    const data = {
      code: code.trim(),
      date: date,
      createdAt: new Date().toISOString()
    };
    return await this.setDocData(this.COLLECTIONS.ACCESS_CODES, docId, data);
  },

  async getAccessCode(date) {
    const docId = `code_${date}`;
    const data = await this.getDocData(this.COLLECTIONS.ACCESS_CODES, docId);
    return data ? data.code : null;
  },

  async recordAttendance(memberId, date, status) {
    const docId = `${memberId}_${date}`;
    const now = new Date();
    const checkInTime = now.toISOString();
    const hour = now.getHours();
    const minute = now.getMinutes();

    let finalStatus = status;
    if (hour > 7 || (hour === 7 && minute > 0)) {
      finalStatus = 'telat';
    }

    const data = {
      memberId: memberId.toString(),
      date: date,
      status: finalStatus,
      timeCheckIn: checkInTime
    };

    return await this.setDocData(this.COLLECTIONS.ATTENDANCE, docId, data);
  },

  async autoMarkAbsentees(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const attendance = await this.getCollectionData(this.COLLECTIONS.ATTENDANCE);
    const members = await this.getAllMembers();

    const attendanceMap = {};
    attendance.forEach(a => {
      if (a.date === targetDate) attendanceMap[a.memberId] = true;
    });

    const promises = members.map(async member => {
      if (!attendanceMap[member.id]) {
        const docId = `${member.id}_${targetDate}`;
        const data = {
          memberId: member.id,
          date: targetDate,
          status: 'tidak hadir',
          timeCheckIn: new Date().toISOString(),
          isAutoMarked: true
        };
        await this.setDocData(this.COLLECTIONS.ATTENDANCE, docId, data);
      }
    });

    await Promise.all(promises);
    return true;
  },

  async getAttendanceByDate(date) {
    const attendance = await this.getCollectionData(this.COLLECTIONS.ATTENDANCE);
    const members = await this.getAllMembers();
    const dateRecords = attendance.filter(a => a.date === date);

    return members.map(member => {
      const record = dateRecords.find(a => a.memberId === member.id);
      return {
        ...member,
        status: record ? record.status : null,
        timeCheckIn: record ? record.timeCheckIn : null,
        isAutoMarked: record ? record.isAutoMarked : false
      };
    });
  },

  async getAttendanceByDateAsObject(date) {
    const attendance = await this.getCollectionData(this.COLLECTIONS.ATTENDANCE);
    const dateRecords = attendance.filter(a => a.date === date);
    const result = {};
    dateRecords.forEach(record => {
      result[record.memberId] = record;
    });
    return result;
  },

  async getAttendanceSummary(startDate, endDate) {
    const attendance = await this.getCollectionData(this.COLLECTIONS.ATTENDANCE);
    const members = await this.getAllMembers();

    return members.map(member => {
      const memberRecords = attendance.filter(a =>
        a.memberId === member.id && a.date >= startDate && a.date <= endDate
      );

      return {
        ...member,
        hadir: memberRecords.filter(a => a.status === 'hadir').length,
        telat: memberRecords.filter(a => a.status === 'telat').length,
        tidakHadir: memberRecords.filter(a => a.status === 'tidak hadir').length,
        totalAttendance: memberRecords.length
      };
    });
  },

  async getDetailedRecap(startDate, endDate) {
    const attendance = await this.getCollectionData(this.COLLECTIONS.ATTENDANCE);
    const members = await this.getAllMembers();
    const result = {};

    members.forEach(member => {
      result[member.id] = {
        ...member,
        records: []
      };
    });

    attendance.forEach(record => {
      if (record.date >= startDate && record.date <= endDate && result[record.memberId]) {
        result[record.memberId].records.push({
          date: record.date,
          status: record.status,
          isAutoMarked: record.isAutoMarked
        });
      }
    });

    return Object.values(result).sort((a, b) => a.name.localeCompare(b.name));
  },

  async getMemberAttendance(memberId, startDate, endDate) {
    const attendance = await this.getCollectionData(this.COLLECTIONS.ATTENDANCE);
    return attendance.filter(a =>
      a.memberId === memberId &&
      a.date >= startDate &&
      a.date <= endDate
    );
  },

  async updateAttendance(memberId, date, newStatus) {
    const docId = `${memberId}_${date}`;
    const existing = await this.getDocData(this.COLLECTIONS.ATTENDANCE, docId);
    if (existing) {
      const updated = { ...existing, status: newStatus };
      return await this.setDocData(this.COLLECTIONS.ATTENDANCE, docId, updated);
    }
    return false;
  },

  async deleteAttendanceRecord(date, memberId) {
    const docId = `${memberId}_${date}`;
    return await this.deleteDocData(this.COLLECTIONS.ATTENDANCE, docId);
  },

  async getAdminPassword() {
    const data = await this.getDocData('admin', 'password');
    return data ? data.password : 'admin123';
  },

  async setAdminPassword(password) {
    return await this.setDocData('admin', 'password', { password: password });
  },

  async verifyAdminPassword(password) {
    const storedPassword = await this.getAdminPassword();
    return password === storedPassword;
  },

  async exportData() {
    const [members, accessCodes, attendance, osisStructure] = await Promise.all([
      this.getAllMembers(),
      this.getCollectionData(this.COLLECTIONS.ACCESS_CODES),
      this.getCollectionData(this.COLLECTIONS.ATTENDANCE),
      this.getAllOsisStructure()
    ]);

    return {
      members,
      accessCodes,
      attendance,
      osisStructure,
      exportDate: new Date().toISOString()
    };
  },

  async importData(data) {
    try {
      if (data.members) {
        this.setLocalData(this.LOCAL_KEYS.MEMBERS, data.members);
      }
      if (data.accessCodes) {
        await Promise.all(data.accessCodes.map(code =>
          this.setDocData(this.COLLECTIONS.ACCESS_CODES, code.id || `code_${code.date}`, code)
        ));
      }
      if (data.attendance) {
        await Promise.all(data.attendance.map(record =>
          this.setDocData(this.COLLECTIONS.ATTENDANCE, `${record.memberId}_${record.date}`, record)
        ));
      }
      if (data.osisStructure) {
        this.setLocalData(this.LOCAL_KEYS.OSIS_STRUCTURE, data.osisStructure);
      }
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  },

  async clearAllData() {
    try {
      // Clear local storage data
      localStorage.removeItem(this.LOCAL_KEYS.MEMBERS);
      localStorage.removeItem(this.LOCAL_KEYS.OSIS_STRUCTURE);
      localStorage.removeItem(this.LOCAL_KEYS.PHOTOS);

      // Reinitialize local storage
      this.initLocalStorage();

      console.log('Local storage data cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing local data:', error);
      return false;
    }
  },

  async getAllOsisStructure() {
    return this.getLocalData(this.LOCAL_KEYS.OSIS_STRUCTURE) || [];
  },

  async addOsisPosition(position, name, level = 'member', parentLevel = null, photo = null) {
    const structure = await this.getAllOsisStructure();

    const newPosition = {
      id: Date.now().toString(),
      position: position.trim(),
      name: name.trim(),
      level: level,
      parentLevel: parentLevel,
      photo: photo, // This will be a data URL for local storage
      createdAt: new Date().toISOString()
    };

    structure.push(newPosition);
    const success = this.setLocalData(this.LOCAL_KEYS.OSIS_STRUCTURE, structure);
    if (success) return newPosition;
    throw new Error('Gagal menambahkan posisi OSIS');
  },

  async updateOsisPosition(id, position, name, level = 'member', parentLevel = null, photo = null) {
    const structure = await this.getAllOsisStructure();
    const index = structure.findIndex(item => item.id === id);
    if (index === -1) return null;

    const updated = {
      ...structure[index],
      position: position.trim(),
      name: name.trim(),
      level: level,
      parentLevel: parentLevel,
      photo: photo || structure[index].photo,
      updatedAt: new Date().toISOString()
    };

    structure[index] = updated;
    const success = this.setLocalData(this.LOCAL_KEYS.OSIS_STRUCTURE, structure);
    return success ? updated : null;
  },

  async deleteOsisPosition(id) {
    const structure = await this.getAllOsisStructure();
    const filteredStructure = structure.filter(item => item.id !== id);
    return this.setLocalData(this.LOCAL_KEYS.OSIS_STRUCTURE, filteredStructure);
  },

  // Wait for Firebase to be ready (only Firestore, not Storage)
  async waitForFirebase() {
    return new Promise((resolve) => {
      const checkFirebase = () => {
        if (window.db && window.collection && window.doc) {
          resolve(true);
        } else {
          setTimeout(checkFirebase, 50); // Check every 50ms
        }
      };
      checkFirebase();
    });
  }
};

// Initialize Storage.ready as a Promise that waits for Firebase
Storage.ready = (async () => {
  await Storage.waitForFirebase();
  return await Storage.init();
})();
