const axios = require('axios');
axios.defaults.withCredentials = true;


async function createMailBox() {
    const response = await axios.get(
        'https://tempmail-production.up.railway.app/getMail',
    );
    console.log(response.data);
    return response.data;
}

async function getMessages(token) {
    const response = await axios.get(
        `https://tempmail-production.up.railway.app/messages/${token}`,
    );
    return response.data;
}

async function getMessage(token,mid) {
    const response = await axios.get(
        `https://tempmail-production.up.railway.app/message/${token}/${mid}`,
    );
    return response.data;
}


module.exports = { createMailBox, getMessages ,getMessage};