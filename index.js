const fs = require('fs')
const puppeteer = require('puppeteer')

async function run() {
    const browser = await puppeteer.launch(); //launches browser, allows to fire events, etc.
    const page = await browser.newPage();

    await page.goto('https://casesearch.cookcountyclerkofcourt.org/CivilCaseSearchAPI.aspx');
    await page.waitForSelector('#MainContent_ddlDatabase')
    await page.$eval('#MainContent_ddlDatabase', el => el.value = '2');
    await page.waitForSelector('#MainContent_txtCaseNumber');
    await page.$eval('#MainContent_txtCaseNumber', el => el.value = '2022L000001');
    await Promise.all([
        page.click('#MainContent_btnSearch'),
        page.waitForNavigation({waitfor: 'networkidle0'})
    ])

    //const caseInfo = await page.$eval('#MainContent_pnlDetails', el => el)
    await page.waitForSelector('#MainContent_pnlDetails')
    // const caseNo = await page.waitForSelector('text/Case Number')
    // const caseNoText = await caseNo.evaluate(el => el.textContent)
    // const caseType = await page.waitForSelector('text/Case Type')
    // const caseTypeText = await caseType.evaluate(el => el.textContent)
    // const caseType = await page.$$eval('#MainContent_lblCaseType', (elements) => elements.map(e => ({
    //         name: e.textContent.trim()
    //     })))
    //const caseInfo = await page.evaluate(() => document.body.innerText)
    
    // const allTables = await page.evaluate(() => Array.from(document.querySelectorAll('#MainContent_pnlDetails tbody'), (e) => ({
    //     caseNum: e.querySelector('#MainContent_lblCaseNumber').value
    // })))
    // const firstTable = await allTables[0]
    // const caseDetails = await page.evaluate(() => Array.from(document.querySelectorAll('table #MainContent_lblCaseNumber'), (e) => ({

    // })))
    const caseActivs = await page.waitForSelector('text/Case Activities')
    const caseInfo =  await page.$$eval('#MainContent_pnlDetails', (elements) => elements.map(e => ({
        caseNum: e.querySelector('#MainContent_lblCaseNumber').innerText,
        dateFiled: e.querySelector('#MainContent_lblDateFiled').innerText,
        caseType: e.querySelector('#MainContent_lblCaseType').innerText,
        plaintiff: e.querySelector('#MainContent_lblPlaintiffs').innerText,
        attorney: e.querySelector('#MainContent_lblAttorney').innerText.trim()
        //caseActivities: e.querySelectorAll('')
    })))

    const caseData = await page.evaluate(() => {
        const rows = document.querySelectorAll('table tr');
        return Array.from(rows, row => {
            const columns = row.querySelectorAll('td');
            return Array.from(columns, column => column.innerText.trim())
        })
    });
    
    const caseData2 = await page.evaluate(() => {
        const rows = document.querySelectorAll('')
    })
    // const returnActivity = await caseData.filter(activity => {
    //     if (activity.includes('Summons Returned') || activity.includes('Summons Served')) {
    //         return activity
    //     }
    // })

    console.log(caseData)
    //await page.screenshot({path: 'example.png', fullPage: true})


    //const html = await page.content();
    //const text = await page.evaluate(() => document.body.innerText)
    // const options = await page.evaluate(() => Array.from(document.querySelectorAll('#MainContent_ddlDatabase option'), (e) => ({
    //    name: e.textContent,
    //    value: e.value
    // })))

    // const divisions = await page.$$eval('#MainContent_ddlDatabase option', (elements) => elements.map(e => ({
    //     name: e.textContent.trim(),
    //     value: e.value
    // })))
    //console.log(divisions)


    // Save data to JSON file
    fs.writeFile('caseInfo.json', JSON.stringify(caseInfo), (err) => {
        if (err) throw err;
        console.log('File saved')
    })
    
    await browser.close();
}

run();


//https://danfo.jsdata.org/