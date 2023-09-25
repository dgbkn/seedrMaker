const puppeteer = require("puppeteer");
const fs = require("fs");

async function checkPasswordChanged(page) {
  const innerHTML = await page.evaluate(() =>
    document.body.innerHTML.toLowerCase()
  );
  return (
    innerHTML.includes("password was changed") ||
    innerHTML.includes("wrong password")
  );
}

async function checkDone(page) {
  const innerHTML = await page.evaluate(() =>
    document.body.innerHTML.toLowerCase()
  );
  return innerHTML.includes("locked out");
}

async function clickOnLinkWithText(page, linkText) {
  const links = await page.$$("a");
  for (const link of links) {
    const linkInnerText = await page.evaluate(
      (element) => element.textContent.toLowerCase(),
      link
    );
    if (linkInnerText.includes(linkText.toLowerCase())) {
      await link.click();
      return;
    }
  }
}

async function loginToGoogle(page, email, password) {
  const navigationPromise = page.waitForNavigation({
    waitUntil: "networkidle2", // Wait for no more than 0 network connections
  });
  await page.goto("https://accounts.google.com/");

  await navigationPromise;
  await delay(500);

  await page.waitForSelector('input[type="email"]');
  await page.click('input[type="email"]');

  await delay(500);
  await navigationPromise;

  await page.type('input[type="email"]', email);
  await delay(500);

  await page.waitForSelector("#identifierNext");
  await page.click("#identifierNext");
  await delay(6000);

  await navigationPromise;
  await delay(500);

  await page.waitForSelector('input[type="password"]');
  await page.type('input[type="password"]', password);

  await page.waitForSelector("#passwordNext");
  await page.click("#passwordNext");
  await delay(500);

  await navigationPromise;
  await delay(500);

  // Check if password was successfully entered
  await delay(3000);

  if (await checkPasswordChanged(page)) {
    console.log(
      "Password has been changed. You may need to recover your account."
    );
    return false;
  }

  if (await checkDone(page)) {
    console.log("Done.");
    await clickOnLinkWithText(page, "do this later");
    await delay(2000);
  }

  return true;
}

async function changePassword(page, newPassword) {
  //   const navigationPromise = page.waitForNavigation();
  const navigationPromise = page.waitForNavigation({
    waitUntil: "networkidle2", // Wait for no more than 0 network connections
  });
  console.log("Changing password...");
  await page.goto("https://myaccount.google.com/security");

  await delay(2000);

  await page.waitForSelector('a[aria-label="Password"]');
  await page.click('a[aria-label="Password"]');

  // You can continue with the password change logic as before.
  await navigationPromise;

  // Fill out the password change form (replace with actual selectors)
  await page.waitForSelector("input[name='password'");
  await page.type("input[name='password'", newPassword);

  await page.waitForSelector("input[name='confirmation_password'");
  await page.type("input[name='confirmation_password'", newPassword);

  await page.waitForSelector('button[type="submit"]');
  await page.click('button[type="submit"]');
  await delay(500);

  await delay(2000);
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  //read a file line by line
  var emails = fs.readFileSync("./userEmail.txt").toString().split("\n");

  //remove empty elements from array
  emails = emails.filter((email) => email);

  var users = require("./email.json");

  //find a user by email
  for (let i = 0; i < emails.length; i++) {
    var userWithEmail = users.find((user) => user.email === emails[i]);
    if (userWithEmail) {
      const email = userWithEmail.email;
      const currentPassword = "@Anu123456";
      const newPassword = userWithEmail.pass;

      const loggedIn = await loginToGoogle(page, email, currentPassword);

      if (loggedIn) {
        await changePassword(page, newPassword);
        console.log("Password changed successfully.");
      } else {
        console.log("Failed to log in.");
      }
    }

    await browser.close();
  }
})();

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}