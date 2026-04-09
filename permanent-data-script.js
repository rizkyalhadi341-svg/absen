// Script untuk membuat data permanent di browser lain
// Jalankan di browser console target

const PERMANENT_DATA_SCRIPT = {
// Data yang akan diinject - GANTI DENGAN DATA EKSPORT ANDA
data: null,

// Inject data ke localStorage
injectData: function(jsonData) {
  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

    if (data.members) {
      localStorage.setItem('local_members', JSON.stringify(data.members));
      console.log(`✅ Injected ${data.members.length} members`);
    }

    if (data.osisStructure) {
      localStorage.setItem('local_osis_structure', JSON.stringify(data.osisStructure));
      console.log(`✅ Injected ${data.osisStructure.length} structure items`);
    }

    if (data.photos) {
      localStorage.setItem('local_photos', JSON.stringify(data.photos));
      console.log(`✅ Injected photos data`);
    }

    console.log('🎉 Data berhasil diinject! Refresh halaman untuk melihat perubahan.');
    return true;
  } catch (error) {
    console.error('❌ Error injecting data:', error);
    return false;
  }
},

// Export data dari browser saat ini
exportData: async function() {
  try {
    // Cek apakah Storage tersedia
    if (typeof Storage === 'undefined') {
      console.error('❌ Storage tidak tersedia');
      return null;
    }

    const data = await Storage.exportData();
    const jsonData = JSON.stringify(data);

    console.log('📤 Data berhasil di-export');
    console.log('📋 Copy kode berikut dan jalankan di browser target:');
    console.log('');
    console.log(`PERMANENT_DATA_SCRIPT.injectData(${jsonData});`);
    console.log('');

    // Juga tampilkan sebagai object untuk copy manual
    console.log('📋 Atau copy object JSON berikut:');
    console.log(jsonData);

    return jsonData;
  } catch (error) {
    console.error('❌ Error export data:', error);
    return null;
  }
},

// Clear semua data local
clearLocalData: function() {
  try {
    localStorage.removeItem('local_members');
    localStorage.removeItem('local_osis_structure');
    localStorage.removeItem('local_photos');

    // Reinitialize
    localStorage.setItem('local_members', JSON.stringify([]));
    localStorage.setItem('local_osis_structure', JSON.stringify([]));
    localStorage.setItem('local_photos', JSON.stringify({}));

    console.log('🗑️ Data local berhasil dihapus');
    return true;
  } catch (error) {
    console.error('❌ Error clear data:', error);
    return false;
  }
},

// Verifikasi data
verifyData: function() {
  try {
    const members = JSON.parse(localStorage.getItem('local_members') || '[]');
    const structure = JSON.parse(localStorage.getItem('local_osis_structure') || '[]');

    console.log('📊 Verifikasi Data:');
    console.log(`👥 Members: ${members.length}`);
    console.log(`🏢 Structure: ${structure.length}`);

    if (structure.length > 0) {
      const withPhotos = structure.filter(item => item.photo).length;
      console.log(`📸 Structure dengan foto: ${withPhotos}/${structure.length}`);
    }

    return { members: members.length, structure: structure.length };
  } catch (error) {
    console.error('❌ Error verify data:', error);
    return null;
  }
}
};

// Tampilkan instruksi
console.log('🚀 Permanent Data Script Loaded!');
console.log('');
console.log('📋 Instruksi penggunaan:');
console.log('1. Di browser dengan data: jalankan PERMANENT_DATA_SCRIPT.exportData()');
console.log('2. Copy kode yang dihasilkan');
console.log('3. Di browser target: paste dan jalankan kode tersebut');
console.log('4. Verifikasi dengan PERMANENT_DATA_SCRIPT.verifyData()');
console.log('');
console.log('🛠️  Tools lainnya:');
console.log('- PERMANENT_DATA_SCRIPT.clearLocalData() // Hapus semua data local');
console.log('- PERMANENT_DATA_SCRIPT.verifyData() // Cek jumlah data');

// Export global
window.PERMANENT_DATA_SCRIPT = PERMANENT_DATA_SCRIPT;