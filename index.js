const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { createMailBox, getMessages, getMessage } = require('./tempmail.js');
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});


var cors = require("cors");
app.use(cors());

const puppeteer = require('puppeteer');
const path = require('path');
const { getActLink } = require('./seedr.js');

async function start(socket) {

  // console.log("CREATING TOKEN");
  var { token, mailbox } = await createMailBox();

  socket.emit('email', mailbox);
  socket.emit('email',25);    

  console.log(token, mailbox);


  const pathToExtension = path.join(process.cwd(), './hcap_solver');
  const browser = await puppeteer.launch({
    headless: false,
    //   executablePath:"C:\\Program Files\\Mozilla Firefox\\firefox.exe",
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });


  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });


  await page.goto('https://www.seedr.cc');

  console.log('waiting for iframe with form to be ready.');
  await page.waitForSelector('iframe');
  console.log('iframe is ready. Loading iframe content');

  const elementHandle = await page.$(
    'iframe[src="https://www.seedr.cc/auth/pages/signup"]',
  );
  const frame = await elementHandle.contentFrame();

  console.log('filling form in iframe');
  // await frame.type('#Name', 'Bob', { delay: 100 });

  await frame.waitForSelector('#top-container');

  await frame.type('#top-container > div:nth-child(3) > label > input[type=text]', mailbox);
  await frame.type('#top-container > div:nth-child(4) > label > input[type=password]', '@Blassddfd34@%^');
  socket.emit('progress',50);

  await delay(5000);

  await waitAndClick('#signup-terms > label:nth-child(2) > input[type=radio]:nth-child(1)', frame);
  await waitAndClick('#signup-terms > label:nth-child(4) > input[type=checkbox]', frame);

  await delay(5000);

  //   await waitAndClick('#submit-email > i',page); 

  const buttonClick = await frame.evaluate(() => {
    // signupSubmit();
    return document.querySelector('#submit-email > i').click();
  });




  // Test the background page as you would any other page.
  //   await delay(400000);
  await page.waitForSelector('#swal2-title', { timeout: 0 }).then(() => {
    console.log("SignUp Success");
  });
  socket.emit('email',75);





  delay(5000);
  var { messages } = await getMessages(token);
  console.log(messages);
  var body = messages[0]["_id"];
  var msg = await getMessage(token, body);
  var html = msg["bodyHtml"];
  var actLink = getActLink(html);

  console.log(actLink);

  // var actLink;
  // await page1.waitForSelector(actSelector, {timeout:0}).then(() => {  
  //   console.log("Activation Mail GOT Success");
  //   // page1.click(actSelector);
  // });

  await delay(2000);

  //  actLink = await page1.evaluate(()=>{
  //   return document.querySelector('a[href*="seedr"]').href;
  // });

  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1920, height: 1080 });

  await page2.goto(actLink);

  //   actLink = await page1.evaluate(()=>{
  //     console.log("Activation Button GOT Success");
  //     return activateAccountSubmit() ;
  //   });

  await page2.waitForSelector("#activation-tab > div > div > div > p > button", { timeout: 0 }).then(() => {
    console.log("Activation Button GOT Success");
    page2.click("#activation-tab > div > div > div > p > button");
  });

  socket.emit('email',100);
  await delay(2000);
  await browser.close();
}


function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  });
}

async function waitAndClick(selector, page) {
  // Wait and click on first result
  const searchResultSelector = selector;
  await page.waitForSelector(searchResultSelector);
  await page.click(searchResultSelector);
}

// start();


io.on("connection", (socket) => {

  socket.on('startRegister', () => {
    void async function () {
      var emailNew = await start(socket);
        ;

    }().catch(
      err =>
        socket.emit('error', err.message)
    );
  });

  console.log('a user connected');

});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

server.listen(process.env.PORT || 3000, () => {
  console.log('listening on *:' + process.env.PORT ?? 3000);
});