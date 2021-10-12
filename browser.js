const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const axios = require('axios');
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');
axiosCookieJarSupport(axios);


const profile = {
  //item      make sure to capitalize first letter in each field
  category: 'Shirts',
  keywords: 'Plaid',
  color: 'Black',
  size: 'Large',

  //delays
  monitorDelay: 500,   

  //proxy  leave proxy field blank for localhost, only proxy:port:user:pass supported
  proxy: '',

  //gmail  leave gmail field blank for no gmail login
  gmail: '', 
  password: '',

  //shipping and billing
  name: 'John Doe',
  email: 'carminesupreme12@gmail.com',
  telephone: '6462075111',
  address: '41 River Terrace',
  address2: 'apt. 1',
  zip: '10282',
  city: 'New York',
  state: 'NY',
  country: 'USA',
  cardnumber: '5313674694484398',
  expmonth: '08',
  expyear: '2027',
  cvv: '555',
};



async function main(cat, kw, color, size, monitordelay, mail, pass, proxy) {


  //delay function for monitor
  function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
  }


  var cookieJar = new tough.CookieJar();  //Creates cookie jar. Monitor get requests will get ratelimited very quickly without it


  //get request to find pid
  const getPID = {
    jar: cookieJar,
    withCredentials: true,
    method: 'get',
    url: 'https://www.supremenewyork.com/shop.json',
    headers: {
      'authority': 'www.supremenewyork.com',
      'sec-ch-ua': '"Google Chrome";v="93", " Not;A Brand";v="99", "Chromium";v="93"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.0 Safari/537.36',
      'accept': 'text/html,application/json,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'sec-fetch-site': 'none',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-user': '?1',
      'sec-fetch-dest': 'document',
      'accept-language': 'en-US,en;q=0.9',
    }
  };


  //performs get request and attempts to find the product id
  async function id(category, keywords) {
    //var allItems = await axios.get("https://www.supremenewyork.com/shop.json")
    var allItems = await axios(getPID);
    var category = allItems.data['products_and_categories'][category];

    for (item in category) {
      if (category[item]['name'].includes(keywords)) {
        var itemId = category[item]['id'];
        return itemId;
      }
    }
  }

  //monitor that returns the PID when found
  async function monitor(category, keyword, delay) {
    var product = await id(category, keyword);
    if (product === undefined) {
      while (product === undefined) {
        await sleep(delay);
        console.log('monitoring');
        var product = await id(category, keyword);
      }
    } else {
      console.log('in stock');
    }
    console.log('product found');
    return 'https://www.supremenewyork.com/shop/' + category + '/' + product;
  }


  //enables proxy if applicable 
  if (proxy !== '') {
    var proxySplit = proxy.split(/:|,/);
    var proxy1 = proxySplit[0];
    var proxy2 = proxySplit[1];
    var proxy3 = proxySplit[2];
    var proxy4 = proxySplit[3];
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        '--proxy-server=' + proxy1 + ':' + proxy2,
        '--proxy-bypass-list=<-loopback>',
      ],
    });
    
    
    

    await page.authenticate({
      username: proxy3,
      password: proxy4,
    });
    await console.log('proxy authenticated')
  } else {
    var browser = await puppeteer.launch({ headless: false });
    var page = await browser.newPage();
  }


  //gmail login if applicable 
  if (mail !== '') {
    await page.goto('https://www.google.com/gmail/about/#');
    await page.waitForSelector('body > header > div > div > div > a.button.button--medium.button--mobile-before-hero-only', {
      visible: true,
    });
    await page.waitForTimeout(Math.random() * 2000);
    await page.click('body > header > div > div > div > a.button.button--medium.button--mobile-before-hero-only');
    await page.waitForSelector('#identifierId', {
      visible: true,
    });
    await page.waitForTimeout(Math.random() * 2000);
    await page.type('#identifierId', mail, { delay: Math.random() * 150 });
    await page.waitForTimeout(Math.random() * 2000);
    await page.click('#identifierNext > div > button > div.VfPpkd-RLmnJb');
    await page.waitForSelector('#password > div.aCsJod.oJeWuf > div > div.Xb9hP > input', {
      visible: true,
    });
    await page.waitForTimeout(Math.random() * 2000);
    await page.type('#password > div.aCsJod.oJeWuf > div > div.Xb9hP > input', pass, { delay: Math.random() * 300 });
    await page.waitForTimeout(Math.random() * 2000);
    await page.click('#passwordNext > div > button > span');
  }

  //await page.waitForTimeout(Math.random() *1000 +1000)


  //monitor product and get product link
  var itemLink = await monitor(cat, kw, monitordelay);
  await page.goto(itemLink);


  //await page.waitForTimeout(Math.random() *1000 +1000)


  //select color
  await page.waitForSelector('button[data-style-name=' + color + ']', {
    visible: true,
  });
  try {
    page.click('button[data-style-name=' + color + ']');
  } catch {
    var currentUrl = await page.url();
    while (currentUrl == itemLink) {
      console.log('retrying color');
      await page.waitForTimeout(500);
      page.click('button[data-style-name=' + color + ']');
      var currentUrl = await page.url();
    };
  }
  await console.log('color selected');


  //await page.waitForTimeout(Math.random() * 1000 + 1000)


  //select size
  await page.waitForSelector('#size', {
    visible: true,
  });
  await page.click('#size')
  await page.waitForSelector('#size', {
    visible: true,
  });
  await page.type('#size', size, { delay: Math.random() * 10 });
  await page.waitForSelector('#size', {
    visible: true,
  });
  await page.click('#size');



  await console.log('size selected');


  //await page.waitForTimeout(Math.random() * 1000 + 1000)




  //add to cart
  page.waitForSelector('#add-remove-buttons > input', {
    visible: true,
  });
  try {
    page.click('#add-remove-buttons > input');
  } catch {
    await page.waitForTimeout(500)
    page.click('#add-remove-buttons > input');
  };

  await console.log('atc successful');


  //await page.waitForTimeout(Math.random() * 1000 + 1000)


  //go to checkout
  await page.waitForSelector('#add-remove-buttons > input', {
    visible: false,
  });
  await page.waitForSelector('#cart > a.button.checkout', {
    visible: true,
  });
  await page.click('#cart > a.button.checkout')


  //await page.waitForTimeout(Math.random() * 1000 + 1000)


  //enter shippping and billing
  const typeDelays = 1;   //delay of typing, increase as you please
  await page.waitForSelector('#order_billing_name', {
    visible: true,
  });
  await page.type('#order_billing_name', profile.name, { delay: Math.random() * typeDelays });
  await page.type('#order_email', profile.email, { delay: Math.random() * typeDelays });
  await page.type('#order_tel', profile.telephone, { delay: Math.random() * typeDelays });
  await page.type('#order_billing_address', profile.address, { delay: Math.random() * typeDelays });
  await page.type('#order_billing_address_2', profile.address2, { delay: Math.random() * typeDelays });
  await page.type('#order_billing_zip', profile.zip, { delay: Math.random() * typeDelays });
  await page.type('#order_billing_city', profile.city, { delay: Math.random() * typeDelays });
  await page.click('#zip_city_state_row > div.input.select.optional.order_billing_state')
  await page.type('#order_billing_state', profile.state, { delay: Math.random() * typeDelays });
  await page.click('#order_billing_country');
  await page.type('#order_billing_country', profile.country, { delay: Math.random() * typeDelays });
  await page.click('#order_billing_country');
  await page.type('#credit_card_number', profile.cardnumber, { delay: Math.random() * typeDelays });
  await page.select('#credit_card_month', profile.expmonth);
  await page.select('#credit_card_year', profile.expyear);
  await page.type('#credit_card_verification_value', profile.cvv, { delay: Math.random() * typeDelays });
  await page.click('#terms-checkbox > label > div > ins');
  await console.log('submitted profile');
  //await page.waitForTimeout(1000);
  await console.log('submitting order');
  await page.click('#pay > input');
}

main(profile.category, profile.keywords, profile.color, profile.size, profile.monitorDelay, profile.gmail, profile.password, profile.proxy);