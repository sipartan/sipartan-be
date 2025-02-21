const axios = require('axios');

const axiosClient = axios.create({
    timeout: 5000, // 5 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
);

module.exports = axiosClient;