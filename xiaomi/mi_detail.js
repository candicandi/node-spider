var ProgressBar = require('progress');

const mi_detail = require('./mi_detail');

const SIZE = 100;

const mi_list = async function (browser, appList) {
  let data = [];
  let bar = new ProgressBar(':bar :current/:total', { total: appList.length });

  // 线上服务器2核2g内存，开五个tab会puppeteer会报错https://github.com/GoogleChrome/puppeteer/issues/1385，本地4核8g开五个没毛病
  let promises = [], tabsNum = SIZE;

  for (let i = 0; i < appList.length; i++) {
    // 将所有页面分组，依次按组同时打开5个标签页爬取，提高效率
    const groupIndex = parseInt(i / tabsNum, 10);
    promises[groupIndex] = promises[groupIndex] ? promises[groupIndex] : [];
    promises[parseInt(i / tabsNum, 10)].push(appList[i]);
  }

  for (let i = 0; i < promises.length; i++) {
    await Promise.all(promises[i].map(async runPage => {
      let result = await startPage(browser, runPage);
      data.push(result);
      bar.tick(1);
    }))
  }

  return data;
}

async function startPage(browser, runPage) {
  const page = await browser.newPage();

  let appName = ''
  let company = ''

  try {
    await page.goto(runPage);
    await page.waitFor(200);

    // app名 公司名
    appName = await page.$eval('.intro-titles h3', el => el.innerHTML);
    company = await page.$eval('.intro-titles p', el => el.innerHTML);

    await page.close();
  } catch (e) {
    console.log(e);
    await page.close();
  }

  if (!appName || !company) {
    console.log('~~~', runPage)
  }

  return {
    appName,
    company
  }
}

module.exports = mi_list