
const puppeteer = require('puppeteer');
const path = require('path');


async function start(){

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


await page.goto('https://chat.openai.com/auth/login');

var selector = "button:nth-child(1)";
await waitAndClick(selector, page);

var selector_input = 'input:nth-child(2)';
await page.waitForSelector(selector_input);
await page.type(selector_input, "pwwalabkn@gmail.com");
await waitAndClick(selector, page);
await page.waitForSelector(selector_input);
await page.type(selector_input, "@Anu2240013");
await waitAndClick(selector, page);

await delay(40000);

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

start();