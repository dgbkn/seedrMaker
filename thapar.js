const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { createMailBox, getMessages, getMessage } = require('./tempmail.js');
const { Server } = require("socket.io");
const request = require("request");
require("dotenv").config();
const fs = require('fs');

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});


async function checkPasswordChanged(page) {
  const innerHTML = await page.evaluate(() => document.body.innerHTML.toLowerCase());
  return innerHTML.includes('password was changed') || innerHTML.includes('wrong password');
}


async function checkDone(page) {
  const innerHTML = await page.evaluate(() => document.body.innerHTML.toLowerCase());
  return innerHTML.includes('locked out');
}




var cors = require("cors");
app.use(cors());

const puppeteer = require('puppeteer');
const path = require('path');
const { getActLink, getFile } = require('./seedr.js');

async function start(socket,e,m) {
  try{
  // console.log("CREATING TOKEN");
  const pathToExtension = path.join(process.cwd(), './hcap_solver');
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      '--disable-dev-shm-usage',
      // "--single-process",
      // "--no-zygote",
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });



const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });

const navigationPromise = page.waitForNavigation()

await page.goto('https://accounts.google.com/')

await navigationPromise

await page.waitForSelector('input[type="email"]')
await page.click('input[type="email"]')

await navigationPromise

//TODO : change to your email 
await page.type('input[type="email"]', e)

await page.waitForSelector('#identifierNext')
await page.click('#identifierNext')

await navigationPromise

await delay(7000);
await page.waitForSelector('input[type="password"]')
// await page.click('input[type="email"]')
await delay(500);

//TODO : change to your password
await page.type('input[type="password"]', m);

await page.waitForSelector('#passwordNext');
await page.click('#passwordNext');


await navigationPromise
await delay(3000);

if(await checkPasswordChanged(page)) {
  await browser.close();
  console.log(e + ' Password has been changed. You may need to recover your account.');

 return false;
}

await page.waitForSelector('input[type="submit"]')
await page.click('input[type="submit"]')
await delay(500);

await navigationPromise
await delay(500);

await page.waitForSelector('input[name="Password"]')
await page.type('input[name="Password"]', '@Anu123456')
await page.type('input[name="ConfirmPassword"]', '@Anu123456')
await delay(500);

await page.click('input[type="submit"]')

await navigationPromise
// // await delay(2000);
// if(await checkDone(page)) {
//   await browser.close();
//   return true;
// }

await browser.close();
return true;
    
}catch(e){
  socket.emit('email', "Error" + e.message + e);
  console.log( "Error" + e.message + e);
 return false;
}
}



app.get("/proxy", (req, res) => {
  try {
    var uri = req.query.url;
    var file = req.query.file;
    var token = req.query.token;

    if (!file || !token) {
      res.send("pehle maal bhejo");
    }

    var uri = getFile(file, token);
    if (req.query.name) {
      res.header('Content-Disposition', 'attachment; filename="' + req.query.name + '"');
    }

    req
      .pipe(request.get(uri))
      .on("error", function (e) {
        res.send(e);
      })
      .pipe(res);


  } catch (e) {
    res.send(e);
  }
});


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

var emails = require('./email.json');

io.on("connection", (socket) => {

  socket.on('startRegister', () => {

    void async function () {

      for (let i = 0; i < emails.length; i++) {
        if(i < 734){
          continue;
        }
        const email = emails[i];
        var emailNew = await start(socket,email.email,email.pass);
        if(emailNew){
          console.log("hogaaa " + email.email);
          
          fs.appendFileSync('userEmail.txt', `${email.email}\n`);
        }
        await delay(2000);
      }
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