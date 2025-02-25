const axios = require('axios');

const axiosClient = axios.create({
    timeout: 5000, // 5 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosClient.interceptors.response.use(
    (response) => response, // return a successful response back to the calling function
    (error) => Promise.reject(error) // return an error to the calling function
);

module.exports = axiosClient;