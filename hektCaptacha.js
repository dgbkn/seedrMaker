const puppeteer = require("puppeteer");
const path = require("path");
const axios = require("axios");
const { createMailBox, getMessages, getMessage } = require('./tempmail.js');

async function gethektCapatchaResponse() {
  const pathToExtension = path.join(process.cwd(), "./hcap_solver");
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--disable-dev-shm-usage",
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

  await page.goto(
    "https://hcaptcha.projecttac.com/?sitekey=51a29fc5-2821-4978-87c8-3a13ce9f048b",
    (timeout = 0)
  );
  await page.waitForFunction(
    'document.querySelector("#resp").value.length > 7'
  );

  const element = await page.waitForSelector("#resp"); // select the element
  const value = await element.evaluate((el) => el.value); // grab the textContent from the element, by evaluating this function in the browser context

  console.log("VAL::" + value);
  await browser.close();
  return value;
}

async function seedrSignUp() {
  var hResp = await gethektCapatchaResponse();
  var { token, mailbox } = await createMailBox();

  let data = JSON.stringify({
    fakeusernameremembered: "",
    username: mailbox,
    password: "@Blassddfd34@%^",
    optin: "1",
    accept_terms: "on",
    "g-recaptcha-response": "",
    "h-captcha-response":hResp,
  });

  let config = {
    method: "post",
    url: "https://www.seedr.cc/auth/create/verify",
    headers: {
      authority: "www.seedr.cc",
      "content-type": "application/json",
      origin: "https://www.seedr.cc",
      referer: "https://www.seedr.cc/auth/pages/signup",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
    },
    data: data,
  };

  axios
    .request(config)
    .then((response) => {
    if(response.data.success){
        console.log("Created : " + mailbox)
        return true;
    }
    return false;
    })
    .catch((error) => {
      return false;
    });
}

seedrSignUp();
