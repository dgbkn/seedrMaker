const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { createMailBox, getMessages, getMessage } = require("./tempmail.js");
const { Server } = require("socket.io");
const request = require("request");
require("dotenv").config();
const fs = require("fs");

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

async function selectValues(page, elementId) {
  const selectElement = await page.$("#" + elementId);

  if (selectElement) {
    const selectValues = await page.evaluate((select) => {
      const options = Array.from(select.querySelectorAll("option"));
      return options
        .map((option) =>
          option.value ? [option.value, option.textContent] : null
        )
        .filter((option) => option);
    }, selectElement);

    return selectValues ?? [];
  }
}

var cors = require("cors");
app.use(cors());

const puppeteer = require("puppeteer");
const path = require("path");
const { getActLink, getFile } = require("./seedr.js");

async function start(socket) {
  try {
    var hierarchical_data = {};
    //   // console.log("CREATING TOKEN");
    //   var { token, mailbox } = await createMailBox();

    //   socket.emit('email', mailbox);

    //   console.log(token, mailbox);

    // const pathToExtension = path.join(process.cwd(), './hcap_solver');
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        // "--single-process",
        // "--no-zygote",
        // `--disable-extensions-except=${pathToExtension}`,
        // `--load-extension=${pathToExtension}`,
      ],
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(
      "https://jamabandi.punjab.gov.in/CadastralMap.aspx",
      (timeout = 0)
    );

    console.log("waiting for select with form to be ready.");
    await page.waitForSelector("select");
    console.log("select is ready. Loading select content");

    var districts = await selectValues(page, "ContentPlaceHolder1_ddlDistrict");

    for (let i = 0; i < districts.length; i++) {
      var district = districts[i];

      await page.select("#ContentPlaceHolder1_ddlDistrict", district[0]);
      await delay(2500);
      socket.emit("email", "district selected :" + district[1]);

      var tehsils = await selectValues(page, "ContentPlaceHolder1_ddlTehsil");
      hierarchical_data[district[1]] = { tehsils: {} };

      for (let j = 0; j < tehsils.length; j++) {
        await delay(2200);
        await page.select("#ContentPlaceHolder1_ddlTehsil", tehsils[j][0]);
        await delay(2500);
        socket.emit("email", "-> tehsil selected :" + tehsils[j][1]);

        hierarchical_data[district[1]]["tehsils"][tehsils[j][1]] = {
          villages: {},
        };

        var villages = await selectValues(
          page,
          "ContentPlaceHolder1_ddlVillage"
        );
        for (let k = 0; k < villages.length; k++) {
          try {
            await page.select(
              "#ContentPlaceHolder1_ddlVillage",
              villages[k][0]
            );
            await delay(2500);
            socket.emit("email", "-> -> Village :" + villages[k][1]);
            hierarchical_data[district[1]]["tehsils"][tehsils[j][1]][
              "villages"
            ][villages[k][1]] = { images: [] };

            //image srapping:
            // const linkSelector = 'div.col-md-2 a.link-blue';
            // const links = await page.$$(linkSelector);

            const links = await page.evaluate(() => {
              const linkSelector = "div.col-md-2 a.link-blue";
              const linkElements = document.querySelectorAll(linkSelector); // You can adjust the selector as needed.
              const linkArray = Array.from(linkElements);
              return linkArray.map((link) => link.href);
            });

            var page2 = await browser.newPage();

            // Iterate through the links and click each one.
            for (let i = 0; i < links.length; i++) {
              try {
                const link = links[i];
                socket.emit("email", link);

                page2.goto(
                  "https://jamabandi.punjab.gov.in/CadastralMap.aspx",
                  (timeout = 0)
                );
                await page2.waitForNavigation({
                  waitUntil: "domcontentloaded",
                });
                await page2.select(
                  "#ContentPlaceHolder1_ddlDistrict",
                  district[0]
                );
                await delay(2500);
                await page2.select(
                  "#ContentPlaceHolder1_ddlTehsil",
                  tehsils[j][0]
                );
                await delay(2500);
                await page2.select(
                  "#ContentPlaceHolder1_ddlVillage",
                  villages[k][0]
                );
                await delay(2500);
                try {
                  await page2.goto(link);
                } catch (e) {
                  console.log(e);
                }
                // await delay(2000);
                // await page2.setRequestInterception(true);

                await page2.waitForNavigation({
                  waitUntil: "domcontentloaded",
                });
                await page2.waitForSelector("img#ContentPlaceHolder1_imgMap");

                const imgSelector = "img#ContentPlaceHolder1_imgMap";
                const imgSrc = await page2.$eval(imgSelector, (img) => img.src);

                fetch(imgSrc)
                  .then((response) => {
                    return response.body;
                  })
                  .then(function (data) {
                    const download_write_stream = fs.createWriteStream(
                      `./images/${district[1]}-${tehsils[j][1]}-${villages[k][1]}-${i}.png`
                    );
                    const stream = new WritableStream({
                      write(chunk) {
                        download_write_stream.write(chunk);
                      },
                    });

                    console.log(data);
                    data.pipeTo(stream);

                    hierarchical_data[district[1]]["tehsils"][tehsils[j][1]][
                      "villages"
                    ][villages[k][1]]["images"].push(
                      `./images/${district[1]}-${tehsils[j][1]}-${villages[k][1]}-${i}.png`
                    );
                  });
              } catch (er) {
                console.log(er);
              }
            }
            await page2.close();

            //image srapping:

            // await page.click('#ContentPlaceHolder1_btnSearch');
          } catch (err) {
            console.log(err);
          }
        }
      }
      // console.log("tehsils", tehsils);
    }

    fs.writeFileSync(
      "hierarchical_data.json",
      JSON.stringify(hierarchical_data),
      "utf8",
      function (err) {
        console.log(err);
      }
    );

    await browser.close();
  } catch (e) {
    socket.emit("email", "Error" + e.message + e);
    console.log("Error" + e.message + e);
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
      res.header(
        "Content-Disposition",
        'attachment; filename="' + req.query.name + '"'
      );
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
    setTimeout(resolve, time);
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
  socket.on("startRegister", () => {
    void (async function () {
      var emailNew = await start(socket);
    })().catch((err) => socket.emit("error", err.message));
  });

  console.log("a user connected");
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

server.listen(process.env.PORT || 80, () => {
  console.log("listening on *:" + process.env.PORT ?? 3000);
});
