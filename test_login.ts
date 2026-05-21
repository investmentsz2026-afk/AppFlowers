import axios from 'axios';

(async () => {
  try {
    const res = await axios.post('https://appflowers.onrender.com/api/auth/login', {
      email: 'admin@apkexcel.com',
      password: 'admin123',
    }, {
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('Response:', res.data);
  } catch (err) {
    if (err.response) {
      console.error('Error status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
})();
