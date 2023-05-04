const axios = require('axios');
axios.defaults.withCredentials = true;


async function createMailBox() {
    const response = await axios.get(
        'https://tmail-4kv0.onrender.com/getMail',
    );
    console.log(response.data);
    return response.data;
}

async function getMessages(token) {
    const response = await axios.get(
        `https://tmail-4kv0.onrender.com/messages/${token}`,
    );
    return response.data;
}

async function getMessage(token,mid) {
    const response = await axios.get(
        `https://tmail-4kv0.onrender.com/message/${token}/${mid}`,
    );
    return response.data;
}


module.exports = { createMailBox, getMessages ,getMessage};